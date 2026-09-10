# AGENTS.md — playlister  (public repo)

Scrapes upcoming shows at chosen Chicago venues and auto-builds/updates Spotify
playlists from the lineups. Weekly `node-cron` run inside the container.

- **Runs on** `assistant:~/deployments/playlister`, port **8888 (127.0.0.1 only)**, `GET /health`. Docker; base image `mcr.microsoft.com/playwright` (Playwright scraping).
- Node/Express, ESM.

## Layout — `src/`
- `index.js` — Express entry
- `auth/spotify.js` — OAuth (redirect `localhost:{PORT}/callback`)
- `scrapers/{base,llm-parser}.js`
- `services/cache.js`, `config/`

## Run / deploy
```
npm ci && npm start   # nodemon src/index.js
```
`.env` (Spotify client id/secret, redirect URI, user id) — **no `.env.example`
in the repo**, it's on the box. Runtime `data/` cache is gitignored.
Deploy: `hl deploy playlister`.

## Keeping this file current

This file is the context the next agent (or you, later) loads first. When a
change you make leaves something here wrong, fix it **in the same commit**:

- route / env var / service / entry point / port added, removed, or renamed → update the matching section
- **discovered a gotcha while debugging → add it under Gotchas** (this is the highest-value update)
- changed how it runs, builds, or deploys → update Run / Deploy
- new top-level dir or a real restructure → update the layout section

Keep edits terse — a line, not a paragraph. If nothing here is now wrong, no
edit is needed. The consolidated `docs/apps.md` in the homelab repo is
generated from this file; don't edit it by hand.
