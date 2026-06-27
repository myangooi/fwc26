# FWC26 Simulator

A live FIFA World Cup 2026 simulator. Track real results as the tournament progresses, simulate upcoming matches, rewind to any past date, and see how the bracket plays out — all updated in real time.

**Live site:** https://myangooi.github.io/fwc26/

---

## Table of Contents

- [Features](#features)
  - [Live group stage standings](#live-group-stage-standings)
  - [Simulate upcoming fixtures](#simulate-upcoming-fixtures)
  - [Rewind to any date](#rewind-to-any-date)
  - [Knockout bracket](#knockout-bracket)
  - [Best third-place qualification](#best-third-place-qualification)
  - [Tiebreakers](#tiebreakers)
  - [Reset](#reset)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
  - [Frontend](#frontend)
  - [Worker](#worker)
- [Deployment](#deployment)

---

## Features

### Live group stage standings

Standings are computed from official match results fetched from the football-data.org API, updated every 30 minutes. All 12 groups are displayed with goals scored, goal difference, and points.

### Simulate upcoming fixtures

Open the **Simulate** sidebar and enter scores for any scheduled match. Standings, group qualifiers, and the knockout bracket all update live as you type. Simulated scores are independent per side — entering a home score doesn't overwrite the away score and vice versa.

### Rewind to any date

Use the **Rewind to** date picker in the Simulate sidebar to travel back in time. Results after the selected date are treated as unplayed — they move to the Fixtures tab so you can simulate them. Selecting the day before the first fixture lets you simulate the entire tournament from scratch.

### Knockout bracket

The full bracket from Round of 32 through to the Final and Third-Place match is built automatically from group stage results. Simulated scores flow through seamlessly. In knockout matches, click a team to manually select the winner.

### Best third-place qualification

The 8 best third-place finishers across all 12 groups qualify for the Round of 32. Their placement in the bracket follows the official FIFA Annex C rules, which depend on the combination of groups they came from.

### Tiebreakers

FIFA tiebreaker rules are applied in full order: points → head-to-head points → head-to-head goal difference → head-to-head goals scored → overall goal difference → overall goals scored → fair play points → FIFA ranking. When teams remain tied after fair play (i.e. Team Conduct Score becomes the deciding factor), a **Tie** badge appears next to the affected teams. Click it to open the TCS dialog and assign a score manually.

### Reset

The **Reset** link in the Simulate sidebar clears all simulated scores and TCS values. The rewind date is independent and is not affected by Reset.

---

## Tech Stack

| Layer       | Technology                                                                  |
| ----------- | --------------------------------------------------------------------------- |
| Frontend    | Vue 3 (Composition API), TypeScript, Vite                                   |
| Styling     | Tailwind CSS                                                                |
| Backend     | Cloudflare Workers (TypeScript)                                             |
| Storage     | Cloudflare KV                                                               |
| Data source | [football-data.org](https://www.football-data.org/) API (competition: `WC`) |
| Hosting     | GitHub Pages (frontend), Cloudflare (worker)                                |
| CI/CD       | GitHub Actions                                                              |

---

## Architecture

```
football-data.org API
        │  (every 30 min via Cloudflare cron)
        ▼
Cloudflare Worker  ──► Cloudflare KV (wc2026:groups, wc2026:knockout)
        │  (serves with 30-min Cache-Control + Cache API)
        ▼
Vue 3 Frontend  ──► GitHub Pages
```

**Worker** (`worker/`) runs on a 30-minute cron trigger. It fetches match and standings data from football-data.org, transforms it into two compact blobs, and writes them to KV. It also serves the blobs via HTTP with cache headers.

**Frontend** (`web/`) fetches both blobs on mount. All standings computation happens client-side from raw fixture data — no server-side calculation. Simulation state is held in a module-level reactive singleton (`useSimulation`) and is ephemeral (cleared on page reload).

---

## Project Structure

```
fwc26/
├── web/                        # Vue 3 frontend
│   └── src/
│       ├── composables/
│       │   ├── useWC2026.ts         # fetches group + knockout blobs
│       │   ├── useSimulation.ts     # simulation state + applyDateCutoff
│       │   ├── useStandings.ts      # pure standings computation (FIFA rules)
│       │   └── useKnockoutQualification.ts  # bracket builder + Annex C logic
│       ├── components/
│       │   ├── group/               # GroupCard, GroupStanding, TiebreakDialog, …
│       │   ├── knockout/            # BracketMatch, BracketRound, KnockoutStage
│       │   └── simulate/            # SimulateDialog (fixtures, results, datepicker)
│       └── data/
│           ├── annexC.ts            # FIFA Annex C third-place slot mapping
│           └── fifaRankings.ts      # FIFA rankings for final tiebreak
└── worker/                     # Cloudflare Worker
    └── src/
        ├── index.ts                 # cron handler + HTTP server
        └── transform.ts             # football-data.org → internal types
```

---

## Local Development

**Prerequisites:** Node.js 18+, a [football-data.org](https://www.football-data.org/) API key, a Cloudflare account with Workers and KV.

### Run both together (recommended)

Install root deps once, then start web and worker in a single terminal with colour-coded output:

```bash
npm install           # installs concurrently at repo root
npm run dev           # starts web (port 5173) and worker (port 8787) together
```

### Frontend only

```bash
cd web
cp .env.example .env          # set VITE_WORKER_URL to your worker's URL
npm install
npm run dev                   # Vite dev server at http://localhost:5173/fwc26/
npm run build                 # type-check + production build
npm test                      # run Vitest
```

### Worker only

```bash
cd worker
npm install
npm run dev                   # wrangler dev (local)
npm run deploy                # deploy to Cloudflare
```

---

## Deployment

- **Frontend:** pushing to `main` triggers GitHub Actions (`.github/workflows/deploy.yml`), which builds and deploys to GitHub Pages automatically when files under `web/` change.
- **Worker:** pushing to `main` triggers GitHub Actions (`.github/workflows/deploy-worker.yml`), which deploys to Cloudflare automatically when files under `worker/` change. Requires a `CLOUDFLARE_API_TOKEN` secret set in the repository's GitHub Actions settings.
