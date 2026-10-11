# KinoDerRN

A pixel-art browser arcade game, in French: pick a starter tweet (sets the difficulty), then survive waves of caricatural right-wing troll bots replying to it, picking a comeback before the timer runs out. Inspired by the "zombie wave" feel of Call of Duty — the name riffs on "Kino der Toten" (CoD Zombies) crossed with RN (Rassemblement National).

**Live:** [kinoderrn.odtriki.com](https://kinoderrn.odtriki.com) — also linked from [odtriki.com](https://odtriki.com).

## How it works

- Pick one of four starter tweets on the menu screen — mundane to mildly provocative — which sets the pace (bots per wave). Every reply has a flat 30-second timer.
- Tower-defense framing: up to 4 accounts approach your pinned tweet (the tower) at once, from random directions, growing in size as they close in. Click one to open its reply panel below.
- Every card is a guess: 🔴 **C'est un bot** or 🟢 **C'est une vraie personne**. Message tone is a hint, not a guarantee — most hostile-sounding accounts really are bots and most supportive ones really are human, but occasionally it's a genuinely dumb real person being hostile, or a bot astroturfing support. Guess right and you score points and money; guess wrong and it counts as a touch. There's also a 😈 **Insulte-le** button, always available — insulting an actual troll is the biggest payoff in the game, insulting a genuine supporter isn't. Correctly calling out a real bot plays a small "shutting down" animation — the whole point, after all.
- **3 lives.** A life is lost after 2 touches in a row (not answering at all, or guessing wrong, both count) — but any successful engagement resets that streak, and one pending touch quietly forgives itself every 10 seconds.
- 🏪 **Perk shop** (side panel, Black Ops Zombies–style): spend money on persistent perks — 🦣 **Mastodonte** (5 touches before losing a life instead of 2 — literally Jugger-Nog), ❤️ **Réanimation Rapide** (+1 life instantly), ⚡ **Cola Énergisant** (touches forgive themselves twice as fast), 💪 **PHD Flopper** (insulting anyone pays out, even a supporter). Like the real Zombies perks, losing a life clears every persistent one — you have to rebuy.
- If a card reaches your tweet untouched, a troll getting through still costs you (a touch); a genuine supporter reaching you unanswered counts as a win regardless.
- Accounts sometimes come back to answer what you just said — that lands as an urgent 🔔 notification. Answer it in time like any other card; let its timer run out and the run ends immediately (independent of lives).
- Waves escalate indefinitely: more bots, occasional "super troll" bots worth more points.
- Game over: enter 3 initials via a classic arcade letter-wheel, see where you land on the **online high-score board** (top 100 scores, shared across everyone who plays).

## Stack

**Frontend:** Vue 3 (Composition API) + Vite, no CSS framework. Pixel-art props (desk/lamp/stamp/etc.) are drawn procedurally on `<canvas>`; bot/player avatars are illustrated portraits via DiceBear (`@dicebear/collection`, `avataaars` style), seeded by account name so the same account always has the same face — nobody real depicted either way. Game state lives in a single reactive composable (`src/gameStore.js`); all copy/content lives in `src/content.js`. Font: Google Fonts "Press Start 2P" (CDN).

**Backend:** a small Express server (`server.cjs`) serves the built frontend and a `/api/scores` endpoint backed by `better-sqlite3`. The high-score table is capped at the top 100 rows — every submission prunes anything beyond that, so the local SQLite file stays small on purpose.

Previously a single-file vanilla HTML/CSS/JS build (no backend, no build step) — kept at [`_legacy-vanilla/`](_legacy-vanilla) for reference, not deployed.

## Deploy

Self-hosted via Docker: a multi-stage build (`node:20-alpine` runs `npm install && npm run build` for the frontend, then `node:20-bookworm-slim` — needed for `better-sqlite3`'s native compile — installs production deps and runs `server.cjs`, serving both the static `dist/` and the API on port 3000). Wired into `../homeserver/docker-compose.yml` as the `kinoderrn` service, with a `kinoderrn_db` volume at `/app/data` persisting the SQLite file across redeploys, same pattern as `beers`.

Runs behind the `odtriki` Cloudflare Tunnel; `kinoderrn.odtriki.com` → `http://kinoderrn:3000`, managed via the Cloudflare API (tunnel ingress config + DNS CNAME) rather than the dashboard — see `homeserver/.env` for the scoped `CF_API_TOKEN` (Tunnel:Edit + DNS:Edit on the `odtriki.com` zone only).
