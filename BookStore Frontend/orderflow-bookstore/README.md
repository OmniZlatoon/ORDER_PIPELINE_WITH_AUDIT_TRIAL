# OrderFlow Bookstore — Online Bookstore Storefront

A web-based online bookstore storefront built with **React**, **Vite**, and **npm** that communicates with the external backend order-processing service.

## Frontend Routes

1. **`customer-frontend/`** — Customer-facing storefront:
   - `/` — Book catalogue and order item selection (`GET /api/books`)
   - `/checkout` — Place Order form (customer details, book selection, and order submission via `POST /api/orders`)
   - `/orders/:orderId` — Order Result & Processing Monitor (6-stage pipeline, activity updates, and delivery/email notifications)
   - `/order-lookup` — Search an order by Order ID or Order Reference

## Environment Variables

`customer-frontend` reads the backend URL from `VITE_API_BASE_URL` (defined in `.env`, based on `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Installing and Running

```bash
cd orderflow-bookstore/customer-frontend
cp .env.example .env
npm install
npm run dev
```

By default, the customer frontend runs on `http://localhost:5173`.
