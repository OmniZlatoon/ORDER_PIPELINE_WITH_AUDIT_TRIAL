# Order Pipeline: Backend End-to-End Walkthrough

This guide covers the local database, the Java Spring Boot backend, the React
client, the REST API contract, and a complete successful and failed order run.
It follows the system design in [Order Pipeline with Audit Trail - Revised-v2](<./Order Pipeline with Audit Trail - Revised-v2.md>).

## 1. System overview

The application has three tiers. The browser communicates only with the
Spring Boot REST API; it never connects directly to MySQL.

| Tier | Project location | Local address | Responsibility |
| --- | --- | --- | --- |
| React/Vite frontend | [Frontend](../stacks/Frontend/) | Vite's printed URL, normally `http://localhost:5173` | Book catalogue, customer/order form, result and audit monitor |
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

The default connection is database `order_pipeline`, user `order_app`,
password `order_app`, on port `3306`. The Compose `.env` file configures the
MySQL container; it does not automatically configure IntelliJ. Keep the
backend's `DB_*` values in sync if you change the database credentials.

Initialization scripts run only when MySQL creates a new data directory.
Restarting the container preserves the named `mysql_data` volume and its data.
Do not delete that volume unless you intentionally want to erase the local
database.

## 4. Run the Spring Boot backend

### IntelliJ IDEA

1. Open [`stacks/Backend/pom.xml`](../stacks/Backend/pom.xml) as a Maven project.
2. Set the project SDK to Java 21 and allow Maven to load dependencies.
3. Confirm MySQL is running and accessible using the defaults above.
4. Run `com.omnizlatoon.orderpipeline.OrderPipelineApplication`.
5. Confirm the application starts on port `8080`. Startup validates the
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

The tests use an in-memory H2 database and cover the required stage order,
audit behavior, a completed order, and payment failure. They do not require the
MySQL container.

### Backend configuration

The defaults are in
[`application.yml`](../stacks/Backend/src/main/resources/application.yml).
Override them in the IntelliJ run configuration's environment variables when
needed:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/order_pipeline?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | JDBC connection URL |
| `DB_USERNAME` | `order_app` | MySQL application user |
| `DB_PASSWORD` | `order_app` | MySQL application password |
| `SIMULATE_PAYMENT_FAILURE` | `false` | Set to `true` to make the simulated payment stage fail |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Browser origin allowed by the API's CORS configuration |

Hibernate uses `ddl-auto: validate`: it checks the MySQL schema at startup but
does not create or alter the database tables. The schema source of truth is
[`01-schema.sql`](../stacks/Database/init/01-schema.sql).

## 5. REST API

All endpoints are served from `http://localhost:8080`. JSON property names are
camelCase.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/books` | List the catalogue and current stock |
| `POST` | `/api/orders` | Create and process an order |
| `GET` | `/api/orders/{orderId}` | Retrieve the order result |
| `GET` | `/api/orders/{orderId}/audit` | Retrieve audit events in chronological order |
| `GET` | `/api/orders/{orderId}/notifications` | Retrieve shipping/email outcomes |

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
order total.

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

A created order returns HTTP `201 Created` and an order result:

```json
{
  "orderId": 104,
  "orderReference": "ORD-2026-A1B2C3D4",
  "customerName": "Alex Example",
  "orderStatus": "COMPLETED",
  "paymentStatus": "SUCCESS",
  "totalAmount": 85.00,
  "createdAt": "2026-11-18T14:00:00",
  "completedAt": "2026-11-18T14:00:01"
}
```

The reference and timestamps are generated at runtime. Business validation,
inventory, and simulated payment failures still return the created order with
`orderStatus: "FAILED"`; inspect its audit endpoint for the failing step and
message. Invalid JSON is rejected by Spring MVC. An unknown order ID returns
HTTP `404` with a Problem Details response.

### Read an order, its audit, and notifications

Replace `104` with the `orderId` returned by `POST /api/orders`.

- `GET /api/orders/104` returns the order summary.
- `GET /api/orders/104/audit` returns records with `auditId`, `stepName`,
  `executionStatus`, `message`, and `createdAt`.
- `GET /api/orders/104/notifications` returns records with
  `notificationId`, `notificationType`, `status`, `message`, `attempts`,
  `createdAt`, and `sentAt`.

The audit endpoint returns `STARTED` followed by `SUCCESS` for each successful
stage. A failed stage has `STARTED` and `FAILED`; later stages have no audit
events. A successful order has one `SHIPPING` and one `EMAIL` notification.
Failed orders have no completion notifications.

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
4. **Process Payment** — simulated payment; configurable to succeed or fail.
5. **Confirm Order** — updates the order state after successful payment.
6. **Complete Order** — marks completion and publishes the completion event.

An `AuditDecorator` wraps each stage and records `STARTED`, then `SUCCESS` or
`FAILED`, in `audit_logs`. Expected processing exceptions are caught inside
the order transaction and the order is committed as `FAILED`; this preserves
the failure audit record. Database/infrastructure errors still abort the
transaction.

`OrderCompletionPublisher` publishes only when the final stage is reached.
`ShippingObserver` and `EmailObserver` listen after the transaction commits and
persist simulated outcomes in `notifications`. A database unique constraint
on `(order_id, notification_type)` prevents duplicate notification records.

### Demonstrate a failed payment

In IntelliJ's run configuration, set:

```text
SIMULATE_PAYMENT_FAILURE=true
```

Restart the backend and submit a valid order. The result should have
`orderStatus: "FAILED"` and `paymentStatus: "FAILED"`. The audit shows
`Process Payment` as failed; `Confirm Order` and `Complete Order` are not run,
and the notifications endpoint returns an empty array. Set the variable back
to `false` and restart to demonstrate success.

## 7. Run the React client

In another PowerShell terminal:

```powershell
Set-Location stacks\Frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal. The Vite configuration proxies
`/api` requests to `http://localhost:8080`, so start MySQL and Spring Boot
first. The frontend displays the catalogue, submits customer/book IDs and
quantities, and uses the order, audit, and notification endpoints to render
the processing monitor.

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
