# Moviebox Backend

Backend-only, independently written content catalog and legal playback-source service. It does not scrape protected endpoints, bypass DRM/authentication/paywalls, or seed unauthorized streams. PostgreSQL uses `pg` and versioned SQL migrations behind repository ports; Redis, BullMQ, and OpenSearch are optional infrastructure adapters. Firebase/Firestore configuration and a documented model are prepared, but Firebase is not connected in this phase.

## Run

```bash
cp .env.example .env
pnpm install
pnpm run db:migrate
pnpm run db:status
pnpm run build
pnpm run test
pnpm run dev
```

Docker: `docker compose up --build`. API is under `/api/v1`; `/health` is process health and `/ready` reports process readiness. Admin requests require `x-admin-api-key`.

Render deployment is described in `render.yaml`: the web service runs `node dist/src/server.js` and the background worker runs `node dist/src/worker.js`. PostgreSQL/Redis/OpenSearch URLs are supplied as Render environment variables. All `FIREBASE_*` values may remain empty; no Firebase Admin SDK, service-account JSON, or private key is used.

The repository includes Fastify, PostgreSQL SQL migrations/schema, parameterized repositories and transactions, provider normalization/idempotent sync, repository/cache/search/job interfaces, Redis cache/locks, BullMQ queues/workers, OpenSearch indexing/search adapters, Firestore-ready model documentation, source ranking/fallback rules, SSRF-safe policy boundary (no arbitrary URL fetcher), structured logging, rate limiting, security headers, provider capability contracts, tests, Docker, Render configuration, and production checks. External provider terms, licenses, API quotas, credentials, and availability must be reviewed before enabling ingestion or playback.
