# Order Pipeline development stacks

The projects are split into three tiers:

- `Frontend/`: OrderFlow Books React/Vite storefront, checkout, payment handoff, order lookup, and audit monitor.
- `Backend/`: Java 21 / Spring Boot REST API. Open `Backend/pom.xml` in IntelliJ IDEA as a Maven project.
- `Database/`: MySQL 8 schema, seed catalogue, and local Docker Compose service.

## Local startup

1. In `stacks/Database`, copy `.env.example` to `.env`, then run `docker compose up -d`.
2. In IntelliJ, open `stacks/Backend/pom.xml` and run `OrderPipelineApplication`. It connects to the local MySQL defaults in `application.yml`.
3. In `stacks/Frontend`, run `npm ci` and `npm run dev`. The app is served at `http://localhost:7000`.

The storefront proxies `/api` and `/fapshi_demo` to the backend on port `8080`.
For Fapshi sandbox returns, expose the storefront on port `7000` using the
configured ngrok hostname. The backend's `FRONTEND_BASE_URL` defaults to
`https://subtarsal-kathyrn-untreated.ngrok-free.dev`; Fapshi returns to that
frontend with the order ID in the query string, and the storefront opens the
order status page to verify payment with the backend.

To demonstrate a failed simulated payment, set `SIMULATE_PAYMENT_FAILURE=true` in the backend run configuration and restart the backend. No real payment, shipping, or email service is contacted.

See each subdirectory's README for its configuration and run commands.
