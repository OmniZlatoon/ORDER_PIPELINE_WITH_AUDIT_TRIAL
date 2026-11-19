# Frontend

React/Vite single-page application for the book catalogue, order form, and six-stage processing monitor.

```powershell
npm install
npm run dev
```

Vite proxies `/api` requests to `http://localhost:8080`. Start MySQL and the Spring Boot backend first. Set `VITE_API_BASE_URL` only when using a different API origin.
