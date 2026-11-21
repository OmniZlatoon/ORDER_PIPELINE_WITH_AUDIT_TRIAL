# OrderFlow Books storefront

The customer storefront is a React/Vite application connected to the Spring
Boot API.

## Run locally

From this directory:

```powershell
npm ci
npm run dev
```

Vite serves the app at `http://localhost:7000` and proxies `/api` and
`/fapshi_demo` to `http://localhost:8080`. Copy `.env.example` to `.env` only
when you need a custom API base URL; keep local environment files private.

## Fapshi return

The backend creates hosted checkout with the configured frontend base URL.
`FRONTEND_BASE_URL` defaults to
`https://subtarsal-kathyrn-untreated.ngrok-free.dev`. When using this ngrok
hostname, forward its traffic to the Vite server on port `7000`. Fapshi returns
to the frontend with `?orderId=<id>`; the storefront opens the order status
page and asks the backend to verify the payment. A redirect by itself never
marks an order as paid.
