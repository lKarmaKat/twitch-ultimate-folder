# Usage statistics

Anonymous weekly snapshots sent by the Chrome build of the extension (`src/service_worker/telemetry.ts`). The Firefox build does not contain that code.

- `worker/` — Cloudflare Worker + D1 that receives the snapshots at `POST /v1/snapshot`.
- `dashboard/` — Observable Framework dashboard that reads them.

## Worker

```bash
cd stats/worker
npm install
npx wrangler login
npx wrangler d1 create ut-folders-stats   # copy the database_id into wrangler.toml
npm run db:init
npm run deploy                            # copy the workers.dev URL into src/service_worker/telemetry.ts
```

`npm run dev` serves it locally on http://localhost:8787 (run `npm run db:init:local` once first).

## Dashboard

```bash
cd stats/worker && npm install
cd ../dashboard && npm install
npm run dev          # remote D1
npm run dev:local    # local D1 filled by `wrangler dev`
```

From the repository root: `npm run stats` / `npm run stats:local`.

Exported data lands in `dashboard/src/.observablehq/cache/`, which is ignored by git. Never publish a build of the dashboard: it embeds the data.
