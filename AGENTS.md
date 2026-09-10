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
