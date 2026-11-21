# Hotel Offer Orchestrator

Pulls hotel offers for a city from two mock suppliers, keeps the cheapest offer per hotel, stores the result in Redis and serves it with optional price filtering. The fetch/compare step runs as a Temporal workflow.

**Stack:** Node.js (TypeScript), Express, Temporal, Redis, Docker Compose

## How it works

```
GET /api/hotels?city=delhi&minPrice=4000&maxPrice=6000
        |
        v
   Express API ---- starts ----> Temporal workflow (hotelOffersWorkflow)
        |                              |
        |                              |-- fetchSupplierHotels(supplierA)  \  in parallel
        |                              |-- fetchSupplierHotels(supplierB)  /
        |                              |-- dedupe by hotel name, keep cheapest
        |                              '-- saveOffers -> Redis
        v
   Redis (sorted set by price + hash of offers)  ->  price filter  ->  response
```

- The API and the Temporal worker are separate processes (separate containers in Compose).
- The mock suppliers live inside the API (`/supplierA/hotels`, `/supplierB/hotels`). The worker calls them over HTTP like it would a real supplier.
- If one supplier fails (after 3 retries) the workflow carries on with the other one. If both fail the API answers `502`.
- Redis keys per city: `hotels:<city>:prices` (sorted set, score = price) and `hotels:<city>:offers` (hash with the offer JSON). Price filtering is a `ZRANGEBYSCORE`. Keys expire after `OFFERS_TTL_SECONDS` (10 minutes by default).
- If both suppliers list a hotel at the same price, the one with the higher commission wins.

## Run with Docker

```bash
docker compose up --build
```

| Service     | URL                    |
| ----------- | ---------------------- |
| API         | http://localhost:3000  |
| Temporal UI | http://localhost:8233  |

The Temporal service uses the dev server (in-memory), which is fine for this project but not for production.

```bash
curl "http://localhost:3000/api/hotels?city=delhi"
curl "http://localhost:3000/api/hotels?city=delhi&minPrice=4000&maxPrice=6000"
curl "http://localhost:3000/health"
```

## Run locally

You need Node 20+, a Redis on `localhost:6379` and a Temporal server on `localhost:7233`. The quickest way to get the last two:

```bash
docker compose up redis temporal -d
```

Then, in two terminals:

```bash
npm install
npm run dev          # API
npm run dev:worker   # Temporal worker
```

Copy `.env.example` to `.env` if you want to change any setting (they are plain environment variables, export them or use your shell's loader).

## API

### `GET /api/hotels`

| Param      | Required | Description                      |
| ---------- | -------- | -------------------------------- |
| `city`     | yes      | e.g. `delhi`, `mumbai`           |
| `minPrice` | no       | inclusive lower bound            |
| `maxPrice` | no       | inclusive upper bound            |

```json
[
  { "name": "Holtin", "price": 5340, "supplier": "Supplier B", "commissionPct": 20 },
  { "name": "Radison", "price": 5900, "supplier": "Supplier A", "commissionPct": 13 }
]
```

Results are sorted by price. A city with no hotels returns `[]`. Invalid input returns `400`, both suppliers down returns `502`.

### `GET /health`

```json
{
  "status": "degraded",
  "suppliers": { "supplierA": "up", "supplierB": "down" },
  "redis": "up",
  "temporal": "up",
  "uptimeSeconds": 42
}
```

`status` is `ok` when everything is up, `degraded` (HTTP 200) when one supplier is down, and `down` (HTTP 503) when both suppliers, Redis or Temporal are unreachable.

### Mock suppliers

- `GET /supplierA/hotels?city=delhi`
- `GET /supplierB/hotels?city=delhi`
- `PUT /mock/suppliers/:id` with `{ "down": true }` to simulate an outage (`supplierA` or `supplierB`), `{ "down": false }` to bring it back.

Data is available for `delhi` and `mumbai`.

## Postman

Import `postman/hotel-offer-orchestrator.postman_collection.json`. It covers a city with overlapping hotels, price filtering, a city with no results, input validation, a supplier outage and the health check. Set the `baseUrl` collection variable if the API is not on `localhost:3000`.

## Tests

```bash
npm test
```

## Configuration

| Variable              | Default                  |
| --------------------- | ------------------------ |
| `PORT`                | `3000`                   |
| `REDIS_URL`           | `redis://localhost:6379` |
| `TEMPORAL_ADDRESS`    | `localhost:7233`         |
| `TEMPORAL_NAMESPACE`  | `default`                |
| `TASK_QUEUE`          | `hotel-offers`           |
| `SUPPLIER_BASE_URL`   | `http://localhost:3000`  |
| `OFFERS_TTL_SECONDS`  | `600`                    |
| `LOG_LEVEL`           | `info`                   |
