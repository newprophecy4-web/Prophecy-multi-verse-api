# Moviebox Backend

Backend-only local-first catalog and legal playback-source service. It uses a JSON file repository so it starts with only Node.js and no external infrastructure. Firebase is intentionally not implemented in this phase.

## Start

```bash
cp .env.example .env
pnpm install
pnpm run typecheck
pnpm run build
pnpm run dev
```

The default data file is `./data/catalog.json`; it is created when a sync writes records. Do not commit the data directory if it contains local user data.

## Real legal provider sync

The Internet Archive adapter uses its official public metadata API and only accepts public-domain records. Run:

```bash
pnpm run sync:provider -- "public domain"
```

The command normalizes records, deduplicates by canonical title signals, stores provider provenance, and persists the result to the local JSON repository. It does not invent media URLs. Playback URLs are resolved from an Internet Archive identifier/source through the official public download endpoint only when a legal MP4/WebM file exists.

## API

- `GET /health`
- `GET /ready`
- `GET /api/search?q=...`
- `GET /api/titles/:titleId`
- `GET /api/titles/:titleId/seasons`
- `GET /api/titles/:titleId/episodes`
- `GET /api/episodes/:episodeId`
- `GET /api/episodes/:episodeId/playback`
- `GET /api/titles/:titleId/sources`
- `GET /api/providers`
- `GET /api/providers/:id/health`

Equivalent `/api/v1` routes remain available for the existing conventions.

## Tests

```bash
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run lint
pnpm run production-check
```

The backend returns `NO_LEGAL_PLAYBACK_SOURCE` when no valid public/legal source exists. It never returns fake or unauthorized streaming URLs. Firebase, Render deployment, and any hosted datastore are future phases and are not claimed as connected here.
