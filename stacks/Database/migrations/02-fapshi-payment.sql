-- Apply once to an existing order_pipeline database before starting the updated backend.
ALTER TABLE orders
  ADD COLUMN fapshi_transaction_id VARCHAR(100) NULL,
  ADD COLUMN payment_amount_xaf BIGINT NULL,
  ADD COLUMN exchange_rate_usd_xaf DECIMAL(18,8) NULL,
  ADD UNIQUE KEY uk_orders_fapshi_transaction_id (fapshi_transaction_id);

UPDATE audit_logs
SET step_name = UPPER(step_name);
