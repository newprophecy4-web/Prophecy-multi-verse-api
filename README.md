# Moviebox Backend

Backend-only, independently written content catalog and legal playback-source service. It does not scrape protected endpoints, bypass DRM/authentication/paywalls, or seed unauthorized streams. PostgreSQL uses `pg` and versioned SQL migrations; Redis, BullMQ, and OpenSearch runtime modules are included. Provider adapters are capability-gated and use official/public interfaces only.

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

Docker: `docker compose up --build`. API is under `/api/v1`; `/health` is process health and `/ready` is dependency readiness. Admin routes require `x-admin-api-key`.

The repository includes Fastify, PostgreSQL SQL migrations/schema, parameterized repositories and transactions, provider normalization/idempotent sync, Redis cache/locks, BullMQ queues/workers, OpenSearch indexing/search, source ranking/fallback rules, SSRF-safe policy boundary (no arbitrary URL fetcher), structured logging, rate limiting, security headers, provider capability contracts, tests, Docker, and production checks. External provider terms, licenses, API quotas, credentials, and availability must be reviewed before enabling ingestion or playback.
