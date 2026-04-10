# Predict WorkNet — Frontend Dashboard

## Overview

pnpm workspace monorepo for the Predict WorkNet prediction market frontend. The backend API is built separately by another team in Rust/axum. This project focuses on the frontend dashboard with generated API hooks matching the real API contract.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **API framework**: Express 5 (minimal health-check dev server)
- **Database**: PostgreSQL + Drizzle ORM (available but not primary focus)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Architecture

### API Contract

- Base URL: `/api/v1`
- All responses wrapped in `{ "success": true, "data": ... }` envelope
- Market IDs are strings (e.g., `"btc-15m-20260410-1200"`)
- Accuracy values are 0-1 floats (e.g., `0.642`, not `64.2`)
- OpenAPI spec: `lib/api-spec/openapi.yaml`

### Generated Packages

- **`@workspace/api-client-react`** — React Query hooks for all endpoints (16 hooks)
  - `useGetFeedStats`, `useGetFeedLive`
  - `useGetActiveMarkets`, `useGetResolvedMarkets`, `useGetMarketById`, `useGetMarketAmmHistory`, `useGetMarketPredictions`
  - `useGetLeaderboard`, `useGetLeaderboardPersonas`
  - `useGetAgentByAddress`, `useGetAgentPredictions`
  - `useGetEpochs`, `useGetEpochById`, `useGetCurrentEpoch`
  - `useGetHighlights`
  - `useHealthCheck`
- **`@workspace/api-zod`** — Zod validation schemas for all API types

### Custom Fetch

`lib/api-client-react/src/custom-fetch.ts` handles:
- Base URL prepending for remote API targets
- Bearer token injection via `setAuthTokenGetter()`
- Auto-unwrapping `{ success, data }` response envelope

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API dev server

## Frontend (`artifacts/predict-worknet`)

Light-themed scientific data dashboard SPA using React+Vite, wouter routing, TanStack Query, Recharts.

### Pages
- `/` — Dashboard: large bold "Prediction Markets." hero, 8 stat boxes with big blue numbers, current epoch progress bar, live prediction feed (5s poll)
- `/markets` — Active markets with countdown timers (15s poll), resolved markets with asset/window filters + Load More
- `/markets/:id` — Market detail with AMM price history line chart (Recharts), prediction list with collapsible reasoning
- `/leaderboard` — Agent ranking table with period/sort/persona filters, persona comparison cards (60s poll)
- `/epochs` — Epoch list with expandable detail panels (top earners, persona breakdown)
- `/highlights` — Highlight cards filtered by type (60s poll)
- `/agents/:address` — Agent profile with lifetime stats, streaks, recent performance, prediction history with filters

### Theme
- Light mode, white/off-white background
- Font: Space Grotesk (bold display), Space Mono (data/labels)
- Colors: electric blue primary (hsl 237 100% 50%), red destructive, on white background
- Sharp zero-radius edges (no rounded corners)
- Top horizontal nav bar with PWN_SYS logo, live data indicator, navigation links
- Large bold metrics with uppercase tracking-widest labels
- Pulsing green dot for live API status indicator

### Key Patterns
- All 16 generated hooks used with proper queryKey helpers
- Polling intervals: 5s (feed), 15s (markets), 30s (stats/epoch), 60s (leaderboard/highlights)
- Number formatting: comma separators, percentages from 0-1, multipliers with x suffix, $PRED currency
- Address truncation (0xab...12), relative timestamps
- Load More pagination (offset-based) on all list views
- useHealthCheck drives the header LIVE/OFFLINE indicator

## Important Notes

- The real backend is Rust/axum, built separately. This project only contains the frontend and API contract layer.
- The `custom-fetch` automatically unwraps the `{ success: true, data: ... }` envelope, so hooks return the inner data directly.
- When the real API is deployed, set the base URL via `setBaseUrl("https://api.example.com")` in the frontend entry point.
