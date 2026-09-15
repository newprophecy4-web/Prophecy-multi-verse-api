# A–Z Functional Test Report

**Date:** 2026-09-15  
**Repository:** `moviebox-backend`  
**Scope:** Existing backend only; no rebuild, Prisma, or frontend work.

## Summary

| Metric | Result |
|---|---:|
| Total test areas | 26 |
| Passed | 8 |
| Failed | 0 |
| Blocked | 18 |
| Production Ready | **NO** |

`PASS` means the behavior was executed successfully. `BLOCKED` means the required local infrastructure or implementation surface was unavailable; it is not treated as success.

## Results

| Area | What was tested | Actual result | Status | Fix / limitation | Retest |
|---|---|---|---|---|---|
| A. Environment/startup | Node 22.13.0, pnpm 11.24.0, server startup, shutdown, config, error handler | Server started on port 3000; process was terminated cleanly after smoke test | PASS | None | PASS |
| B. PostgreSQL | Pool, parameterized query, transaction, migrations, constraints, indexes, schema | `pg` layer and SQL migration files exist, but `psql` and Docker are unavailable | BLOCKED | Cannot start/connect to PostgreSQL in this sandbox | Not executable |
| C. Redis | Connection, cache, TTL, invalidation, lock/failure behavior | No `redis-cli` or Docker available; Redis service is not configured in the current process | BLOCKED | Requires Redis runtime | Not executable |
| D. BullMQ/workers | Queue, jobs, retries, backoff, recovery, shutdown | Worker modules are not present as executable runtime components in the current implementation; Redis is also unavailable | BLOCKED | Requires worker implementation and Redis | Not executable |
| E. OpenSearch | Index, mapping, CRUD, search, pagination, reindex | No Docker/OpenSearch executable or service available | BLOCKED | Requires OpenSearch runtime | Not executable |
| F. Provider system | Initialization and health behavior for all 10 configured adapters | `/api/v1/providers` returned all 10 adapters; provider health route returned 200 for Internet Archive; live discovery was not attempted | PASS (configured surface) / BLOCKED (live provider calls) | Adapters intentionally return deterministic empty search results until official API configuration | Configured surface retested |
| G. Discovery pipeline | Provider → raw → normalized data | No executable ingestion/sync pipeline is exposed in the existing implementation | BLOCKED | Requires sync/normalization runtime integration | Not executable |
| H. Canonical identity | Exact/alternate/localized/year/media matching and false matches | Unit matcher executed; exact normalized title/year scoring passed | PASS (implemented unit scope) | Extended provider evidence signals are not wired into an end-to-end pipeline | PASS |
| I. Deduplication | Multiple provider records merge to one title | No executable persistence/merge pipeline | BLOCKED | Requires database-backed sync implementation | Not executable |
| J. Metadata merge | Metadata and provenance merge | Schema supports provenance, but merge service was not executable | BLOCKED | Requires database-backed merge service | Not executable |
| K. Seasons | Provider season reconciliation | `/api/v1/titles/:id/seasons` executed and returned an empty canonical list; no provider reconciliation data exists | BLOCKED | No populated database/sync fixture | Route retested |
| L. Episodes | Episode mappings, mismatch, missing/special handling | Episode route surface executed; no populated episode pipeline | BLOCKED | Requires database/sync fixtures | Route retested |
| M. Media types | TV/movie/OVA/special/ONA/extra collision handling | Core source has movie fixture only; full media-type matrix not executable | BLOCKED | Requires canonical catalog fixtures | Not executable |
| N. Language | Audio/subtitle identity behavior | Schema/ranking primitives exist; no populated releases or search index | BLOCKED | Requires release/source fixtures | Not executable |
| O. Releases | Quality/audio/subtitle/region grouping | No populated release database or route | BLOCKED | Requires release ingestion and PostgreSQL | Not executable |
| P. Playback source | Legal source resolution and current playable URL | Playback route for missing episode returned expected 404; no configured live authorized source is present | BLOCKED | No source fixture or provider URL resolution configured; no fake URL added | Negative path retested |
| Q. Playback priority | Unavailable source fallback and recovery | Source ranking/fallback unit test passed for legal vs unknown source | PASS (unit scope) | Full database/source-health integration blocked | PASS |
| R. Source health | Health score, failures, recovery, expiry | Health endpoint returned 200 for configured adapter; persistent health service unavailable | BLOCKED | Requires worker/provider runtime | Route retested |
| S. Background sync | Fetch → normalize → match → merge → DB → index; idempotency | No executable sync worker/database/index stack | BLOCKED | Requires PostgreSQL, Redis, BullMQ, OpenSearch and sync jobs | Not executable |
| T. Search | Exact/partial search, empty result, API response | `/api/v1/search?q=moon` returned 200 using the safe fixture; no typo/index/cache integration | PASS (API fixture scope) | Full OpenSearch/cache search blocked | PASS |
| U. Cache | Miss/hit/invalidation | No Redis service or cache service route in the current implementation | BLOCKED | Requires Redis cache layer | Not executable |
| V. API | Health, readiness, search, title, seasons, episodes, playback, provider, admin | Live Fastify smoke test executed: health 200, ready 200, search 200, title 200, seasons 200, episodes 200, sources 200, playback missing 404, providers 200, provider detail/health 200, genres/languages/stats 200, admin unauth 401/auth 200 | PASS | None for implemented routes | PASS |
| W. Admin override | Match/merge/split/ignore/audit actions | Only admin sync/reindex routes exist; override actions are not implemented | BLOCKED | Requires implementation beyond current surface | Not executable |
| X. Security | Admin key, validation, safe errors, parameterized SQL audit | Admin unauthenticated request returned 401; parameterized repository exists; no arbitrary URL fetcher found | PASS (executed scope) | Full SSRF/RBAC/rate-limit matrix requires additional tests | PASS |
| Y. Failure/recovery | DB/Redis/OpenSearch/provider/worker failures | Infrastructure unavailable; no full failure harness | BLOCKED | Requires services and worker runtime | Not executable |
| Z. End-to-end flow | Provider → catalog → DB → index → cache → API → playback | Cannot execute without PostgreSQL, Redis, OpenSearch, worker and a configured legal provider source | BLOCKED | Critical external infrastructure and ingestion pipeline unavailable | Not executable |

## Executed validation commands

```text
node --version                       PASS (v22.13.0)
pnpm --version                       PASS (11.24.0)
pnpm run typecheck                   PASS
pnpm run test                        PASS (4 tests)
pnpm run build                       PASS
pnpm run lint                        PASS
pnpm run production-check           PASS
pnpm run db:status                  BLOCKED (PostgreSQL unavailable)
```

The actual Fastify server was started and exercised with `curl`. The server returned the statuses recorded above. Prisma audit also passed: there are no Prisma references outside dependency-lock historical text, and no Prisma package/directory remains in the project.

## Remaining issues

The sandbox has no Docker, PostgreSQL client/server, Redis client/server, or OpenSearch service. The existing implementation also contains only adapter contracts/deterministic empty provider adapters and does not yet expose a complete executable BullMQ sync worker, Redis cache service, OpenSearch index manager, or admin override workflow. These are **BLOCKED or unimplemented**, not production-ready claims.

## Final status

**Production Ready: NO.** Critical A–Z database, cache, queue, search-index, synchronization, and end-to-end playback tests could not be executed successfully in this environment and several are not yet implemented as runtime workflows.
