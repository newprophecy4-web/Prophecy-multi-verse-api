# Moviebox Backend

Backend-only, independently written content catalog and legal playback-source service. It does not scrape protected endpoints, bypass DRM/authentication/paywalls, or seed unauthorized streams. Provider adapters are capability-gated and default to deterministic empty search results until official API credentials/configuration are supplied.

## Run

```bash
cp .env.example .env
npm install
npm run db:generate
npm run build
npm run test
npm run dev
```

Docker: `docker compose up --build`. API is under `/api/v1`; `/health` is process health and `/ready` is dependency readiness. Admin routes require `x-admin-api-key`.

The repository includes Fastify, Prisma/PostgreSQL schema, Redis/BullMQ/OpenSearch configuration points, source ranking/fallback rules, SSRF-safe policy boundary (no arbitrary URL fetcher), structured logging, rate limiting, security headers, provider capability contracts, tests, Docker, and production checks. External provider terms, licenses, API quotas, credentials, and availability must be reviewed before enabling ingestion or playback.
