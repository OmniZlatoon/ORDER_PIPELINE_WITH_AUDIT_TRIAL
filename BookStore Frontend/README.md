# OrderFlow Bookstore — React + npm Frontend Workspace

This project uses **React**, **Vite**, and **npm** across the storefront so you can open the folder directly in **VS Code** and run everything with standard `npm` commands.

## Project Structure

- `src/` (`src/App.jsx`, `src/main.jsx`) — Root preview host on port `3000`
- `orderflow-bookstore/customer-frontend/` — Standalone **Customer Storefront** React app (default port `5173`)

---

## Prerequisites

- **Node.js** `18+` (includes `npm`)
- **VS Code**

---

## Quick Start in VS Code (Option A: Run from Workspace Root)

1. Open the project root folder in VS Code.
2. Open the VS Code Integrated Terminal (`Ctrl + ~` / `Cmd + ~`).
3. Install dependencies and start the app:

```bash
npm install
npm run dev
```

The app runs at **`http://localhost:3000`**.

---

## Quick Start in VS Code (Option B: Run Standalone Customer Frontend)

1. Install dependencies from the root folder:

```bash
npm run install:all
```

2. Copy environment configuration if needed:

```bash
cp orderflow-bookstore/customer-frontend/.env.example orderflow-bookstore/customer-frontend/.env
```

3. Start the standalone Customer Storefront (`http://localhost:5173`):

```bash
npm run dev:customer
```

*(You can also `cd orderflow-bookstore/customer-frontend` and run `npm install` followed by `npm run dev` directly inside that folder.)*

---

## Environment Configuration

Configure your backend service URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## Available npm Scripts (Root)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Run the React storefront on port `3000` |
| `npm run dev:customer` | Run the standalone Customer frontend (`5173`) |
| `npm run install:all` | Install dependencies for root and customer storefront |
| `npm run build` | Build the root app |
| `npm run build:customer` | Build the standalone Customer frontend |
| `npm run build:all` | Build root and customer apps |
| `npm run lint` | Run static checks across the workspace |
