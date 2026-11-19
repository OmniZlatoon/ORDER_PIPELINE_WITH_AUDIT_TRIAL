CREATE DATABASE IF NOT EXISTS order_pipeline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE order_pipeline;

CREATE TABLE IF NOT EXISTS customers (
  customer_id BIGINT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (customer_id),
  INDEX idx_customers_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS books (
  book_id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (book_id),
  CONSTRAINT chk_books_price CHECK (price >= 0),
  CONSTRAINT chk_books_stock CHECK (stock_quantity >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  order_id BIGINT NOT NULL AUTO_INCREMENT,
  order_reference VARCHAR(40) NOT NULL,
  customer_id BIGINT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  order_status VARCHAR(30) NOT NULL,
  payment_status VARCHAR(30) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  completed_at DATETIME(6) NULL,
  PRIMARY KEY (order_id),
  UNIQUE KEY uk_orders_reference (order_reference),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id),
  CONSTRAINT chk_orders_total CHECK (total_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  book_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (order_item_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders (order_id),
  CONSTRAINT fk_order_items_book FOREIGN KEY (book_id)
    REFERENCES books (book_id),
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_items_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_order_items_line_total CHECK (line_total >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  step_name VARCHAR(80) NOT NULL,
  execution_status VARCHAR(20) NOT NULL,
  message TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (audit_id),
  INDEX idx_audit_logs_order_id (order_id),
  CONSTRAINT fk_audit_logs_order FOREIGN KEY (order_id)
    REFERENCES orders (order_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  notification_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT NULL,
  attempts INT NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  sent_at DATETIME(6) NULL,
  PRIMARY KEY (notification_id),
  UNIQUE KEY uk_notifications_order_type (order_id, notification_type),
  INDEX idx_notifications_order_id (order_id),
  CONSTRAINT fk_notifications_order FOREIGN KEY (order_id)
    REFERENCES orders (order_id),
  CONSTRAINT chk_notifications_attempts CHECK (attempts >= 1)
) ENGINE=InnoDB;

INSERT INTO books (title, author, price, stock_quantity) VALUES
  ('Clean Code', 'Robert C. Martin', 42.50, 12),
  ('Effective Java', 'Joshua Bloch', 49.00, 9),
  ('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 55.00, 7),
  ('The Pragmatic Programmer', 'David Thomas and Andrew Hunt', 45.75, 10),
  ('Head First Design Patterns', 'Eric Freeman and Elisabeth Robson', 39.95, 8);
