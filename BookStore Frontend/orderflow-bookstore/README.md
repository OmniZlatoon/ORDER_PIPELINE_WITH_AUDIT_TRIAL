# OrderFlow Bookstore — Order Pipeline with Audit Trail

A web-based online bookstore order-processing demonstration system featuring **two completely separate React frontends** that communicate exclusively with an external **Java Spring Boot REST API** and **MySQL** database.

## Architecture & Backend Boundary

- **External Backend & Database**: The Java Spring Boot backend and MySQL database are completely external to these frontend applications. Neither React frontend connects directly to MySQL, contains database drivers, or stores fake/mock business data.
- **Authoritative Processing**: The Spring Boot backend owns all business logic, retrieves authoritative book prices and stock quantities from MySQL, calculates the authoritative order total, and executes every order through a fixed **six-stage pipeline**:
  1. `Validate Order`
  2. `Check Inventory`
  3. `Calculate Total`
  4. `Process Payment`
  5. `Confirm Order`
  6. `Complete Order`
- **Audit Decorator**: Each executed pipeline stage is wrapped by a backend `AuditDecorator` that persists `STARTED`, `SUCCESS`, and `FAILED` audit events in MySQL. If any stage fails, subsequent stages do not execute.
- **Observer Notifications**: Upon successful completion, the backend publishes an `OrderCompleted` event handled once by `ShippingObserver` (`SHIPPING`) and once by `EmailObserver` (`EMAIL`). Neither observer is triggered when an order fails.

## Two Separate Frontend Applications

The codebase is organized into two independent, separately runnable Vite + React applications under `orderflow-bookstore/`:

1. **`customer-frontend/`** — Customer-facing storefront:
   - `/` — Book catalogue and order item selection (`GET /api/books`)
   - `/checkout` — Customer details form and order submission (`POST /api/orders`)
   - `/orders/:orderId` — Order Result & Processing Monitor (6-stage pipeline, audit events, observer outcomes)
   - `/order-lookup` — Search an order by Order ID or Order Reference

2. **`admin-frontend/`** — Administrator monitoring, audit, and stock management console:
   - `/admin` — Administrator Dashboard (orders overview via `GET /api/orders` when exposed, or direct Order Lookup fallback)
   - `/admin/books` — Book Stock Management (add, update, adjust stock, and delete books)
   - `/admin/orders/:orderId` — Order Processing Monitor
   - `/admin/orders/:orderId/audit` — Read-only chronological Audit History with step/status filters
   - `/admin/orders/:orderId/notifications` — Read-only Shipping & Email Notification Monitor
   - `/admin/order-lookup` — Search an order by Order ID or Order Reference

## Environment Variables

Both `customer-frontend` and `admin-frontend` read the Spring Boot backend URL from `VITE_API_BASE_URL` (defined in `.env`, based on `.env.example`).

Example `.env` configuration:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Installing and Running the Customer Frontend

```bash
cd orderflow-bookstore/customer-frontend
cp .env.example .env
npm install
npm run dev
```

By default, the customer frontend runs on `http://localhost:5173`.

## Installing and Running the Administrator Frontend

```bash
cd orderflow-bookstore/admin-frontend
cp .env.example .env
npm install
npm run dev
```

By default, the administrator frontend runs on `http://localhost:5174`.

## Backend REST API Endpoints Used

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/books` | Retrieve available books (`bookId`, `title`, `author`, `price`, `stockQuantity`) |
| `POST` | `/api/books` | *(Admin)* Add a new book to stock |
| `PUT` / `PATCH` | `/api/books/{bookId}` | *(Admin)* Update book details or stock quantity |
| `DELETE` | `/api/books/{bookId}` | *(Admin)* Delete/remove a book from stock |
| `POST` | `/api/orders` | Submit customer details and selected book items |
| `GET` | `/api/orders/{orderId}` | Retrieve authoritative order summary and statuses |
| `GET` | `/api/orders/{orderId}/audit` | Retrieve chronological audit events (`STARTED`, `SUCCESS`, `FAILED`) |
| `GET` | `/api/orders/{orderId}/notifications` | Retrieve `SHIPPING` and `EMAIL` observer notification records |
| `GET` | `/api/orders` *(optional)* | Retrieve orders list for the Administrator Dashboard overview |
