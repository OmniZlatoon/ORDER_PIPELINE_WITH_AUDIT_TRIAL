# Backend

This is a Java 21 / Spring Boot Maven project with the layered package structure described in the project design. It contains no Node, Kotlin, or other non-Java application code. Open `pom.xml` in IntelliJ IDEA and run `OrderPipelineApplication`.

The backend loads payment settings from an untracked `stacks/Backend/.env` file when its working directory is `stacks/Backend`. If `.env` does not already exist, copy `.env.example` to create it; otherwise preserve its existing credentials and add `FAPSHI_WEBHOOK_SECRET`. Set that value to the webhook secret configured in the Fapshi dashboard. Keep `.env` private and never commit it.

The application defaults to MySQL at `localhost:3306`, database `order_pipeline`, and user `root`. Set `DB_PASSWORD` in the IntelliJ run configuration; the password default is intentionally blank and must not be added to `application.yml`. For the Docker Compose database, set `DB_USERNAME=order_app` and `DB_PASSWORD=order_app` instead. Hibernate validates the schema at startup rather than silently creating a different schema.

For an existing local MySQL server, execute `../Database/init/01-schema.sql` using an account allowed to initialize the schema, then set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in the IntelliJ run configuration. The SQL script does not create a MySQL login.

Expected pipeline failures are caught and recorded as a `FAILED` order inside the order transaction. This lets the failed-stage audit record and failed order status commit together; infrastructure/database errors still abort the transaction.

Set these environment variables in the IntelliJ run configuration to override local settings:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SIMULATE_PAYMENT_FAILURE=true` to exercise a failed payment
- `FRONTEND_ORIGIN` to set the allowed development origin(s), comma-separated
- `FRONTEND_BASE_URL` to override the default ngrok browser URL Fapshi returns to after checkout
- `FAPSHI_WEBHOOK_SECRET` to verify Fapshi's `x-wh-secret` notification header
- `EXCHANGE_RATE_API_URL` to override the primary USD/XAF rate API
- `EXCHANGE_RATE_FALLBACK_API_URL` to override the fallback USD/XAF rate API

Hosted checkout converts the server-calculated USD total to whole XAF using
Open ER API with a daily-rate fallback, then waits in `PENDING` for a verified Fapshi
webhook whose transaction ID, order reference, and XAF amount match the order.
The backend checks for rate updates on startup, every six hours, and on demand.
The validated rate may be up to 36 hours old to accommodate delayed daily
provider updates; freshness uses the provider's published update date and is
not reset just by fetching the same old value. The pipeline fails safely if
no rate within that limit is available.
Only a matching `SUCCESSFUL` response from Fapshi's payment-status endpoint
sets `paymentStatus=SUCCESS` and permits the final order stages to complete.
The callback status or browser redirect alone is never treated as proof of
payment. After checkout returns, the frontend rechecks pending orders through
`POST /api/orders/{orderId}/reconcile-payment`; temporary provider errors leave
the order pending and are retried.

The customer storefront in
`BookStore Frontend/orderflow-bookstore/Frontend` runs on port `5174` and
proxies `/api` and `/fapshi_demo` to this backend.
It uses `GET /api/exchange-rate/usd-xaf` for the checkout estimate and
`GET /api/orders/reference/{orderReference}` for reference-based lookup.
Order responses include their order-item lines; the existing `order_items`
table is the join entity implementing the Order-to-Book many-to-many relation.
`FRONTEND_BASE_URL` defaults to
`https://subtarsal-kathyrn-untreated.ngrok-free.dev`, so Fapshi redirects to
the storefront with the order ID in the query string.

Run backend tests with `mvn test`.

See the [end-to-end backend walkthrough](../../docs/Backend%20End-to-End%20Walkthrough.md)
for API examples, database setup, frontend integration, and success/failure demonstrations.
