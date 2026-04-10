# Predict WorkNet — Frontend Dashboard

## Overview

pnpm workspace monorepo for the Predict WorkNet prediction market frontend. The backend API is built separately by another team in Rust/axum. This project focuses on the frontend dashboard with generated API hooks matching the real CLOB-based API contract.

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

### API Contract (CLOB v0.2.0)

- Base URL: `/api/v1`
- All responses wrapped in `{ "success": true, "data": ... }` envelope
- Market IDs are strings (e.g., `"btc-15m-20260410-1200"`)
- Accuracy values are 0-1 floats (e.g., `0.642`, not `64.2`)
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- **CLOB model**: OrderbookState (best_up_price, best_down_price, spread, depth), tickets, chips_spent/payout_chips, excess scoring

### Generated Packages

- **`@workspace/api-client-react`** — React Query hooks for all endpoints (20+ hooks)
  - `useGetFeedStats`, `useGetFeedLive`
  - `useGetActiveMarkets`, `useGetResolvedMarkets`, `useGetMarketById`
  - `useGetMarketOrderbook`, `useGetMarketPriceHistory`, `useGetMarketKlines`
  - `useGetMarketPredictions`
  - `useGetLeaderboard`, `useGetLeaderboardLive`, `useGetLeaderboardPersonas`, `useGetLeaderboardEquityCurves`
  - `useGetAgentByAddress`, `useGetAgentPredictions`, `useGetAgentEquityCurve`
  - `useGetEpochs`, `useGetEpochById`, `useGetCurrentEpoch`
  - `useGetHighlights`
  - `useHealthCheck`
- **`@workspace/api-zod`** — Zod validation schemas for all API types

### Custom Fetch

`lib/api-client-react/src/custom-fetch.ts` handles:
- Base URL prepending for remote API targets
- Bearer token injection via `setAuthTokenGetter()`
- Auto-unwrapping `{ success, data }` response envelope

### Mock Data Layer

`artifacts/predict-worknet/src/lib/api.ts` wraps all generated hooks with a `USE_MOCK` flag (currently `true`).
When `USE_MOCK=true`, hooks return realistic mock data from `src/lib/mock-data.ts` via TanStack Query.
When `USE_MOCK=false`, hooks delegate to the real generated API hooks.
This allows full UI development without a running backend.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- After codegen: `cd lib/api-client-react && npx tsc -p tsconfig.json` — rebuild declaration files
- `pnpm --filter @workspace/api-server run dev` — run API dev server

## Frontend (`artifacts/predict-worknet`)

Light-themed scientific data dashboard SPA using React+Vite, wouter routing, TanStack Query, Recharts.

### Pages
- `/` — Dashboard: epoch progress bar, "Predict WorkNet." gradient hero, 4 key metrics (Active 24h, Registered, Open Markets, Predictions 24h), live feed center with epoch leaders + hot markets side panels
- `/markets` — Active markets in 2-col bento grid with countdown timers + probability bars, resolved tab with 7-day date selector (inline day buttons) + asset/window dropdowns + client-side date filtering
- `/markets/:id` — Market detail with orderbook panel (best prices, spread, depth), CLOB summary (tickets filled, chips settled), price history chart (CLOB fills), prediction list with expandable reasoning
- `/leaderboard` — Agent ranking table with period/sort/persona filters, excess/rank_change_1h columns, persona comparison cards (60s poll)
- `/epochs` — Epoch list with expandable detail panels (top earners with excess_score/alpha/participation rewards, persona breakdown)
- `/highlights` — Highlight cards filtered by type including all_in_win, contrarian, streak, top_earner, persona_flip, milestone (60s poll)
- `/rewards` — Agent address lookup + recent epochs table + "How Rewards Work" explainer grid (Participation Pool, Alpha Pool, Excess Scoring, Settlement)
- `/join` — 4-step guide (Install AWP, Install Skill, Configure Persona, Start Predicting) + requirements section
- `/agents/:address` — Agent profile with lifetime stats (all_time_excess, contrarian_rate, chips_spent/won), today panel (balance, excess, estimated_reward), prediction history with outcome/asset filters

### Theme
- Editorial/magazine bento-grid style inspired by KERNEL_PANIC reference
- Pure white background, dark cards (bento-card-dark), blue accent cards (bento-card-primary)
- Font: Inter (headings/body), JetBrains Mono (data/code) — loaded via Google Fonts
- Brand: "PREDICT WORKNET" with "BUILT ON AWP" subtitle (all uppercase)
- Colors: blue primary (hsl 230 80% 56%), warm dark (hsl 220 20% 8%), red destructive
- Sharp zero-radius edges, bento-card borders, 1px gap grids
- CSS classes: bento-card, bento-card-dark, bento-card-primary, section-label, epoch-progress-track
- Animations: animate-fade-up, animate-feed-slide, animate-pulse-live
- Nav: uppercase button-style tabs with filled active state, LIVE indicator with separator

### Key Patterns
- All pages import from `@/lib/api` (mock wrapper) not directly from `@workspace/api-client-react`
- Types are imported from `@workspace/api-client-react` for type annotations
- Polling intervals: 5s (feed), 10-15s (markets/orderbook), 30s (stats/epoch), 60s (leaderboard/highlights)
- Number formatting: comma separators, percentages from 0-1, chips with k suffix, $PRED currency
- Address truncation (0xab...12), relative timestamps
- Load More pagination (offset-based) on all list views with accumulated state
- useHealthCheck drives the header LIVE/OFFLINE indicator
- AgentLink/MarketLink components for clickable navigation

## Important Notes

- The real backend is Rust/axum, built separately. This project only contains the frontend and API contract layer.
- The `custom-fetch` automatically unwraps the `{ success: true, data: ... }` envelope, so hooks return the inner data directly.
- When the real API is deployed, set `USE_MOCK = false` in `src/lib/api.ts` and set the base URL via `setBaseUrl("https://api.example.com")` in the frontend entry point.
- After any OpenAPI spec change: run codegen, then rebuild api-client-react declarations (`npx tsc -p tsconfig.json`), then restart Vite dev server.
