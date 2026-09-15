# Moviebox Backend

Backend-only REST API for a legal catalog and public-domain playback. The business layer remains provider-based and canonical-ID driven. Catalog storage can now be selected explicitly with `STORAGE_MODE=local` for local development or `STORAGE_MODE=firestore` for the Firebase project `kanri-bu`.

## Firebase architecture

The application uses the supplied Firebase Web configuration only as public project identity/configuration. It does not use Firebase Admin SDK, service-account JSON, private keys, or Firebase Storage. Secure server-side Firestore REST access requires a short-lived OAuth access token supplied at runtime as `FIRESTORE_ACCESS_TOKEN`; that token is never committed. If `STORAGE_MODE=firestore` is selected without that token, requests fail clearly with HTTP 503 rather than silently using local data.

Firebase ID tokens are verified against Google's published secure-token signing keys using the `kanri-bu` project issuer and audience. Public catalog routes require no login. User routes require a verified Bearer token and use the UID from the verified token, never a client-supplied UID.

## Local development

```bash
cp .env.example .env
pnpm install
pnpm run typecheck
pnpm run build
pnpm run dev
```

Default local mode uses `./data/catalog.json`. Sync real public-domain Internet Archive metadata with:

```bash
pnpm run sync:provider -- --item gov.archives.arc.49737
```

## Public API

- `GET /health`
- `GET /ready`
- `GET /api/search?q=...`
- `GET /api/titles/:titleId`
- `GET /api/titles/:titleId/seasons`
- `GET /api/titles/:titleId/episodes`
- `GET /api/titles/:titleId/sources`
- `GET /api/titles/:titleId/playback`
- `GET /api/episodes/:episodeId`
- `GET /api/episodes/:episodeId/playback`
- `GET /api/providers`
- `GET /api/providers/:id/health`

Equivalent `/api/v1` catalog routes remain available.

## Protected user API

- `GET /api/user/profile`
- `GET /api/user/favorites`
- `GET /api/user/history`
- `GET /api/user/settings`

Send `Authorization: Bearer <Firebase ID token>`. Missing, invalid, expired, or unverifiable tokens return HTTP 401. Firestore user reads/writes return HTTP 503 until a secure runtime access token is configured.

## Configuration

Required local variables are `NODE_ENV`, `PORT`, `LOCAL_STORE_FILE`, `STORAGE_MODE`, `ADMIN_API_KEY`, `JWT_SECRET`, and `CORS_ORIGIN`. The `FIREBASE_*` values identify project `kanri-bu`; the Web API key is not treated as a privileged server credential. `FIRESTORE_ACCESS_TOKEN` must remain empty in the repository and may be supplied only through a secure deployment secret.

No PostgreSQL, Redis, OpenSearch, BullMQ, Docker, Prisma, Firebase Admin SDK, service-account credential, or private key is used.

## Verification status

Local JSON catalog, official Internet Archive sync, canonical ID consistency, legal MP4 playback, public no-login routes, and protected missing/invalid-token rejection are testable locally. Real Firestore read/write and a valid Firebase-user request remain **BLOCKED** until a supported runtime OAuth access token and a real Firebase ID token are available. Firebase connectivity is not claimed merely because configuration fields exist.
