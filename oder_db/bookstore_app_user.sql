-- =====================================================================
--  ORDER PIPELINE WITH AUDIT TRAIL  |  APPLICATION DATABASE USER
--  Run once as root AFTER bookstore_schema.sql:
--      mysql -u root -p < bookstore_app_user.sql
--  IMPORTANT: change the password below before running, and never commit
--  the real password to Git. Teammates put it in application.properties
--  (or an environment variable) on their own machine.
--  The app user gets NO DELETE rights anywhere, and only SELECT + INSERT
--  on the audit trail, payments and stock ledger.
-- =====================================================================

USE bookstore_pipeline;

DROP USER IF EXISTS 'bookstore_app'@'localhost';
CREATE USER 'bookstore_app'@'localhost' IDENTIFIED BY 'ChangeThisPassword!1';

GRANT SELECT                 ON bookstore_pipeline.pipeline_steps   TO 'bookstore_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON bookstore_pipeline.customers        TO 'bookstore_app'@'localhost';
GRANT SELECT, UPDATE         ON bookstore_pipeline.books            TO 'bookstore_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON bookstore_pipeline.orders           TO 'bookstore_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON bookstore_pipeline.order_items      TO 'bookstore_app'@'localhost';
GRANT SELECT, INSERT         ON bookstore_pipeline.audit_logs       TO 'bookstore_app'@'localhost';
GRANT SELECT, INSERT         ON bookstore_pipeline.payments         TO 'bookstore_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON bookstore_pipeline.notifications    TO 'bookstore_app'@'localhost';
GRANT SELECT, INSERT         ON bookstore_pipeline.stock_movements  TO 'bookstore_app'@'localhost';
GRANT SELECT ON bookstore_pipeline.v_order_pipeline_timeline        TO 'bookstore_app'@'localhost';
GRANT SELECT ON bookstore_pipeline.v_order_notification_status      TO 'bookstore_app'@'localhost';

FLUSH PRIVILEGES;
