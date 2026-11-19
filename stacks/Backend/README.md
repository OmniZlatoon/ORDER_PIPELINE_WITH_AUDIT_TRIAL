# Backend

This is a Java 21 / Spring Boot Maven project with the layered package structure described in the project design. It contains no Node, Kotlin, or other non-Java application code. Open `pom.xml` in IntelliJ IDEA and run `OrderPipelineApplication`.

The application defaults to MySQL at `localhost:3306`, database `order_pipeline`, and user `root`. Set `DB_PASSWORD` in the IntelliJ run configuration; the password default is intentionally blank and must not be added to `application.yml`. For the Docker Compose database, set `DB_USERNAME=order_app` and `DB_PASSWORD=order_app` instead. Hibernate validates the schema at startup rather than silently creating a different schema.

For an existing local MySQL server, execute `../Database/init/01-schema.sql` using an account allowed to initialize the schema, then set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in the IntelliJ run configuration. The SQL script does not create a MySQL login.

Expected pipeline failures are caught and recorded as a `FAILED` order inside the order transaction. This lets the failed-stage audit record and failed order status commit together; infrastructure/database errors still abort the transaction.

Set these environment variables in the IntelliJ run configuration to override local settings:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SIMULATE_PAYMENT_FAILURE=true` to exercise a failed payment
- `FRONTEND_ORIGIN` to set the allowed development origin(s), comma-separated

Run backend tests with `mvn test`.

See the [end-to-end backend walkthrough](../../docs/Backend%20End-to-End%20Walkthrough.md)
for API examples, database setup, frontend integration, and success/failure demonstrations.
