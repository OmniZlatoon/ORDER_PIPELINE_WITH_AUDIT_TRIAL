# Order Pipeline development stacks

The projects are split into three tiers:

- `Frontend/`: React/Vite customer order form and processing monitor.
- `Backend/`: Java 21 / Spring Boot REST API. Open `Backend/pom.xml` in IntelliJ IDEA as a Maven project.
- `Database/`: MySQL 8 schema, seed catalogue, and local Docker Compose service.

## Local startup

1. In `stacks/Database`, copy `.env.example` to `.env`, then run `docker compose up -d`.
2. In IntelliJ, open `stacks/Backend/pom.xml` and run `OrderPipelineApplication`. It connects to the local MySQL defaults in `application.yml`.
3. In `stacks/Frontend`, run `npm install` once and `npm run dev`. Open the URL printed by Vite.

To demonstrate a failed simulated payment, set `SIMULATE_PAYMENT_FAILURE=true` in the backend run configuration and restart the backend. No real payment, shipping, or email service is contacted.

See each subdirectory's README for its configuration and run commands.
