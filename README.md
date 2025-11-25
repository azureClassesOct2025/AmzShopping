# Marketplace Microservices (Amazon-style Demo)

This repository contains a lightweight .NET 8 microservices suite that emulates the core flows of an Amazon-like storefront. It is intentionally simple (in-memory persistence, no queues) so the focus stays on service boundaries, API contracts, and composition via a gateway layer.

## Solution layout

- `src/Shared/Marketplace.Contracts` – shared DTOs used by every service
- `src/Services/IdentityService` – handles sign-up/login/profile data
- `src/Services/CatalogService` – exposes products, categories, and featured deals
- `src/Services/OrderingService` – accepts carts and tracks order status
- `src/Gateway/ApiGateway` – aggregates downstream APIs into storefront-friendly responses

Each microservice is an independent ASP.NET Core Web API with Swagger enabled for discovery.

## Local development

1. **Restore / build everything**
   ```powershell
   dotnet restore
   dotnet build
   ```
2. **Run each service over HTTP** (separate terminals recommended):
   ```powershell
   # Identity (http://localhost:5101)
   dotnet run --project src/Services/IdentityService/IdentityService.csproj --urls "http://localhost:5101"

   # Catalog (http://localhost:5201)
   dotnet run --project src/Services/CatalogService/CatalogService.csproj --urls "http://localhost:5201"

   # Ordering (http://localhost:5301)
   dotnet run --project src/Services/OrderingService/OrderingService.csproj --urls "http://localhost:5301"

   # Gateway (http://localhost:5401)
   dotnet run --project src/Gateway/ApiGateway/ApiGateway.csproj --urls "http://localhost:5401"
   ```
   Update `src/Gateway/ApiGateway/appsettings.json` if you change any downstream URLs.

3. **Explore the APIs**
   - Gateway storefront snapshot: `GET http://localhost:5401/storefront/home?userId=<id>`
   - Checkout: `POST http://localhost:5401/storefront/checkout`
   - Identity Swagger UI: `http://localhost:5101/swagger`

4. **Run the React storefront UI**
   ```powershell
   cd src/Web/StorefrontApp
   npm install
   npm run dev -- --host
   ```
   The dev server runs on `http://localhost:5173` and consumes the gateway + identity services via CORS. Build artifacts live under `src/Web/StorefrontApp/dist` (`npm run build`).

## Sample flows

1. **Register/login** via `POST /auth/register` or `POST /auth/login`. The Identity service seeds `jane@amazon-demo.com` / `Sup3rSecure!`.
2. **Browse products** through `GET /products`, filter by `category` or `search`.
3. **Create an order** by posting a cart payload to `POST /orders` (direct) or `POST /storefront/checkout` (gateway).
4. **Track user orders** via `GET /orders/by-user/{userId}`.

## Extending the demo

- Swap in persistent stores per service (SQL, Mongo, Dynamo).
- Replace the gateway with YARP or API Management.
- Add asynchronous flows (order events, loyalty accrual) via queues or gRPC.
- Introduce observability (OpenTelemetry) or identity federation (Cognito/Auth0).

This repo gives you a clean starting point for experimenting with .NET microservices while keeping the Amazon-inspired domain front-of-mind.

