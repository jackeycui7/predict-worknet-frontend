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

## Important Notes

- The real backend is Rust/axum, built separately. This project only contains the frontend and API contract layer.
- The `custom-fetch` automatically unwraps the `{ success: true, data: ... }` envelope, so hooks return the inner data directly.
- When the real API is deployed, set the base URL via `setBaseUrl("https://api.example.com")` in the frontend entry point.
