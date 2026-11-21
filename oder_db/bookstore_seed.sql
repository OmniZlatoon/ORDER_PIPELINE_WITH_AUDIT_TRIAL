-- =====================================================================
--  ORDER PIPELINE WITH AUDIT TRAIL  |  SEED DATA
--  Run AFTER bookstore_schema.sql:
--      mysql -u root -p bookstore_pipeline < bookstore_seed.sql
--
--  Contains: the book catalogue (prices in XAF, illustrative), plus two
--  demo orders so the Order Processing Monitor has data on first start:
--      ORD-2026-00001  COMPLETED       (all six stages, both observers)
--      ORD-2026-00002  FAILED at Process Payment (no observers)
--  Book 9 has low stock (2) and book 10 is out of stock (0) so the
--  insufficient-stock scenario can be demonstrated immediately.
-- =====================================================================

USE bookstore_pipeline;

-- ---------------------------------------------------------------------
--  Catalogue (explicit IDs keep Postman / test requests predictable)
-- ---------------------------------------------------------------------
INSERT INTO books (book_id, title, author, price, stock_quantity) VALUES
    (1,  'Clean Code',                           'Robert C. Martin',                                     4000.00, 25),
    (2,  'Design Patterns',                      'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 5000.00, 15),
    (3,  'Effective Java',                       'Joshua Bloch',                                         4500.00, 20),
    (4,  'Head First Design Patterns',           'Eric Freeman, Elisabeth Robson',                       4800.00, 12),
    (5,  'Refactoring',                          'Martin Fowler',                                        4200.00, 10),
    (6,  'Spring in Action',                     'Craig Walls',                                          3800.00, 18),
    (7,  'Things Fall Apart',                    'Chinua Achebe',                                        2500.00, 30),
    (8,  'Learning SQL',                         'Alan Beaulieu',                                        3200.00, 14),
    (9,  'The Pragmatic Programmer',             'Andrew Hunt, David Thomas',                            4600.00,  2),
    (10, 'Domain-Driven Design',                 'Eric Evans',                                           5500.00,  0);

-- Opening balances in the stock ledger (skips out-of-stock titles because
-- a ledger row must have a non-zero change)
INSERT INTO stock_movements (book_id, order_id, movement_type, quantity_change, stock_after)
SELECT book_id, NULL, 'INITIAL', stock_quantity, stock_quantity
FROM books
WHERE stock_quantity > 0;

-- ---------------------------------------------------------------------
--  Demo customers
-- ---------------------------------------------------------------------
INSERT INTO customers (customer_id, full_name, email, created_at) VALUES
    (1, 'Alex Example', 'alex@example.com', '2026-11-19 09:14:55'),
    (2, 'Mary Example', 'mary@example.com', '2026-11-19 09:19:55');

-- =====================================================================
--  DEMO ORDER 1: successful order  (2 x Clean Code + 1 x Effective Java)
--  2 x 4000.00 + 1 x 4500.00 = 12500.00
-- =====================================================================
INSERT INTO orders
    (order_id, order_reference, customer_id, total_amount, order_status,
     payment_status, failed_step, failure_message, created_at, completed_at)
VALUES
    (1, 'ORD-2026-00001', 1, 12500.00, 'COMPLETED', 'SUCCESS',
     NULL, NULL, '2026-11-19 09:15:00', '2026-11-19 09:15:01');

INSERT INTO order_items (order_id, book_id, quantity, unit_price, line_total) VALUES
    (1, 1, 2, 4000.00, 8000.00),
    (1, 3, 1, 4500.00, 4500.00);

INSERT INTO audit_logs (order_id, step_name, execution_status, message, created_at) VALUES
    (1, 'Validate Order',  'STARTED', 'Validation started',                                   '2026-11-19 09:15:00.100'),
    (1, 'Validate Order',  'SUCCESS', 'Customer details and items are valid',                 '2026-11-19 09:15:00.140'),
    (1, 'Check Inventory', 'STARTED', 'Inventory check started',                              '2026-11-19 09:15:00.150'),
    (1, 'Check Inventory', 'SUCCESS', 'Stock available for all requested books',              '2026-11-19 09:15:00.210'),
    (1, 'Calculate Total', 'STARTED', 'Total calculation started',                            '2026-11-19 09:15:00.220'),
    (1, 'Calculate Total', 'SUCCESS', 'Order total calculated: 12500.00',                     '2026-11-19 09:15:00.260'),
    (1, 'Process Payment', 'STARTED', 'Simulated payment started',                            '2026-11-19 09:15:00.270'),
    (1, 'Process Payment', 'SUCCESS', 'Simulated payment approved',                           '2026-11-19 09:15:00.480'),
    (1, 'Confirm Order',   'STARTED', 'Order confirmation started',                           '2026-11-19 09:15:00.490'),
    (1, 'Confirm Order',   'SUCCESS', 'Order confirmed; stock deducted',                      '2026-11-19 09:15:00.520'),
    (1, 'Complete Order',  'STARTED', 'Order completion started',                             '2026-11-19 09:15:00.530'),
    (1, 'Complete Order',  'SUCCESS', 'Order completed; OrderCompleted event prepared',       '2026-11-19 09:15:00.570');

INSERT INTO payments
    (order_id, amount, payment_method, status, transaction_reference, failure_reason, created_at)
VALUES
    (1, 12500.00, 'SIMULATED', 'SUCCESS', 'SIM-20261119-0001', NULL, '2026-11-19 09:15:00');

-- Stock deduction performed by stage 5 (Confirm Order)
UPDATE books SET stock_quantity = stock_quantity - 2 WHERE book_id = 1;   -- 25 -> 23
UPDATE books SET stock_quantity = stock_quantity - 1 WHERE book_id = 3;   -- 20 -> 19

INSERT INTO stock_movements
    (book_id, order_id, movement_type, quantity_change, stock_after, created_at)
VALUES
    (1, 1, 'SALE', -2, 23, '2026-11-19 09:15:00'),
    (3, 1, 'SALE', -1, 19, '2026-11-19 09:15:00');

-- Observer outcomes (created only after the order transaction committed)
INSERT INTO notifications
    (order_id, notification_type, status, message, attempts, created_at, sent_at)
VALUES
    (1, 'SHIPPING', 'SENT', 'Simulated shipment request created for ORD-2026-00001',   1, '2026-11-19 09:15:01', '2026-11-19 09:15:01'),
    (1, 'EMAIL',    'SENT', 'Simulated confirmation email sent to alex@example.com',   1, '2026-11-19 09:15:01', '2026-11-19 09:15:01');

-- =====================================================================
--  DEMO ORDER 2: payment failure  (1 x Head First Design Patterns +
--  2 x Things Fall Apart)  4800.00 + 2 x 2500.00 = 9800.00
--  Stages 1-3 succeed, stage 4 fails, stages 5-6 never run,
--  no stock deducted, no notifications.
-- =====================================================================
INSERT INTO orders
    (order_id, order_reference, customer_id, total_amount, order_status,
     payment_status, failed_step, failure_message, created_at, completed_at)
VALUES
    (2, 'ORD-2026-00002', 2, 9800.00, 'FAILED', 'FAILED',
     'Process Payment', 'Simulated payment declined', '2026-11-19 09:20:00', NULL);

INSERT INTO order_items (order_id, book_id, quantity, unit_price, line_total) VALUES
    (2, 4, 1, 4800.00, 4800.00),
    (2, 7, 2, 2500.00, 5000.00);

INSERT INTO audit_logs (order_id, step_name, execution_status, message, created_at) VALUES
    (2, 'Validate Order',  'STARTED', 'Validation started',                          '2026-11-19 09:20:00.100'),
    (2, 'Validate Order',  'SUCCESS', 'Customer details and items are valid',        '2026-11-19 09:20:00.140'),
    (2, 'Check Inventory', 'STARTED', 'Inventory check started',                     '2026-11-19 09:20:00.150'),
    (2, 'Check Inventory', 'SUCCESS', 'Stock available for all requested books',     '2026-11-19 09:20:00.210'),
    (2, 'Calculate Total', 'STARTED', 'Total calculation started',                   '2026-11-19 09:20:00.220'),
    (2, 'Calculate Total', 'SUCCESS', 'Order total calculated: 9800.00',             '2026-11-19 09:20:00.260'),
    (2, 'Process Payment', 'STARTED', 'Simulated payment started',                   '2026-11-19 09:20:00.270'),
    (2, 'Process Payment', 'FAILED',  'Simulated payment declined',                  '2026-11-19 09:20:00.400');

INSERT INTO payments
    (order_id, amount, payment_method, status, transaction_reference, failure_reason, created_at)
VALUES
    (2, 9800.00, 'SIMULATED', 'FAILED', NULL, 'Simulated payment declined', '2026-11-19 09:20:00');
