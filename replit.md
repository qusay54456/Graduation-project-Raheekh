# Workspace

## Overview

pnpm workspace monorepo using TypeScript. ParkNow — a parking reservation system for Palestinian cities.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: SQLite (better-sqlite3) + Drizzle ORM — local file at `data/parknow.db`, no external DB needed
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (artifact: `parknow`)
- **Auth**: bcrypt + express-session (SESSION_SECRET env var)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to SQLite
- `pnpm --filter @workspace/db run seed` — reseed test data (users + lots + spots)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

Override DB location with `DATABASE_PATH` env var (default: `./data/parknow.db` relative to project root).

## Artifacts

- **parknow** — React+Vite frontend at `/`
- **api-server** — Express API server at `/api`

## ParkNow Features

- Arabic/English bilingual RTL interface
- Home page with parking lot list + OpenStreetMap map
- User registration/login with session cookies
- Spot booking grid (green=available, red=reserved/occupied)
- My bookings with cancel + Google Maps navigation
- Supervisor dashboard with stats, spot grid management, reservations table
- Role-based access (user / supervisor)

## Database Schema

- `users` — id, name, email, password_hash, role (user/supervisor), created_at
- `parking_lots` — id, owner_id, name, location, total_spots, lat, lng, created_at
- `spots` — id, lot_id, spot_number, status (available/reserved/occupied)
- `reservations` — id, user_id, spot_id, start_time, end_time, status, created_at

## Seed Data

- Supervisor: `supervisor@parknow.ps` / `supervisor123`
- User: `user@parknow.ps` / `user123`
- 3 parking lots in Ramallah (5 spots each)

## Codegen Notes

After `orval --config ./orval.config.ts`, the `lib/api-zod/src/index.ts` must only export from `./generated/api` (the codegen script handles this).
