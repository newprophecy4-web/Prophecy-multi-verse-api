# Production Readiness

## Verified in this environment

- Backend-only repository with no frontend.
- Fastify REST API, versioned responses, validation, rate limiting, CORS, Helmet, request logging, safe errors.
- Ten capability-gated provider adapters and legal-license filtering in source ranking.
- Canonical title model, aliases, seasons, episodes, releases/sources, provenance schema.
- Playback ranking and fallback primitives; OpenSearch/Redis/BullMQ integration points.
- Prisma PostgreSQL schema, Docker Compose services, deterministic unit/integration tests.

## Limitations and required pre-production work

PostgreSQL, Redis, OpenSearch, and Docker availability must be verified in the deployment environment. Provider credentials, official API contracts, ingestion parsers, rate limits, and license evidence must be configured per provider. The default demo catalog is synthetic/public-domain-safe; it is not a movie database.

Checklist: [PASS] source build design; [PASS] core tests; [PASS] API surface; [PASS] security defaults; [WARN] external infrastructure; [WARN] provider API credentials; [WARN] live integration smoke tests.
