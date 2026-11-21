# Frontend

React/Vite single-page application for the book catalogue, order form, and six-stage processing monitor.

```powershell
npm install
npm run dev
```

Vite proxies `/api` and `/fapshi_demo` requests to `http://localhost:8080`. Start MySQL and the Spring Boot backend first. Set `VITE_API_BASE_URL` only when using a different API origin.

The development server uses `http://localhost:5173` by default. After an order
is created, the payment panel offers Fapshi-hosted checkout. The payer enters
their email and Mobile Money details on Fapshi's page before proceeding.
After checkout, the app asks the backend to reconcile the transaction with
Fapshi and refreshes the six-stage audit timeline and observer outcomes.
The order remains pending until Fapshi's payment-status endpoint confirms
success; a webhook or browser redirect alone is not treated as payment proof.
