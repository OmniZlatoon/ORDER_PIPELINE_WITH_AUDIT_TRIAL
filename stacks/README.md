# Order Pipeline development stacks

The projects are split into three tiers:

- `Frontend/`: React/Vite order-processing reference client and monitor.
- `../BookStore Frontend/orderflow-bookstore/Frontend/`: OrderFlow Books customer storefront and checkout.
- `Backend/`: Java 21 / Spring Boot REST API. Open `Backend/pom.xml` in IntelliJ IDEA as a Maven project.
- `Database/`: MySQL 8 schema, seed catalogue, and local Docker Compose service.

## Local startup

1. In `stacks/Database`, copy `.env.example` to `.env`, then run `docker compose up -d`.
2. In IntelliJ, open `stacks/Backend/pom.xml` and run `OrderPipelineApplication`. It connects to the local MySQL defaults in `application.yml`.
3. In `stacks/Frontend`, run `npm ci` and `npm run dev`. The reference client is served at `http://localhost:5173`.
4. To run the customer storefront, open `BookStore Frontend/orderflow-bookstore/Frontend`, run `npm ci` and `npm run dev`. It is served at `http://localhost:5174`.

Both frontends proxy `/api` and `/fapshi_demo` to the backend on port `8080`.
For Fapshi sandbox returns, expose the customer storefront on port `5174` using
the configured ngrok hostname. The backend's `FRONTEND_BASE_URL` defaults to
`https://subtarsal-kathyrn-untreated.ngrok-free.dev`; Fapshi returns to that
frontend with the order ID in the query string, and the storefront opens the
order status page to verify payment with the backend.

To demonstrate a failed simulated payment, set `SIMULATE_PAYMENT_FAILURE=true` in the backend run configuration and restart the backend. No real payment, shipping, or email service is contacted.

See each subdirectory's README for its configuration and run commands.
