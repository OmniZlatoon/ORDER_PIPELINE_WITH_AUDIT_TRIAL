-- =====================================================================
--  ORDER PIPELINE WITH AUDIT TRAIL  |  DATABASE SCHEMA
--  Target: MySQL 8.0.16+ or MariaDB 10.4+ (XAMPP), InnoDB (enforced CHECK constraints required)
--  Run with the mysql client or MySQL Workbench (the script uses DELIMITER):
--      mysql -u root -p < bookstore_schema.sql
--
--  WARNING: this script RESETS the schema. It drops and recreates every
--  table, so run it only on a development database.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS bookstore_pipeline
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bookstore_pipeline;

-- ---------------------------------------------------------------------
--  Reset (children first so foreign keys never block a drop)
-- ---------------------------------------------------------------------
DROP VIEW  IF EXISTS v_order_notification_status;
DROP VIEW  IF EXISTS v_order_pipeline_timeline;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS pipeline_steps;

-- ---------------------------------------------------------------------
--  1. pipeline_steps  (reference data: the six fixed stages)
--     Lets the monitor show stages that were NOT EXECUTED, and stops
--     audit_logs from containing a misspelled stage name.
-- ---------------------------------------------------------------------
CREATE TABLE pipeline_steps (
    step_number  TINYINT UNSIGNED NOT NULL,
    step_name    VARCHAR(80)      NOT NULL,
    description  VARCHAR(255)     NOT NULL,
    PRIMARY KEY (step_number),
    UNIQUE KEY uq_pipeline_steps_name (step_name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  2. customers
-- ---------------------------------------------------------------------
CREATE TABLE customers (
    customer_id  BIGINT       NOT NULL AUTO_INCREMENT,
    full_name    VARCHAR(120) NOT NULL,
    email        VARCHAR(190) NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id),
    KEY idx_customers_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  3. books
-- ---------------------------------------------------------------------
CREATE TABLE books (
    book_id         BIGINT        NOT NULL AUTO_INCREMENT,
    title           VARCHAR(200)  NOT NULL,
    author          VARCHAR(150)  NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    stock_quantity  INT           NOT NULL DEFAULT 0,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id),
    UNIQUE KEY uq_books_title_author (title, author),
    CONSTRAINT ck_books_price CHECK (price > 0),
    CONSTRAINT ck_books_stock CHECK (stock_quantity >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  4. orders
-- ---------------------------------------------------------------------
CREATE TABLE orders (
    order_id         BIGINT        NOT NULL AUTO_INCREMENT,
    order_reference  VARCHAR(40)   NOT NULL,
    customer_id      BIGINT        NOT NULL,
    total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    order_status     VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    payment_status   VARCHAR(30)   NOT NULL DEFAULT 'NOT_PROCESSED',
    failed_step      VARCHAR(80)   NULL,
    failure_message  VARCHAR(255)  NULL,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at     DATETIME      NULL,
    PRIMARY KEY (order_id),
    UNIQUE KEY uq_orders_reference (order_reference),
    KEY idx_orders_customer (customer_id),
    KEY idx_orders_status (order_status),
    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    CONSTRAINT fk_orders_failed_step
        FOREIGN KEY (failed_step) REFERENCES pipeline_steps (step_name),
    CONSTRAINT ck_orders_total CHECK (total_amount >= 0),
    CONSTRAINT ck_orders_status
        CHECK (order_status IN ('PENDING','PROCESSING','CONFIRMED','COMPLETED','FAILED')),
    CONSTRAINT ck_orders_payment_status
        CHECK (payment_status IN ('NOT_PROCESSED','SUCCESS','FAILED')),
    -- completed_at is set if, and only if, the order is COMPLETED
    CONSTRAINT ck_orders_completed_at
        CHECK ((order_status = 'COMPLETED' AND completed_at IS NOT NULL)
            OR (order_status <> 'COMPLETED' AND completed_at IS NULL)),
    -- a FAILED order must say which stage failed
    CONSTRAINT ck_orders_failed_step
        CHECK (order_status <> 'FAILED' OR failed_step IS NOT NULL)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  5. order_items
--     unit_price / line_total are NULL until stage 3 (Calculate Total)
--     fills them; the CHECK keeps the pair consistent once filled.
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
    order_item_id  BIGINT        NOT NULL AUTO_INCREMENT,
    order_id       BIGINT        NOT NULL,
    book_id        BIGINT        NOT NULL,
    quantity       INT           NOT NULL,
    unit_price     DECIMAL(10,2) NULL,
    line_total     DECIMAL(10,2) NULL,
    PRIMARY KEY (order_item_id),
    UNIQUE KEY uq_order_items_order_book (order_id, book_id),
    KEY idx_order_items_book (book_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT fk_order_items_book
        FOREIGN KEY (book_id) REFERENCES books (book_id),
    CONSTRAINT ck_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT ck_order_items_pricing
        CHECK ((unit_price IS NULL AND line_total IS NULL)
            OR (unit_price IS NOT NULL AND line_total IS NOT NULL
                AND unit_price >= 0
                AND line_total = quantity * unit_price))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  6. audit_logs  (append-only; written by the AuditDecorator)
--     DATETIME(3) keeps STARTED/SUCCESS pairs distinguishable and
--     ordered inside the same second; audit_id is the tie-breaker.
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    audit_id          BIGINT       NOT NULL AUTO_INCREMENT,
    order_id          BIGINT       NOT NULL,
    step_name         VARCHAR(80)  NOT NULL,
    execution_status  VARCHAR(20)  NOT NULL,
    message           TEXT         NULL,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (audit_id),
    KEY idx_audit_logs_order (order_id, audit_id),
    KEY idx_audit_logs_step (step_name),
    CONSTRAINT fk_audit_logs_order
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT fk_audit_logs_step
        FOREIGN KEY (step_name) REFERENCES pipeline_steps (step_name),
    CONSTRAINT ck_audit_logs_status
        CHECK (execution_status IN ('STARTED','SUCCESS','FAILED'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  7. payments  (every attempt made through the simulated gateway)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    payment_id             BIGINT        NOT NULL AUTO_INCREMENT,
    order_id               BIGINT        NOT NULL,
    amount                 DECIMAL(10,2) NOT NULL,
    payment_method         VARCHAR(30)   NOT NULL DEFAULT 'SIMULATED',
    status                 VARCHAR(20)   NOT NULL,
    transaction_reference  VARCHAR(60)   NULL,
    failure_reason         VARCHAR(255)  NULL,
    created_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    UNIQUE KEY uq_payments_txn (transaction_reference),
    KEY idx_payments_order (order_id),
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT ck_payments_amount CHECK (amount >= 0),
    CONSTRAINT ck_payments_status CHECK (status IN ('SUCCESS','FAILED')),
    CONSTRAINT ck_payments_outcome
        CHECK ((status = 'SUCCESS' AND transaction_reference IS NOT NULL)
            OR (status = 'FAILED'  AND failure_reason IS NOT NULL))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  8. notifications  (one row per observer per order)
--     UNIQUE (order_id, notification_type) is the idempotency guard:
--     a repeated OrderCompleted event cannot create a second record;
--     retries increment `attempts` on the existing row instead.
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
    notification_id    BIGINT       NOT NULL AUTO_INCREMENT,
    order_id           BIGINT       NOT NULL,
    notification_type  VARCHAR(20)  NOT NULL,
    status             VARCHAR(20)  NOT NULL DEFAULT 'CREATED',
    message            TEXT         NULL,
    attempts           INT          NOT NULL DEFAULT 1,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at            DATETIME     NULL,
    PRIMARY KEY (notification_id),
    UNIQUE KEY uq_notifications_order_type (order_id, notification_type),
    CONSTRAINT fk_notifications_order
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT ck_notifications_type
        CHECK (notification_type IN ('SHIPPING','EMAIL')),
    CONSTRAINT ck_notifications_status
        CHECK (status IN ('CREATED','SENT','FAILED')),
    CONSTRAINT ck_notifications_attempts CHECK (attempts >= 1),
    CONSTRAINT ck_notifications_sent_at
        CHECK (status <> 'SENT' OR sent_at IS NOT NULL)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  9. stock_movements  (ledger behind books.stock_quantity)
--     UNIQUE (order_id, book_id, movement_type) stops the same order
--     from deducting the same book twice. NULL order_id rows
--     (INITIAL / ADJUSTMENT) are not affected by the unique key.
-- ---------------------------------------------------------------------
CREATE TABLE stock_movements (
    movement_id      BIGINT       NOT NULL AUTO_INCREMENT,
    book_id          BIGINT       NOT NULL,
    order_id         BIGINT       NULL,
    movement_type    VARCHAR(20)  NOT NULL,
    quantity_change  INT          NOT NULL,
    stock_after      INT          NOT NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movement_id),
    UNIQUE KEY uq_stock_movements_sale (order_id, book_id, movement_type),
    KEY idx_stock_movements_book (book_id, movement_id),
    CONSTRAINT fk_stock_movements_book
        FOREIGN KEY (book_id) REFERENCES books (book_id),
    CONSTRAINT fk_stock_movements_order
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT ck_stock_movements_type
        CHECK (movement_type IN ('INITIAL','SALE','ADJUSTMENT')),
    CONSTRAINT ck_stock_movements_change CHECK (quantity_change <> 0),
    CONSTRAINT ck_stock_movements_after  CHECK (stock_after >= 0),
    CONSTRAINT ck_stock_movements_sale
        CHECK (movement_type <> 'SALE' OR (quantity_change < 0 AND order_id IS NOT NULL))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Reference data: the six pipeline stages (do not change the names
--  without changing the Java stage constants too)
-- ---------------------------------------------------------------------
INSERT INTO pipeline_steps (step_number, step_name, description) VALUES
    (1, 'Validate Order',  'Customer name and email present and valid; at least one item; positive quantities'),
    (2, 'Check Inventory', 'Every requested quantity is available in books.stock_quantity'),
    (3, 'Calculate Total', 'Database prices copied to order_items; line totals and order total calculated'),
    (4, 'Process Payment', 'Simulated payment; payment_status becomes SUCCESS or FAILED'),
    (5, 'Confirm Order',   'Order moved to CONFIRMED after payment succeeds; stock deducted'),
    (6, 'Complete Order',  'Order marked COMPLETED, completed_at set, OrderCompleted event prepared');

-- ---------------------------------------------------------------------
--  Append-only enforcement for audit_logs
-- ---------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'audit_logs is append-only: UPDATE is not allowed';
END$$

CREATE TRIGGER trg_audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'audit_logs is append-only: DELETE is not allowed';
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
--  Monitor view 1: one row per order per stage, including stages that
--  never ran (NOT_EXECUTED). Order the result by step_number.
-- ---------------------------------------------------------------------
CREATE VIEW v_order_pipeline_timeline AS
SELECT
    o.order_id,
    o.order_reference,
    ps.step_number,
    ps.step_name,
    CASE
        WHEN SUM(a.execution_status = 'FAILED')  > 0 THEN 'FAILED'
        WHEN SUM(a.execution_status = 'SUCCESS') > 0 THEN 'SUCCESS'
        WHEN SUM(a.execution_status = 'STARTED') > 0 THEN 'IN_PROGRESS'
        ELSE 'NOT_EXECUTED'
    END AS stage_status,
    MIN(CASE WHEN a.execution_status = 'STARTED' THEN a.created_at END)
        AS started_at,
    MAX(CASE WHEN a.execution_status IN ('SUCCESS','FAILED') THEN a.created_at END)
        AS finished_at
FROM orders o
CROSS JOIN pipeline_steps ps
LEFT JOIN audit_logs a
       ON a.order_id  = o.order_id
      AND a.step_name = ps.step_name
GROUP BY o.order_id, o.order_reference, ps.step_number, ps.step_name;

-- ---------------------------------------------------------------------
--  Monitor view 2: both observers for every order; NOT_TRIGGERED when
--  no notification row exists.
-- ---------------------------------------------------------------------
CREATE VIEW v_order_notification_status AS
SELECT
    o.order_id,
    o.order_reference,
    t.notification_type,
    COALESCE(n.status, 'NOT_TRIGGERED') AS observer_status,
    n.message,
    n.attempts,
    n.created_at,
    n.sent_at
FROM orders o
CROSS JOIN (
    SELECT 'SHIPPING' COLLATE utf8mb4_unicode_ci AS notification_type
    UNION ALL
    SELECT 'EMAIL' COLLATE utf8mb4_unicode_ci
) t
LEFT JOIN notifications n
       ON n.order_id          = o.order_id
      AND n.notification_type = t.notification_type;
