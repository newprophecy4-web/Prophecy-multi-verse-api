# Moviebox Backend

Backend-only local-first catalog and legal playback-source service. Storage is selected explicitly: `STORAGE_MODE=local` for development or `STORAGE_MODE=firestore` for production Firebase Firestore.

## Firebase project and secure server authentication

The public Firebase Web configuration identifies project `kanri-bu` and is not a privileged server credential. Production Firestore and Firebase ID-token verification use the official `firebase-admin` SDK with a runtime-only `FIREBASE_SERVICE_ACCOUNT_JSON` secret supplied by Render or another secret manager. The service-account JSON, private key, and credential value are never committed to GitHub. If Firestore mode is selected without this runtime secret, requests fail clearly with HTTP 503 and never silently fall back to local JSON.

## Start

```bash
cp .env.example .env
pnpm install
pnpm run typecheck
pnpm run build
pnpm run dev
```

Local mode uses `./data/catalog.json`. Sync legal Internet Archive metadata with:

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
- `GET /api/episodes/:episodeId`
- `GET /api/episodes/:episodeId/playback`
- `GET /api/titles/:titleId/sources`
- `GET /api/titles/:titleId/playback`
- `GET /api/providers`
- `GET /api/providers/:id/health`

Public catalog and playback routes require no login.

## Protected user API

- `GET /api/user/profile`
- `GET /api/user/favorites`
- `GET /api/user/history`
- `GET /api/user/settings`

Send `Authorization: Bearer <Firebase ID token>`. The backend verifies the token with Firebase Admin and uses only the verified UID for `/users/{uid}` access. Missing, invalid, or expired tokens return HTTP 401.

## Firestore collections

The Firestore repository uses `/titles/{titleId}` for catalog records and `/users/{uid}` for user-specific data. Catalog writes remain backend-controlled; public catalog routes are read-only.

## Render configuration

Use the existing Node build and start commands:

```text
Build: pnpm install --frozen-lockfile && pnpm run build
Start: pnpm run start
```

Set `PORT` from Render, `STORAGE_MODE=firestore`, all public `FIREBASE_*` project variables, and the secret `FIREBASE_SERVICE_ACCOUNT_JSON` in Render Environment Variables. Never paste the service-account value into source control or chat.

## Legal playback

The Internet Archive adapter uses the official public metadata API and only accepts legal public-domain/open-license media. The known regression item is `gov.archives.arc.49737` with the official MP4 source `gov.archives.arc.49737_512kb.mp4`. Naruto metadata may be catalog-tested, but no unauthorized Naruto playback URL is ever returned.

## Tests

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm run test
pnpm run lint
pnpm run production-check
```

No PostgreSQL, Redis, OpenSearch, BullMQ, Docker, Prisma, or manually supplied `FIRESTORE_ACCESS_TOKEN` is used.
