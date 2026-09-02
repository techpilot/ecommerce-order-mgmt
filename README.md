# E-Commerce Order Management System

A take-home implementation of a simplified order management system: a **NestJS API**
(auth, products, orders), a **.NET inventory microservice** (stock validation and
atomic decrement), and a **React dashboard**. Built as an Nx monorepo for the two
TypeScript apps, with the .NET service kept alongside as an independent, HTTP-only
dependency.

---

## 1. Architecture

```
                         ┌─────────────────────┐
                         │   React Dashboard    │
                         │   (apps/react-dashboard)   │
                         └──────────┬───────────┘
                                    │ HTTPS (JWT bearer + refresh cookie)
                                    ▼
                         ┌─────────────────────┐        ┌──────────────────────┐
                         │     NestJS API       │  HTTP  │  .NET Inventory Svc  │
                         │     (apps/nest-api)       ├───────►│  (inventory-service) │
                         │ Auth / Products /    │        │  GET  /inventory/:sku│
                         │ Orders               │        │  POST /inventory/    │
                         └──────────┬───────────┘        │       reserve        │
                                    │                     └──────────┬───────────┘
                                    ▼                                ▼
                         ┌─────────────────────┐        ┌──────────────────────┐
                         │   PostgreSQL          │        │   SQLite              │
                         │   (Prisma)            │        │   (EF Core)           │
                         └─────────────────────┘        └──────────────────────┘
```

The NestJS API is the primary backend: it owns auth, products, and orders. When an
order is created, it calls the .NET service **synchronously over HTTP** to validate
and decrement stock before the order is persisted — if the inventory service rejects
the reservation (insufficient stock, unknown SKU, or is unreachable), the order is
never written.

### Why Nx, and why .NET sits outside it

The NestJS API and React dashboard live in one Nx workspace (`apps/api`,
`apps/dashboard`) sharing a `libs/shared-types` library, common TypeScript tooling,
and a single `npm install`. The .NET service is a **sibling folder** at the repo
root (`inventory-service/`), entirely outside the Nx workspace — Nx has no .NET
plugin and there's nothing to gain by forcing it in. The two stacks are connected
at exactly one point: an HTTP call from `OrdersService` to
`http://inventory-service:8080` (or `localhost:5000` outside Docker), configured via
`INVENTORY_SERVICE_URL`. `docker-compose.yml` is what actually ties all three
services (plus Postgres) together at runtime, on a shared Docker network where each
service resolves the others by name.

There's no learning-curve cost from this split: Nx is used here purely as a thin
wrapper over the Nest CLI and Vite (via `nx serve`, `nx build`, `nx test`) plus a
shared `tsconfig` path alias for `libs/shared-types` — no generators, executors, or
caching features beyond that were needed.

---

## 2. Repository structure

```
ecommerce-order-mgmt/
├── apps/
│   ├── nest-api/                     # NestJS — auth, products, orders
│   │   ├── prisma/schema.prisma
│   │   ├── src/app/
│   │   │   ├── auth/            # JWT access+refresh, passport strategies/guards
│   │   │   ├── products/        # CRUD, pagination, filtering, search
│   │   │   ├── orders/          # order creation + inventory-service client
│   │   │   └── prisma/          # PrismaService (global module)
│   │   ├── src/common/          # global exception filter, shared interfaces
│   │
│   └── dashboard/                # React (Vite) — auth flow, products, orders
│       └── public
│       └── src
│           ├── app/
│           ├── assets/
│           ├── components/
│           ├── features/
│           ├── lib/
│           ├── store/
│           ├── types/
│           └── main
├── docker/
│   └── nest-api.Dockerfile
|.  └── react-dashboard.Dockerfile
├── inventory-service/             # .NET 8 minimal API — NOT an Nx project
│   ├── Program.cs
│   ├── Data/InventoryDbContext.cs
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 3. Tech stack

| Layer                  | Choice                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| Primary API            | NestJS 11, Prisma ORM, PostgreSQL                                         |
| Inventory microservice | .NET 8 Minimal API, EF Core, SQLite, Polly                                |
| Frontend               | React 18 (Vite), React Router, React Query, Redux Toolkit + redux-persist |
| Auth                   | JWT access (15m) + refresh (7d), passport-jwt                             |
| Validation             | class-validator / class-transformer DTOs, global `ValidationPipe`         |
| Docs                   | Swagger / OpenAPI at `/api/docs`                                          |
| Containerization       | Docker, docker-compose                                                    |

---

## 4. Prerequisites

- Node.js 22.14.0+ and npm
- .NET 8 SDK
- Docker & Docker Compose (for the full-stack run)
- PostgreSQL (if running the API outside Docker)

---

## 5. Running locally (without Docker)

### 5.1 NestJS API

### From the root

```bash
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, INVENTORY_SERVICE_URL
npm install                # from the repo root, if not already done
npm run prisma:generate
npm run prisma:migrate     # creates tables against your local Postgres
npm run dev:nest           # http://localhost:3000/api/v1
```

Swagger docs: `http://localhost:3000/api/docs`.

### 5.2 .NET inventory service

```bash
cd inventory-service
dotnet restore
dotnet run                 # http://localhost:5000 by default (see launchSettings.json)
```

The database is a local SQLite file (`inventory.db`), created and seeded
automatically on first run via `EnsureCreated()`.

### 5.3 React dashboard

#### From the root

```bash
npm run dev:react      # http://localhost:4200
```

---

## 6. Running everything with Docker Compose

```bash
docker compose up --build
```

This brings up, on one Docker network:

| Service             | Container port | Host port |
| ------------------- | -------------- | --------- |
| `postgres`          | 5432           | 5432      |
| `inventory-service` | 8080           | 5100      |
| `api`               | 3000           | 3000      |
| `dashboard` (nginx) | 80             | 4200      |

The API waits for Postgres's healthcheck before starting. Run migrations once the
stack is up:

```bash
docker compose exec api npx prisma migrate deploy
```

`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` can be overridden via a `.env` file at
the repo root (picked up automatically by Compose); otherwise dev defaults are
used — **do not use the defaults outside local development.**

---

## 7. API overview

Base URL: `/api/v1` (see [versioning](#9-bonus-features-implemented) below).
Full interactive documentation: **`/api/docs`** (Swagger UI).

| Method           | Path             | Auth           | Description                                                          |
| ---------------- | ---------------- | -------------- | -------------------------------------------------------------------- |
| POST             | `/auth/register` | –              | Create an account                                                    |
| POST             | `/auth/login`    | –              | Returns access token in body, refresh token as httpOnly cookie       |
| POST             | `/auth/refresh`  | refresh cookie | Rotates and returns a new token pair                                 |
| POST             | `/auth/logout`   | access token   | Revokes the stored refresh token, clears the cookie                  |
| GET              | `/products`      | access token   | Paginated list, `?search=&minPrice=&maxPrice=&page=&limit=`          |
| POST             | `/products`      | access token   | Create a product                                                     |
| GET/PATCH/DELETE | `/products/:id`  | access token   | Single-product operations                                            |
| POST             | `/orders`        | access token   | Create an order — reserves stock via the .NET service, then persists |
| GET              | `/orders`        | access token   | Current user's orders, newest first                                  |
| GET              | `/orders/:id`    | access token   | Single order (must belong to the requesting user)                    |

### Authentication & token strategy

- **Access token**: short-lived (15m), returned in the response body, held **only
  in memory** on the frontend (never `localStorage`/`sessionStorage`) — this avoids
  the XSS-exposure trade-off entirely rather than just documenting it.
- **Refresh token**: long-lived (7d), delivered as an **httpOnly, `SameSite=Strict`
  cookie** scoped to `/auth`, so it's inaccessible to JavaScript and only ever sent
  to the refresh/logout endpoints.
- Refresh tokens are **rotated** on every use and stored **hashed** (bcrypt) in the
  database — presenting a stale/reused refresh token revokes the session outright.
- On page load, the frontend calls `/auth/refresh` once to silently restore a
  session from the httpOnly cookie, without ever touching persisted storage for
  the token itself (only the non-sensitive `{ id, email }` user object is persisted
  via redux-persist).

---

## 8. Order creation flow, concurrency, and its known limitation

1. `OrdersController` validates the DTO (non-empty `items[]`, `customerName`,
   positive integer quantities).
2. `OrdersService` looks up all referenced products in one query; unknown product
   IDs fail the whole request with a 404 before any inventory call is made.
3. For each item, **sequentially**, it calls the .NET service's
   `POST /inventory/reserve` with that product's SKU and quantity.
4. The .NET service performs the check-and-decrement as a **single atomic
   conditional `UPDATE ... WHERE StockQuantity >= @qty`** — this closes the
   race-condition window entirely at the database level; two concurrent requests
   for the last unit of a SKU cannot both succeed. Transient SQLite lock errors
   (`SQLITE_BUSY`) are retried with a short backoff via **Polly**.
5. Once every item's stock is reserved, the order (with `status: confirmed`) and
   its line items are written in one Prisma call.

**Known, deliberate limitation**: the inventory service exposes only `reserve`, not
a compensating `release`. If item 3 of a 5-item order fails, items 1–2 remain
decremented with no order created to account for them. Given the assessment's API
surface, adding a full saga/compensation flow was out of scope — this is logged
clearly (`OrdersService`, `Logger.warn`) rather than silently ignored. In a
production system this would be solved with either an idempotent
`POST /inventory/release` endpoint, or by moving reservation to an outbox/saga
pattern so partial failures unwind automatically.

---

## 9. Bonus features implemented

- ✅ **API versioning** — URI versioning (`/api/v1/...`), enabled globally with a default version, so future breaking changes can ship as `/api/v2` alongside it.
- ✅ **Rate limiting + Helmet** — global throttle (20 req/10s per IP) via `@nestjs/throttler`, with a stricter 5 req/min limit specifically on `/auth/login` and `/auth/register` to blunt brute-force attempts. `helmet()` applied globally for standard security headers.
- ✅ **Swagger / OpenAPI** — full interactive docs at `/api/docs`, generated from the same DTOs used for validation.
- ✅ **Nx monorepo** — see [Architecture](#1-architecture) above.
- ✅ **Full docker-compose** — all four services (Postgres, .NET inventory service, NestJS API, React dashboard) are built and networked together with one `docker compose up`.

---

## 10. Testing

```bash
npx nx test api
```

- **Unit tests** (`*.service.spec.ts`), all with mocked `PrismaService` /
  `InventoryClientService` — no live database or network calls:
  - `auth.service.spec.ts` — registration conflict handling, login success/failure,
    refresh-token rotation and reuse/mismatch revocation.
  - `products.service.spec.ts` — creation, pagination math, search/price-range
    filter construction, not-found handling.
  - `orders.service.spec.ts` — happy-path total calculation and per-item
    reservation calls, missing-product rejection, and the partial-failure path
    (order never persisted if any reservation fails).
- **Integration test** (`orders.integration.spec.ts`) — boots the real
  `OrdersModule` behind Nest's HTTP test server (real guard, real
  `ValidationPipe`, real global exception filter), with `PrismaService` and
  `InventoryClientService` swapped for lightweight in-memory fakes. Covers the
  full `POST /orders` request path: successful creation, DTO validation
  rejection (empty `items[]`), and 404 on an unknown product — without requiring
  a live Postgres or the .NET service to be running.

---

## 11. Other notable trade-offs

- **SQLite over SQL Server** for the inventory service: zero external
  dependency, trivially swapped for SQL Server later via the EF Core connection
  string alone — appropriate for a service this small and for the assessment's
  time box.
- **Minimal APIs over Controllers** on the .NET side, for the same reason:
  less ceremony for two endpoints.
- **Polling over WebSocket** for order status updates on the dashboard
  (`refetchInterval` via React Query) — the spec allows either; polling is
  simpler to reason about and sufficient at this scale.
- **Money as `Prisma.Decimal`**, not floating point, throughout the order total
  calculation — the API always serializes `Decimal` fields as **strings** in
  JSON responses, which the frontend explicitly converts via a small adapter
  layer (`lib/adapters.ts`) rather than doing arithmetic on raw API payloads.
