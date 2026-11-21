# Order Pipeline: Backend End-to-End Walkthrough

This guide covers the local database, the Java Spring Boot backend, the React
client, the REST API contract, and a complete successful and failed order run.
It follows the system design in [Order Pipeline with Audit Trail - Revised-v2](<./Order Pipeline with Audit Trail - Revised-v2.md>).

## 1. System overview

The application has three tiers. The browser communicates only with the
Spring Boot REST API; it never connects directly to MySQL.

| Tier | Project location | Local address | Responsibility |
| --- | --- | --- | --- |
| React/Vite reference client | [Frontend](../stacks/Frontend/) | `http://localhost:5173` | Reference order form and processing monitor |
| React/Vite customer storefront | [OrderFlow Frontend](../BookStore%20Frontend/orderflow-bookstore/Frontend/) | `http://localhost:5174` | Customer catalogue, checkout, payment handoff, order lookup and audit monitor |
| Java/Spring Boot backend | [Backend](../stacks/Backend/) | `http://localhost:8080` | REST API, validation, order pipeline, audit decorator, completion observers |
| MySQL database | [Database](../stacks/Database/) | `localhost:3306` | Customers, books, orders, items, audit events, notifications |

The backend is a Java 21 Maven project suitable for opening directly in
IntelliJ IDEA. Its application code is Java; Maven and YAML are used for build
and configuration.

## 2. Prerequisites

- Java Development Kit 21
- IntelliJ IDEA with Maven support, or Apache Maven 3.9+
- Docker Desktop with Docker Compose
- Node.js 20+ and npm (only needed to run the React frontend)

To run the customer storefront, open PowerShell in
`BookStore Frontend/orderflow-bookstore/Frontend`, run `npm ci`, then
`npm run dev`. The Vite server listens on port `5174` and proxies `/api` and
`/fapshi_demo` to the backend on port `8080`. The reference client in
`stacks/Frontend` runs on port `5173`. The browser never connects directly to
MySQL.

## 3. Start MySQL

Open PowerShell in `stacks/Database`:

```powershell
Copy-Item .env.example .env
docker compose up -d
docker compose ps
```

Wait for the `mysql` service to report healthy. The first database
initialization runs [`init/01-schema.sql`](../stacks/Database/init/01-schema.sql),
which creates the six tables and inserts sample books:

1. `customers`
2. `books`
3. `orders`
4. `order_items`
5. `audit_logs`
6. `notifications`

The `orders` table also stores the Fapshi transaction ID, XAF amount, and
exchange rate used for reconciliation. For an existing database, apply
[`02-fapshi-payment.sql`](../stacks/Database/migrations/02-fapshi-payment.sql)
once before starting the updated backend. It adds those columns and converts
existing audit step names to uppercase.

The Compose database defaults to database `order_pipeline`, user `order_app`,
password `order_app`, on port `3306`. The Compose `.env` file configures the
MySQL container; it does not automatically configure IntelliJ. For that
container, set `DB_USERNAME=order_app` and `DB_PASSWORD=order_app` in the
backend run configuration. For an existing local MySQL installation, the
application defaults to user `root`; set its password in `DB_PASSWORD`.

Initialization scripts run only when MySQL creates a new data directory.
Restarting the container preserves the named `mysql_data` volume and its data.
Do not delete that volume unless you intentionally want to erase the local
database.

### Use an existing local MySQL server instead of Docker

If MySQL is already running on the computer, Docker Compose is not required.
First run [`init/01-schema.sql`](../stacks/Database/init/01-schema.sql) in
MySQL Workbench or another MySQL client using an account allowed to create the
database and tables. The script creates `order_pipeline` and its sample books;
it does not create a MySQL login. Make sure the account used by Spring Boot has
permission to select, insert, and update rows in that database.

In IntelliJ, open **Run → Edit Configurations**, select
`OrderPipelineApplication`, and add these environment variables using the
username and password for the existing MySQL server:

```text
DB_URL=jdbc:mysql://localhost:3306/order_pipeline?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=<your-existing-mysql-username>
DB_PASSWORD=<your-existing-mysql-password>
```

Do not commit the password or put it in a shared project file. Restart the
application after changing the run configuration. The password property has
an intentionally blank default; the password must be supplied through the
local run configuration.

## 4. Run the Spring Boot backend

### IntelliJ IDEA

1. Open [`stacks/Backend/pom.xml`](../stacks/Backend/pom.xml) as a Maven project.
2. Set the project SDK to Java 21 and allow Maven to load dependencies.
3. Confirm MySQL is running and accessible using the defaults above.
4. Preserve the existing `stacks/Backend/.env`; if it does not exist, create
   it from [`stacks/Backend/.env.example`](../stacks/Backend/.env.example).
   Configure the Fapshi dashboard webhook secret as `FAPSHI_WEBHOOK_SECRET`
   in that file and set the run configuration working directory to
   `stacks/Backend`.
5. Run `com.omnizlatoon.orderpipeline.OrderPipelineApplication`.
6. Confirm the application starts on port `8080`. Startup validates the
   configured database schema.

### Maven command line

From the repository root:

```powershell
Set-Location stacks\Backend
mvn spring-boot:run
```

To run the backend tests:

```powershell
mvn clean test
```

The tests use an in-memory H2 database and cover stage order, audit behavior,
pending checkout, webhook success/failure, and duplicate callbacks. They do
not require MySQL or live Fapshi credentials.

### Backend configuration

The defaults are in
[`application.yml`](../stacks/Backend/src/main/resources/application.yml).
Override them in the IntelliJ run configuration's environment variables when
needed:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/order_pipeline?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | JDBC connection URL |
| `DB_USERNAME` | `root` | MySQL user; use `order_app` with the project's Compose database |
| `DB_PASSWORD` | (blank; set locally) | MySQL password, supplied through the run configuration |
| `SIMULATE_PAYMENT_FAILURE` | `false` | Set to `true` to make the simulated payment stage fail |
| `FRONTEND_ORIGIN` | `http://localhost:5174,https://subtarsal-kathyrn-untreated.ngrok-free.dev` | Comma-separated browser origins allowed by the API's CORS configuration; setting it replaces this default list |
| `FAPSHI_API_USER` | From `stacks/Backend/.env` | Fapshi sandbox `apiuser` header |
| `FAPSHI_API_SECRET` | From `stacks/Backend/.env` | Fapshi sandbox `apikey` header |
| `FAPSHI_API_BASE_URL` | `https://sandbox.fapshi.com` | Fapshi API environment |
| `FAPSHI_WEBHOOK_SECRET` | Set privately to the same value configured in the Fapshi dashboard | Verifies the `x-wh-secret` callback header; callbacks are rejected when missing |
| `FRONTEND_BASE_URL` | `https://subtarsal-kathyrn-untreated.ngrok-free.dev` | Browser return URL after hosted checkout; override only if using another public frontend URL |
| `EXCHANGE_RATE_API_URL` | `https://open.er-api.com/v6/latest/USD` | Primary USD/XAF exchange-rate source |
| `EXCHANGE_RATE_FALLBACK_API_URL` | `https://latest.currency-api.pages.dev/v1/currencies/usd.json` | Fallback USD/XAF source used when the primary is unavailable or invalid |

### Test Fapshi directly with Postman

These requests call Fapshi's sandbox API directly, not the local order API.
Use the sandbox `FAPSHI_API_USER` and `FAPSHI_API_SECRET` values from your
private `stacks/Backend/.env` file:

1. In Postman, create a local environment such as `Fapshi Sandbox`. Add:

   | Variable | Value |
   | --- | --- |
   | `FAPSHI_BASE_URL` | `https://sandbox.fapshi.com` |
   | `FAPSHI_API_USER` | Your sandbox API user |
   | `FAPSHI_API_SECRET` | Your sandbox API secret; mark it sensitive and keep it local |
   | `FAPSHI_TRANS_ID` | Leave blank; the initiate request below fills it |

   Do not put credential values in a shared collection, screenshots, exported
   files, or a synced/shared Postman environment.

2. Create a request named **Initiate sandbox payment**:

   - Method: `POST`
   - URL: `{{FAPSHI_BASE_URL}}/initiate-pay`
   - Headers:

     | Key | Value |
     | --- | --- |
     | `Content-Type` | `application/json` |
     | `apiuser` | `{{FAPSHI_API_USER}}` |
     | `apikey` | `{{FAPSHI_API_SECRET}}` |

   - Body: choose **raw → JSON** and send:

     ```json
     {
       "amount": 1000,
       "email": "postman-test@example.com",
       "redirectUrl": "https://example.com/payment-return",
       "userId": "postman-test-user",
       "externalId": "postman-fapshi-test-001",
       "message": "Postman sandbox test"
     }
     ```

     `amount` is a whole-number XAF amount (Fapshi's minimum is 100 XAF).
     Use a unique `externalId` for each test and replace `redirectUrl` if your
     Fapshi account requires an allowed return URL.

   A successful response contains `link` and `transId`. In the request's
   **Scripts → Post-response** tab, you can save the transaction ID for the
   next request:

   ```javascript
   const result = pm.response.json();
   if (result.transId) {
     pm.environment.set("FAPSHI_TRANS_ID", result.transId);
   }
   ```

3. Open the returned `link` in a browser and complete the sandbox checkout
   using one of Fapshi's published sandbox test numbers. Then create a request
   named **Get sandbox payment status**:

   - Method: `GET`
   - URL: `{{FAPSHI_BASE_URL}}/payment-status/{{FAPSHI_TRANS_ID}}`
   - Add the same `apiuser` and `apikey` headers above; no request body is
     needed.

   The response includes the transaction ID and status. It may be `CREATED` or
   `PENDING` before payment finishes, then `SUCCESSFUL`, `FAILED`, or `EXPIRED`
   after a terminal result.

These direct requests create a Fapshi transaction but do not create an order
in this application's database. Their callbacks therefore cannot complete an
application order. To test the full order pipeline, create checkout through
`POST http://localhost:8080/api/orders` (or the frontend) and use the returned
order's transaction ID when checking status. The application's
`/fapshi_demo/webhook` URL is a callback endpoint for Fapshi, not a Fapshi API
endpoint to use for these Postman requests.

Hibernate uses `ddl-auto: validate`: it checks the MySQL schema at startup but
does not create or alter the database tables. The schema source of truth is
[`01-schema.sql`](../stacks/Database/init/01-schema.sql).

## 5. REST API

All endpoints are served from `http://localhost:8080`. JSON property names are
camelCase.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/books` | List the catalogue and current stock |
| `GET` | `/api/exchange-rate/usd-xaf` | Return the current backend USD/XAF rate and provider update time |
| `POST` | `/api/orders` | Validate an order, create Fapshi hosted checkout, and return a pending order |
| `GET` | `/api/orders/{orderId}` | Retrieve the order result |
| `GET` | `/api/orders/reference/{orderReference}` | Retrieve an order using its public reference |
| `POST` | `/api/orders/{orderId}/reconcile-payment` | Check the pending transaction with Fapshi and return the updated order |
| `GET` | `/api/orders/{orderId}/audit` | Retrieve audit events in chronological order |
| `GET` | `/api/orders/{orderId}/notifications` | Retrieve shipping/email outcomes |
| `POST` | `/fapshi_demo/webhook` | Fapshi callback; verifies the shared secret, transaction reference, and amount |

### `GET /api/books`

Returns an array of books:

```json
[
  {
    "id": 1,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "price": 42.50,
    "stockQuantity": 12
  }
]
```

Use the returned `id` values when creating an order. The backend retrieves the
authoritative price and stock from MySQL; the client must not submit a price or
order total. The storefront maps the backend's `id` field to its local
`bookId` field before cart operations.

The database already models the Order-to-Book many-to-many relationship with
`order_items`: each row links one order to one book and stores its quantity and
authoritative price. An order can contain multiple different books, and a book
can appear in many orders; no schema migration is required for this frontend
integration.

`GET /api/exchange-rate/usd-xaf` returns `baseCurrency`, `quoteCurrency`,
`rate`, and `updatedAt`. Checkout uses this backend-provided rate for an
indicative XAF estimate; the submitted order's `paymentAmountXaf` remains the
authoritative amount.

### `POST /api/orders`

Request body:

```json
{
  "customer": {
    "fullName": "Alex Example",
    "email": "alex@example.com"
  },
  "items": [
    {
      "bookId": 1,
      "quantity": 2
    }
  ]
}
```

A valid order returns HTTP `201 Created` with a pending status and Fapshi
checkout link. The server converts the authoritative USD total to whole XAF
using the daily USD/XAF rate, then returns the exact amount and rate used:

```json
{
  "orderId": 104,
  "orderReference": "ORD-2026-A1B2C3D4",
  "customerName": "Alex Example",
  "orderStatus": "PROCESSING",
  "paymentStatus": "PENDING",
  "totalAmount": 85.00,
  "createdAt": "2026-11-18T14:00:00",
  "completedAt": null,
  "paymentLink": "https://pay.fapshi.com/checkout/example",
  "paymentAmountXaf": 50808,
  "exchangeRateUsdXaf": 597.73771100,
  "paymentMessage": "Fapshi checkout created; awaiting payment confirmation.",
  "items": [
    {
      "bookId": 1,
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "quantity": 2,
      "unitPrice": 42.50,
      "lineTotal": 85.00
    }
  ]
}
```

The backend rounds to the nearest whole XAF (`HALF_UP`) and enforces Fapshi's
100 XAF minimum. It tries the primary exchange-rate provider, then the
independent daily-rate fallback. The backend checks for updated rates on
startup, every six hours, and when a requested rate has reached its provider
refresh time. Because these free sources update daily and can publish after
midnight, a validated rate up to 36 hours old is accepted. Rate age is based
on the provider's published update date, not the time the backend fetched it.
If both providers fail, a cached rate is used only within that same freshness
limit. If neither source provides a usable rate and no sufficiently recent
rate is cached, checkout is stopped rather than using a hard-coded or
indefinitely stale conversion rate.

The reference and timestamps are generated at runtime. The customer continues
to the hosted Fapshi page to choose MTN Mobile Money or Orange Money and enter
their number. The browser redirect back is not treated as proof of payment. A callback must
pass shared-secret verification and match the stored Fapshi transaction ID,
order reference, and XAF amount before it can complete or fail the order.

Business validation, inventory, exchange-rate, and definite payment-initiation
failures return the created order with `orderStatus: "FAILED"`; inspect its
audit endpoint for the failure message. If Fapshi's initiation response is
ambiguous due to a network failure, the order remains `PENDING` to prevent an
unsafe duplicate charge. Invalid JSON is rejected by Spring MVC. An unknown
order ID returns HTTP `404` with a Problem Details response.

### Read an order, its audit, and notifications

Replace `104` with the `orderId` returned by `POST /api/orders`.

- `GET /api/orders/104` returns the order summary.
- `GET /api/orders/104/audit` returns records with `auditId`, `stepName`,
  `executionStatus`, `message`, and `createdAt`.
- `GET /api/orders/104/notifications` returns records with
  `notificationId`, `notificationType`, `status`, `message`, `attempts`,
  `createdAt`, and `sentAt`.

Audit `stepName` values are always uppercase. The payment stage records
`STARTED` then `PENDING` after checkout creation; a provider-confirmed result
adds `SUCCESS` or `FAILED`. The order remains `PROCESSING` with payment
`PENDING` while Fapshi reports `CREATED` or `PENDING`.

The order becomes `COMPLETED` and payment becomes `SUCCESS` only when
`GET /payment-status/{transId}` reports `SUCCESSFUL` and the provider's
transaction ID, `externalId` (the order reference), and XAF amount all match
the stored order. The backend then records payment success and runs
`CONFIRM ORDER` and `COMPLETE ORDER`; all six audit stages must have a
`SUCCESS` event. Only then do the completion observers record one `SHIPPING`
and one `EMAIL` notification. `FAILED` or `EXPIRED` provider results mark the
order and payment `FAILED` and do not trigger completion notifications.

Configure the Fapshi dashboard webhook as
`https://subtarsal-kathyrn-untreated.ngrok-free.dev/fapshi_demo/webhook` when
ngrok forwards to the customer storefront's Vite server on port 5174. Vite
proxies that path to the backend. Set the same dashboard webhook secret in the private
`FAPSHI_WEBHOOK_SECRET` setting. The backend compares `x-wh-secret` in constant
time, matches the callback's transaction ID, order reference, and XAF amount
to the stored order, then uses Fapshi's payment-status response as the
authoritative state. A callback alone never completes an order: if the status
API reports `CREATED`/`PENDING`, or cannot be reached, the order stays
`PROCESSING`/`PENDING`. Unknown or mismatched transactions are not applied.
Fapshi does not retry webhooks automatically; resend them from its dashboard
if delivery fails. After returning from checkout, the client calls
`POST /api/orders/{orderId}/reconcile-payment` immediately and every 20
seconds while the order remains pending. This rechecks the provider so a
delayed webhook or temporary status-API outage does not leave the UI stale.
The endpoint limits checks for a transaction to one every 15 seconds to stay
within Fapshi's per-transaction status-query limit.

The storefront reads the `orderId` query parameter on Fapshi's return to the
site, opens that order's status page, and reconciles payment with the backend.
It never treats the redirect itself as a successful payment.

The Fapshi sandbox simulates a successful or failed payment after the user
enters a test number and proceeds; it does not charge real money. Its
published success and failure numbers are deterministic. Numbers outside the
published list can have randomized outcomes; the application waits for
Fapshi's verified result instead of pre-classifying a number locally. See
[Fapshi sandbox test numbers](https://docs.fapshi.com/en/api-reference/preliminary-knowledge/environment).

### Complete API smoke test in PowerShell

Run this after the database and backend are available:

```powershell
$baseUrl = "http://localhost:8080"
$books = Invoke-RestMethod -Uri "$baseUrl/api/books" -Method Get
$books | Format-Table id, title, author, price, stockQuantity

$request = @{
    customer = @{
        fullName = "Alex Example"
        email = "alex@example.com"
    }
    items = @(
        @{
            bookId = $books[0].id
            quantity = 1
        }
    )
} | ConvertTo-Json -Depth 5

$order = Invoke-RestMethod `
    -Uri "$baseUrl/api/orders" `
    -Method Post `
    -ContentType "application/json" `
    -Body $request

$order | Format-List
Invoke-RestMethod -Uri "$baseUrl/api/orders/$($order.orderId)"
Invoke-RestMethod -Uri "$baseUrl/api/orders/$($order.orderId)/audit"
Invoke-RestMethod -Uri "$baseUrl/api/orders/$($order.orderId)/notifications"
```

## 6. What happens during order processing

`OrderService` creates the customer and order, resolves requested book IDs from
MySQL, and invokes `BookstoreOrderProcessor`. Its final Template Method runs
these stages in order:

1. **Validate Order** — customer name/email, requested items, and quantities.
2. **Check Inventory** — requested quantities against database stock.
3. **Calculate Total** — calculates line totals from database prices and
   persists the order items and total.
4. **Process Payment** — converts USD to XAF and creates a Fapshi hosted
   checkout. The order and audit step remain pending until provider
   confirmation.
5. **Confirm Order** — updates the order state after successful payment.
6. **Complete Order** — marks completion and publishes the completion event.

An `AuditDecorator` wraps each stage and records uppercase `step_name` values,
with `STARTED`, `PENDING`, `SUCCESS`, or `FAILED` execution status in
`audit_logs`. Expected processing exceptions are caught inside the order
transaction and the order is committed as `FAILED`; this preserves the failure
audit record. Database/infrastructure errors still abort the transaction.

`OrderCompletionPublisher` publishes only when the final stage is reached.
`ShippingObserver` and `EmailObserver` listen after the transaction commits and
persist simulated outcomes in `notifications`. A database unique constraint
on `(order_id, notification_type)` prevents duplicate notification records.

### Demonstrate a failed payment

In IntelliJ's run configuration, set:

```text
SIMULATE_PAYMENT_FAILURE=true
```

Restart the backend and submit a valid order. The simulation marks
`orderStatus: "FAILED"` and `paymentStatus: "FAILED"` without creating a
Fapshi checkout. For an actual sandbox failure, complete the hosted checkout
with a Fapshi test case that produces failure and wait for its webhook.
Fapshi does not provide a failure reason. Failed or expired payments do not
run the final order stages or emit notifications. Set the simulation variable
back to `false` and restart to test hosted checkout.

## 7. Run the React client

In another PowerShell terminal:

```powershell
Set-Location "BookStore Frontend\orderflow-bookstore\Frontend"
npm install
npm run dev
```

Open the Vite URL printed in the terminal. The Vite configuration proxies
`/api` and `/fapshi_demo` requests to `http://localhost:8080`, so start MySQL
and Spring Boot first. Fapshi returns the customer to the configured
`FRONTEND_BASE_URL` (the ngrok URL by default). The frontend sends the customer to Fapshi-hosted checkout, where the payer
must enter an email and Mobile Money details before proceeding. After Fapshi
redirects back, it rechecks the provider status and refreshes the order,
six-stage audit timeline, and observer outcomes.

## 8. Backend project structure

The Java sources are under
[`src/main/java/com/omnizlatoon/orderpipeline`](../stacks/Backend/src/main/java/com/omnizlatoon/orderpipeline/):

| Package | Responsibility |
| --- | --- |
| `controller` | Thin REST controllers and API error mapping |
| `dto` | API request and response records |
| `entity` | JPA entities and order/audit/notification status enums |
| `repository` | Spring Data JPA database access |
| `service` | Book/order orchestration, audit recording, notification persistence |
| `pattern.template` | Fixed six-step pipeline and bookstore implementation |
| `pattern.decorator` | `OrderStep` and `AuditDecorator` |
| `pattern.observer` | Completion event, publisher, shipping and email observers |
| `config` | Development CORS configuration |

For the complete database field definitions and business requirements, see the
[project design document](<./Order Pipeline with Audit Trail - Revised-v2.md>).

## 9. Troubleshooting startup

| Startup message | Cause and action |
| --- | --- |
| `Access denied for user ...` | MySQL was reached, but rejected the configured username/password. Check `DB_USERNAME` and `DB_PASSWORD` in the IntelliJ run configuration and verify that the account is permitted to connect from `localhost`. For the Compose database, use its configured `order_app` user. |
| `Unable to determine Dialect without JDBC metadata` after an access-denied message | This is a follow-on error because Hibernate could not connect to MySQL to read its metadata. Fix the database credentials first; changing the Hibernate dialect does not repair authentication. |
| Connection refused on port `3306` | MySQL is stopped, listening on another port, or the JDBC URL is incorrect. Start the intended MySQL service and check `DB_URL`. |
| Hibernate schema validation fails | The configured database may not contain the expected tables or columns. Run the project schema script against the database named in `DB_URL`; keep `ddl-auto: validate` enabled. |
| Frontend says it cannot reach the order service | Start the backend on port `8080`. The Vite development proxy forwards `/api` requests there. |
