-- =====================================================================
--  ORDER PIPELINE WITH AUDIT TRAIL  |  QUERIES
--  Part A: the queries behind each REST endpoint / monitor panel
--  Part B: integrity checks to run after tests (each should return 0 rows
--          unless the comment says otherwise)
--  Set the order you want to inspect first:
-- =====================================================================

USE bookstore_pipeline;
SET @order_id = 1;

-- ---------------------------------------------------------------------
--  PART A: API / MONITOR QUERIES
-- ---------------------------------------------------------------------

-- A1. GET /api/books  (catalogue)
SELECT book_id, title, author, price, stock_quantity
FROM books
ORDER BY title;

-- A2. GET /api/orders/{orderId}  (order summary)
SELECT o.order_id, o.order_reference, c.full_name, c.email,
       o.total_amount, o.order_status, o.payment_status,
       o.failed_step, o.failure_message, o.created_at, o.completed_at
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.order_id = @order_id;

-- A3. Order lines for the summary
SELECT b.title, oi.quantity, oi.unit_price, oi.line_total
FROM order_items oi
JOIN books b ON b.book_id = oi.book_id
WHERE oi.order_id = @order_id
ORDER BY oi.order_item_id;

-- A4. Monitor: pipeline timeline (SUCCESS / FAILED / NOT_EXECUTED per stage)
SELECT step_number, step_name, stage_status, started_at, finished_at
FROM v_order_pipeline_timeline
WHERE order_id = @order_id
ORDER BY step_number;

-- A5. GET /api/orders/{orderId}/audit  (chronological audit history)
SELECT audit_id, step_name, execution_status, message, created_at
FROM audit_logs
WHERE order_id = @order_id
ORDER BY audit_id;

-- A6. GET /api/orders/{orderId}/notifications  (both observers)
SELECT notification_type, observer_status, message, attempts, created_at, sent_at
FROM v_order_notification_status
WHERE order_id = @order_id
ORDER BY notification_type;

-- A7. Payment attempts for the order
SELECT payment_id, amount, payment_method, status, transaction_reference,
       failure_reason, created_at
FROM payments
WHERE order_id = @order_id
ORDER BY payment_id;

-- ---------------------------------------------------------------------
--  PART B: INTEGRITY CHECKS
-- ---------------------------------------------------------------------

-- B1. Confirmed/completed orders whose total does not equal the sum of lines
SELECT o.order_id, o.order_reference, o.total_amount, SUM(oi.line_total) AS items_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.order_status IN ('CONFIRMED','COMPLETED')
GROUP BY o.order_id, o.order_reference, o.total_amount
HAVING o.total_amount <> SUM(oi.line_total);

-- B2. COMPLETED orders that do not have exactly 6 SUCCESS stages
SELECT o.order_id, o.order_reference, COUNT(DISTINCT a.step_name) AS stages_succeeded
FROM orders o
LEFT JOIN audit_logs a
       ON a.order_id = o.order_id AND a.execution_status = 'SUCCESS'
WHERE o.order_status = 'COMPLETED'
GROUP BY o.order_id, o.order_reference
HAVING COUNT(DISTINCT a.step_name) <> 6;

-- B3. COMPLETED orders that do not have exactly one SHIPPING and one EMAIL record
SELECT o.order_id, o.order_reference,
       SUM(n.notification_type = 'SHIPPING') AS shipping_count,
       SUM(n.notification_type = 'EMAIL')    AS email_count
FROM orders o
LEFT JOIN notifications n ON n.order_id = o.order_id
WHERE o.order_status = 'COMPLETED'
GROUP BY o.order_id, o.order_reference
HAVING COALESCE(SUM(n.notification_type = 'SHIPPING'), 0) <> 1
    OR COALESCE(SUM(n.notification_type = 'EMAIL'), 0)    <> 1;

-- B4. FAILED orders that wrongly triggered an observer
SELECT o.order_id, o.order_reference, n.notification_type
FROM orders o
JOIN notifications n ON n.order_id = o.order_id
WHERE o.order_status = 'FAILED';

-- B5. FAILED orders with no FAILED audit event for their failed_step
SELECT o.order_id, o.order_reference, o.failed_step
FROM orders o
WHERE o.order_status = 'FAILED'
  AND NOT EXISTS (
        SELECT 1 FROM audit_logs a
        WHERE a.order_id = o.order_id
          AND a.step_name = o.failed_step
          AND a.execution_status = 'FAILED');

-- B6. Stages that ran after a failure (must never happen)
SELECT o.order_id, o.order_reference, a.step_name, a.execution_status
FROM orders o
JOIN pipeline_steps failed ON failed.step_name = o.failed_step
JOIN audit_logs a          ON a.order_id = o.order_id
JOIN pipeline_steps ran    ON ran.step_name = a.step_name
WHERE o.order_status = 'FAILED'
  AND ran.step_number > failed.step_number;

-- B7. Stock reconciliation: ledger total must equal books.stock_quantity
SELECT b.book_id, b.title, b.stock_quantity,
       COALESCE(SUM(sm.quantity_change), 0) AS ledger_total
FROM books b
LEFT JOIN stock_movements sm ON sm.book_id = b.book_id
GROUP BY b.book_id, b.title, b.stock_quantity
HAVING b.stock_quantity <> COALESCE(SUM(sm.quantity_change), 0);

-- B8. Orders still PENDING/PROCESSING for more than 5 minutes
--     (a crashed pipeline; review manually)
SELECT order_id, order_reference, order_status, created_at
FROM orders
WHERE order_status IN ('PENDING','PROCESSING')
  AND created_at < NOW() - INTERVAL 5 MINUTE;

-- B9. Prove the audit trail is append-only (each statement must be REJECTED
--     with "audit_logs is append-only"). Uncomment one at a time to test.
-- UPDATE audit_logs SET message = 'tampered' WHERE audit_id = 1;
-- DELETE FROM audit_logs WHERE audit_id = 1;
