# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Two independent sub-projects, each with its own `package.json`:

- **`web/`** — Vue 3 frontend, deployed to GitHub Pages via CI
- **`worker/`** — Cloudflare Worker (TypeScript), deployed with Wrangler

There is no root-level `package.json`. All commands must be run from within `web/` or `worker/`.

## Commands

### Web (from `web/`)
```bash
npm run dev        # Vite dev server
npm run build      # Type-check + build to dist/
npm run test       # Run vitest once
npm run test:watch # Vitest in watch mode
```

### Worker (from `worker/`)
```bash
npm run dev        # wrangler dev (local)
npm run deploy     # wrangler deploy to Cloudflare
npm run test       # Run vitest once
```

## Environment Variables

`web/` requires `VITE_WORKER_URL` (the Cloudflare Worker URL) set in a `.env` file locally or as a GitHub secret in CI. The worker exposes `/groups` and `/knockout` endpoints.

## Architecture

### Data Flow

1. **Cloudflare Worker** (`worker/src/index.ts`) runs on a 30-minute cron. It fetches from `football-data.org` (`/v4/competitions/WC/matches` and `/standings`), transforms the data via `transform.ts`, and stores two blobs in KV: `wc2026:groups` and `wc2026:knockout`.
2. **Frontend** (`web/src/composables/useWC2026.ts`) fetches both blobs on mount. The worker serves them with 30-min Cache-Control headers and also puts them in the Cloudflare Cache API.

### Simulation State

`web/src/composables/useSimulation.ts` holds a module-level reactive singleton:
- `groupScores`: `Record<fixtureId, {home, away}>` — user-entered scores for scheduled fixtures
- `knockoutWinners`: `Record<matchId, teamId>` — user-selected knockout winners
- `tcsScores`: `Record<teamId, score>` — manual TCS (team conduct score) for tiebreaks

All simulation state is ephemeral (no persistence). The reset button clears all three.

### Standings Computation

`web/src/composables/useStandings.ts` — pure functions that compute standings from scratch on every render using fixture results + simulated scores. Tiebreak order follows FIFA rules: points → H2H points → H2H GD → H2H GF → overall GD → overall GF → fair play → TCS → FIFA ranking. The `findGroupTiedIds` / `findThirdPlaceTiedIds` functions detect when TCS becomes the deciding factor (used to show the TiebreakDialog).

### Knockout Bracket

`web/src/composables/useKnockoutQualification.ts` — builds all knockout rounds from group standings + `knockoutWinners`. The `BRACKET_PROGRESSION` map defines which match feeds into which next match. `ANNEX_C` data determines which 3rd-place slots face which group winners in the Round of 32 (depends on the combination of qualifying groups).

### Key Types

All shared types are in `web/src/types.ts`. The worker has its own `worker/src/types.ts` for football-data.org API shapes (`FDMatch`, `FDStandingGroup`, `Env`).

## Deployment

- **Frontend**: CI (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on pushes to `main` that touch `web/**`.
- **Worker**: Manual deploy via `npm run deploy` from `worker/`.
- Commits are allowed when explicitly requested by the user. Do not add `Co-Authored-By` lines to commit messages.
