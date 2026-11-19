# Database

This directory provides MySQL 8 for local development. The schema and sample catalogue are loaded on the first database initialization.

```powershell
Copy-Item .env.example .env
docker compose up -d
```

The backend defaults to the local connection in `../Backend/src/main/resources/application.yml`: database `order_pipeline`, user `order_app`, password `order_app`. To reset the local database and rerun initialization, stop Compose and remove the named `mysql_data` volume explicitly.

`init/01-schema.sql` defines the six required tables, their relationships and indexes, and a small sample catalogue. Audit rows are append-only through the application API.
