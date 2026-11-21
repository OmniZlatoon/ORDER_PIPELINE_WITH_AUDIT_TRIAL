-- =====================================================================
--  ORDER PIPELINE WITH AUDIT TRAIL  |  SHARED-SERVER LOGIN FOR TEAMMATES
--  Use ONLY when teammates connect to YOUR MySQL server over the network.
--  Run as root after bookstore_schema.sql:
--      source bookstore_app_user_network.sql
--  Change the password below before running and send it to teammates
--  privately (never commit the real password to Git).
--  Host '%' means "from any machine"; the Windows firewall rule that
--  limits port 3306 to the local subnet is what keeps this safe.
--  Same permissions as bookstore_app: no DELETE anywhere, and only
--  SELECT + INSERT on audit_logs, payments and stock_movements.
-- =====================================================================

USE bookstore_pipeline;

DROP USER IF EXISTS 'bookstore_dev'@'%';
CREATE USER 'bookstore_dev'@'%' IDENTIFIED BY 'ChangeThisPassword!2';

GRANT SELECT                 ON bookstore_pipeline.pipeline_steps   TO 'bookstore_dev'@'%';
GRANT SELECT, INSERT, UPDATE ON bookstore_pipeline.customers        TO 'bookstore_dev'@'%';
GRANT SELECT, UPDATE         ON bookstore_pipeline.books            TO 'bookstore_dev'@'%';
GRANT SELECT, INSERT, UPDATE ON bookstore_pipeline.orders           TO 'bookstore_dev'@'%';
GRANT SELECT, INSERT, UPDATE ON bookstore_pipeline.order_items      TO 'bookstore_dev'@'%';
GRANT SELECT, INSERT         ON bookstore_pipeline.audit_logs       TO 'bookstore_dev'@'%';
GRANT SELECT, INSERT         ON bookstore_pipeline.payments         TO 'bookstore_dev'@'%';
GRANT SELECT, INSERT, UPDATE ON bookstore_pipeline.notifications    TO 'bookstore_dev'@'%';
GRANT SELECT, INSERT         ON bookstore_pipeline.stock_movements  TO 'bookstore_dev'@'%';
GRANT SELECT ON bookstore_pipeline.v_order_pipeline_timeline        TO 'bookstore_dev'@'%';
GRANT SELECT ON bookstore_pipeline.v_order_notification_status      TO 'bookstore_dev'@'%';

FLUSH PRIVILEGES;

-- To stop sharing later:  DROP USER 'bookstore_dev'@'%';
