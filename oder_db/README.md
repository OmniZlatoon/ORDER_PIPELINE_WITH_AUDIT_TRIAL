# Order Pipeline with Audit Trail: Database Guide

This folder holds everything about the MySQL database for the project. It is written for two readers: the teammates building the backend and frontend, and the database owner who needs a reference when something goes wrong later.

- **Database name:** `bookstore_pipeline`
- **Engine:** MySQL **8.0.16 or newer** (InnoDB). Older versions ignore CHECK constraints, which silently disables several rules in this design.
- **Database owner:** ______________________ (fill in)
- **Full design document:** "Database Design – Order Pipeline with Audit Trail" (columns, rules, evidence per test scenario)

---

## 1. Contents of this folder

| File | What it does | When to run it |
| --- | --- | --- |
| `bookstore_schema.sql` | Creates all tables, constraints, indexes, the append-only triggers and the two monitor views. **Drops and recreates everything.** | First, and again whenever the schema changes |
| `bookstore_seed.sql` | Loads 10 books, 2 customers and 2 demo orders (one success, one payment failure) | Right after the schema |
| `bookstore_app_user.sql` | Creates the limited login `bookstore_app` used by the backend | Once, after the schema. Change the password inside first |
| `bookstore_queries.sql` | Queries behind each API endpoint and monitor panel, plus integrity checks | Any time, one query at a time |
| `README.md` | This guide | n/a |

---

## 2. Quick start (about 5 minutes)

1. Install MySQL Server and MySQL Workbench (Section 3). Make sure the server is running.
2. In Workbench, open your connection and run `SELECT VERSION();`. It must be 8.0.16 or higher.
3. **File → Open SQL Script** → `bookstore_schema.sql` → click the **first lightning bolt** (runs the whole script).
4. Do the same for `bookstore_seed.sql`.
5. Edit the password in `bookstore_app_user.sql`, then run it the same way.
6. Click the refresh arrows in the left *Schemas* panel and expand `bookstore_pipeline`. You should see **9 tables and 2 views**.
7. Run `SELECT COUNT(*) FROM bookstore_pipeline.books;` The answer should be **10**.

---

## 3. Installing MySQL Server and Workbench (Windows)

1. Download **MySQL Installer for Windows** from `dev.mysql.com/downloads/installer`. The large *offline* installer (about 400 MB) is safer on an unstable connection. On the Oracle login screen click **"No thanks, just start my download."** No account is needed.
2. Choose the **Custom** setup type, not "Server only". "Server only" does not include Workbench.
3. Move **MySQL Server** and **MySQL Workbench** to the *Products To Be Installed* list using the green arrow. Leave Documentation out.
4. Accept any prerequisite the installer offers (usually the Visual C++ Redistributable), then click **Execute**.
5. Configuration screens:
   - **Config Type:** Development Computer
   - **Port:** `3306` (use `3307` only if another MySQL such as XAMPP must run at the same time, and then use 3307 everywhere below)
   - **Authentication:** Strong Password Encryption (recommended)
   - **Root password:** choose one and store it somewhere safe
   - **Windows Service:** keep "Configure as Windows Service" and "Start at System Startup" ticked
6. Click **Execute** until every step shows a green tick, then **Finish**.

**XAMPP users:** XAMPP's MySQL uses the same port 3306. Keep it stopped in the XAMPP Control Panel, or the new server will not start.

**Optional:** to use `mysql` in the VS Code terminal, add the MySQL `bin` folder to your Windows PATH (for example `C:\Program Files\MySQL\MySQL Server 8.0\bin`), then reopen VS Code and check with `mysql --version`.

---

## 4. Using MySQL Workbench

### 4.1 Connecting

- On the Workbench home screen, double-click a card under **MySQL Connections** and enter the root password.
- To create a connection: click the **+** next to *MySQL Connections*. Set a name (for example `Order_Pipeline_DB`), hostname `127.0.0.1`, port `3306`, username `root`, then click **Test Connection** and **OK**.
- If the connection fails, start the server: press `Win + R`, type `services.msc`, find the MySQL service (for example `MySQL80`) and click **Start**.

### 4.2 Running a script file

1. **File → Open SQL Script**, choose the file.
2. Click the **first lightning bolt** in the toolbar (shortcut `Ctrl + Shift + Enter`). It runs the whole script, or only the highlighted text if you selected some.
3. Read the **Output** panel at the bottom. A green tick is success. A red cross is an error: copy the exact message.
4. Refresh the *Schemas* panel (circular arrows) to see new objects.

### 4.3 Running one query

Click inside the query and use the **second lightning bolt** (the one with the text cursor), or press `Ctrl + Enter`. This runs only the statement the cursor is in. Use this in `bookstore_queries.sql`, where each query is separate. The result appears in the grid under the editor, and the **Export** button on the grid saves it as CSV.

Before running anything in `bookstore_queries.sql`, run its first lines (`USE bookstore_pipeline;` and `SET @order_id = 1;`) so the queries know which database and order to use.

### 4.4 Browsing data without writing SQL

In the left *Schemas* panel: expand `bookstore_pipeline` → **Tables** → right-click a table → **Select Rows - Limit 1000**. Right-click a table → **Table Inspector** shows its columns, indexes and foreign keys.

### 4.5 Drawing the ER diagram (for reports and presentations)

**Database → Reverse Engineer…** → choose the connection → select `bookstore_pipeline` → Next until finished. Workbench draws every table and its relationships. Use **File → Export → Export as PNG** to save it.

### 4.6 Checking the server

- **Server → Server Status** shows whether the server is running, its version and port.
- **Server → Startup / Shutdown** starts and stops it.
- **Edit → Preferences → SQL Editor**, then untick *Safe Updates* if Workbench blocks an UPDATE or DELETE with error 1175.

---

## 5. Using the command line (VS Code terminal)

```
mysql -u root -p
```

Then at the `mysql>` prompt (use forward slashes in the path):

```
source C:/path/to/database/bookstore_schema.sql
source C:/path/to/database/bookstore_seed.sql
source C:/path/to/database/bookstore_app_user.sql
USE bookstore_pipeline;
SHOW TABLES;
```

Use `source` and not the `<` redirect, because `<` does not work in Windows PowerShell and `source` handles the trigger section.

---

## 6. Database summary

### 6.1 Tables

| Table | Purpose |
| --- | --- |
| `customers` | Name and email supplied with an order |
| `books` | Catalogue with authoritative price and stock |
| `orders` | Order header: reference, total, order and payment status, failure summary |
| `order_items` | Books and quantities per order, with a price snapshot |
| `audit_logs` | Append-only STARTED / SUCCESS / FAILED record for each pipeline stage |
| `notifications` | Shipping and email observer outcomes |
| `pipeline_steps` | The six fixed stages (reference data) |
| `payments` | Every simulated payment attempt |
| `stock_movements` | Ledger of every stock change |

### 6.2 Relationships

```
                        pipeline_steps (6 rows)
                         ^            ^
        audit_logs.step_name          orders.failed_step
                         |            |
customers 1 ----< orders 1 ----< order_items >---- 1 books
                    |  |                              |
                    |  +----< audit_logs              |
                    |  +----< payments                |
                    |  +----< notifications           |
                    |  +----< stock_movements >-------+
```

No relationship cascades deletes. Orders, audit records and notifications are history and are never deleted.

### 6.3 Pipeline stage names (must match exactly in Java and React)

| # | Name |
| --- | --- |
| 1 | Validate Order |
| 2 | Check Inventory |
| 3 | Calculate Total |
| 4 | Process Payment |
| 5 | Confirm Order |
| 6 | Complete Order |

### 6.4 Allowed status values

| Column | Values |
| --- | --- |
| `orders.order_status` | PENDING, PROCESSING, CONFIRMED, COMPLETED, FAILED |
| `orders.payment_status` | NOT_PROCESSED, SUCCESS, FAILED |
| `audit_logs.execution_status` | STARTED, SUCCESS, FAILED |
| `payments.status` | SUCCESS, FAILED |
| `notifications.notification_type` | SHIPPING, EMAIL |
| `notifications.status` | CREATED, SENT, FAILED |
| `stock_movements.movement_type` | INITIAL, SALE, ADJUSTMENT |

The monitor also shows two states that are **derived by views, not stored**: stage state (SUCCESS, FAILED, IN_PROGRESS, NOT_EXECUTED) and observer state (CREATED, SENT, FAILED, NOT_TRIGGERED).

### 6.5 Monitor views

- `v_order_pipeline_timeline`: one row per order per stage, with the derived stage state and start/finish times. Order by `step_number`.
- `v_order_notification_status`: both observers for each order, showing NOT_TRIGGERED when no notification exists.

---

## 7. For the backend team

### 7.1 Connection settings

Create the app login by running `bookstore_app_user.sql` (change its password first). The app login has no DELETE rights and only SELECT and INSERT on `audit_logs`, `payments` and `stock_movements`.

`application.properties`:

```
spring.datasource.url=jdbc:mysql://localhost:3306/bookstore_pipeline?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=bookstore_app
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
```

Set the password as an environment variable named `DB_PASSWORD` on your own machine. **Never commit the real password to Git.** Keep `ddl-auto=validate`: Hibernate cannot create the CHECK constraints, triggers or views, so these scripts own the schema.

### 7.2 Mapping rules

- Money: `BigDecimal` for every amount.
- Timestamps: `LocalDateTime`.
- Status columns: `@Enumerated(EnumType.STRING)` using exactly the values in Section 6.4.
- `AuditLog`: `@Immutable`, no setters.
- Define the six stage names once as constants.

### 7.3 Transaction rules (the important part)

1. **Commit the order before the pipeline starts.** Create or find the customer, insert the order as PENDING with its items, set the real `order_reference` from `order_id` (insert with a temporary value such as `TMP-<uuid>`, then update to `ORD-2026-00104` style), and commit. Audit rows reference the order by foreign key, and they are written in a separate transaction, so the order row must already be committed.
2. **Audit writes use `Propagation.REQUIRES_NEW`** so STARTED, SUCCESS and FAILED rows survive a rollback.
3. **On failure:** roll back the pipeline transaction, then in a new transaction set the order to FAILED with `failed_step`, `failure_message` and the correct `payment_status`.
4. **Validation is two layers.** The controller rejects structurally broken requests (missing body, unknown book id, quantity of zero or less) with HTTP 400, and nothing is stored. Stage 1 audits content failures that can be stored: blank name, malformed email, no items.
5. **Stage 3 fills prices.** Copy `books.price` into `order_items.unit_price`, compute `line_total`, then set `orders.total_amount`. Never trust a price from the browser.
6. **Stock is deducted in stage 5, atomically:**
   ```sql
   UPDATE books SET stock_quantity = stock_quantity - :qty
   WHERE book_id = :id AND stock_quantity >= :qty;
   ```
   If zero rows are updated, throw a processing exception. Then insert a SALE row into `stock_movements` in the same transaction.
7. **Publish OrderCompleted only after commit** (`@TransactionalEventListener(phase = AFTER_COMMIT)`). The observers must save notifications with `Propagation.REQUIRES_NEW`.
8. **Observers are idempotent.** A second insert for the same `(order_id, notification_type)` is rejected by a unique key. Catch the duplicate and treat it as already handled (or increment `attempts` on retry).
9. **No delete operations** on any table. Merge duplicate book lines in one order (sum the quantities) before saving, because `(order_id, book_id)` is unique.

### 7.4 Queries ready to reuse

`bookstore_queries.sql` Part A has the query for each endpoint: catalogue (A1), order summary (A2), lines (A3), timeline (A4), audit history (A5), notifications (A6), payments (A7).

---

## 8. For the frontend team

The frontend never connects to MySQL. It only calls the backend REST API. What you need from the database side:

- The six stage names and their order (Section 6.3).
- The state words the monitor displays: stages show SUCCESS, FAILED or NOT_EXECUTED; observers show SENT, FAILED or NOT_TRIGGERED.
- Money is in XAF with two decimals.
- Test data to build against (Section 9). The backend provides the exact JSON shapes.

---

## 9. Seed data reference

| Item | Details |
| --- | --- |
| Books | IDs 1 to 10 (illustrative XAF prices). Book 1 is 4000.00 and book 3 is 4500.00 |
| Low stock | Book 9 has stock 2: use it for quantity-too-high tests |
| Out of stock | Book 10 has stock 0: use it for the insufficient-stock scenario |
| Order 1 `ORD-2026-00001` | Completed. 2 x book 1 + 1 x book 3 = 12500.00. Six stages succeeded, 12 audit rows, SHIPPING and EMAIL both SENT |
| Order 2 `ORD-2026-00002` | Failed at Process Payment. Stages 1 to 3 succeeded, stage 5 and 6 not executed, no notifications, no stock deducted |

---

## 10. What the database must show for each test

| Scenario | Expected rows |
| --- | --- |
| Successful order | Order COMPLETED, payment SUCCESS, 12 audit rows (6 STARTED + 6 SUCCESS), exactly 1 SHIPPING and 1 EMAIL notification, 1 SUCCESS payment, SALE rows in `stock_movements`, stock reduced |
| Invalid order | Order FAILED with `failed_step` = Validate Order, only that stage in the audit, no payment, notification or stock change |
| Insufficient stock | `failed_step` = Check Inventory, audit shows stages 1 and 2 only, stock unchanged |
| Payment failure | `failed_step` = Process Payment, 1 FAILED payment row, stages 1 to 3 SUCCESS, stage 4 FAILED, no notifications |
| Repeated completion event | Second notification insert rejected, counts stay at 1 SHIPPING and 1 EMAIL |
| Audit tampering | UPDATE or DELETE on `audit_logs` fails with "audit_logs is append-only" |

The integrity checks B1 to B8 in `bookstore_queries.sql` should return **no rows** after the tests.

---

## 11. Team workflow and changes

1. **Each person runs their own local MySQL** and loads these scripts. Do not share the root password.
2. **The `.sql` files are the single source of truth.** If a table or column must change, the database owner edits `bookstore_schema.sql`, re-runs it, updates the seed file if needed, commits to Git and tells the team.
3. **Never change tables by hand in Workbench** without also updating the script. Your database and your teammates' databases would drift apart and tests would pass for one person and fail for another.
4. After pulling a new version, re-run `bookstore_schema.sql` then `bookstore_seed.sql`. This resets all data to the demo data.
5. Agree stage names, status values, field names and API shapes **before** working in parallel.

### Version log

| Version | Date | Change | Run on (MySQL version) |
| --- | --- | --- | --- |
| 1.0 | 2026-11-19 | Initial schema, seed, queries and app user | ______ |

---

## 12. Backup, restore and reset

**Backup** (from a normal terminal, not from inside `mysql>`):

```
mysqldump -u root -p --triggers bookstore_pipeline > backup_bookstore.sql
```

This includes the tables, data, views and triggers. In Workbench use **Server → Data Export** instead, select `bookstore_pipeline`, choose *Export to Self-Contained File*, and click Start Export.

**Restore:**

```
mysql -u root -p bookstore_pipeline < backup_bookstore.sql
```

(In PowerShell, use Workbench's **Server → Data Import**, or run `mysql -u root -p` and then `source backup_bookstore.sql`.)

**Full reset to demo data:** run `bookstore_schema.sql`, then `bookstore_seed.sql`, then `bookstore_app_user.sql`.

---

## 13. Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `mysql` is not recognised in the terminal | The MySQL `bin` folder is not in PATH. Add it, then reopen VS Code or restart the PC |
| Can't connect to MySQL server on localhost:3306 | The service is not running. Start it in `services.msc`. Another MySQL (such as XAMPP) may be using the port |
| Access denied for user 'root' | Wrong password. Use the one set in the installer, not XAMPP's empty one |
| Access denied for user 'bookstore_app' | `bookstore_app_user.sql` was not run, or the password in `application.properties` differs |
| Backend error: Public Key Retrieval is not allowed | Add `allowPublicKeyRetrieval=true` to the JDBC URL |
| Backend error: server time zone value is unrecognized | Add `serverTimezone=UTC` to the JDBC URL |
| Backend error: Schema-validation: missing table | The schema script was not run on the database the backend points to |
| Error 3819: Check constraint '...' is violated | A value broke a rule (for example negative stock or a status outside the allowed list). The rule is working. Fix the data |
| Error 1062: Duplicate entry ... for key `uq_notifications_order_type` | The notification already exists. Expected behaviour for a repeated completion event. Handle it in code |
| Error 1452: Cannot add or update a child row | A foreign key points to a row that does not exist (unknown order, book or stage name). Insert the parent first or fix the name |
| Error 1451: Cannot delete or update a parent row | Other rows still reference it. Deleting is intentionally restricted |
| `audit_logs is append-only` | Someone tried to UPDATE or DELETE an audit record. Expected. The audit trail is never edited |
| Error 1175 (safe update mode) in Workbench | Untick Safe Updates in Edit → Preferences → SQL Editor, or add a key column in the WHERE clause |
| Trigger section fails when running the schema | The client does not support `DELIMITER`. Run the script from Workbench or the `mysql` command line |
| Unknown collation / syntax errors | The server is older than MySQL 8.0.16 (or an old MariaDB). Upgrade, then re-run |

---

## 14. Database owner checklist (before each team demo)

- [ ] Server running and `SELECT VERSION();` is 8.0.16 or higher
- [ ] Schema and seed run without red errors; 9 tables and 2 views present
- [ ] `bookstore_app` login works from the backend
- [ ] After a test run, all integrity checks (B1 to B8) return no rows
- [ ] Successful, invalid, insufficient-stock and payment-failure scenarios all leave the rows listed in Section 10
- [ ] Backup taken (Section 12)
- [ ] Version log updated if anything changed
