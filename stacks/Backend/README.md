# Backend

This is a Java 21 / Spring Boot Maven project with the layered package structure described in the project design. It contains no Node, Kotlin, or other non-Java application code. Open `pom.xml` in IntelliJ IDEA and run `OrderPipelineApplication`.

The application expects MySQL at `localhost:3306`, database `order_pipeline`, user `order_app`, password `order_app`. Start the service in `../Database` first. The database schema is initialized by Docker Compose; Hibernate validates it at startup rather than silently creating a different schema.

Expected pipeline failures are caught and recorded as a `FAILED` order inside the order transaction. This lets the failed-stage audit record and failed order status commit together; infrastructure/database errors still abort the transaction.

Set these environment variables in the IntelliJ run configuration to override local settings:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SIMULATE_PAYMENT_FAILURE=true` to exercise a failed payment
- `FRONTEND_ORIGIN` to change the allowed development origin

Run backend tests with `mvn test`.

See the [end-to-end backend walkthrough](../../docs/Backend%20End-to-End%20Walkthrough.md)
for API examples, database setup, frontend integration, and success/failure demonstrations.
