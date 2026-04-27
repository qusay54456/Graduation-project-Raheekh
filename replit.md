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
- **Sessions**: `better-sqlite3-session-store` at `data/sessions.db` — survives server restarts (30-day cookie). `trust proxy = 1`.
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (artifact: `parknow`)
- **Auth**: bcrypt + express-session (SESSION_SECRET env var) + rate-limit on login (5 / 15 min)
- **Email**: Nodemailer — falls back to console-logging dev codes if SMTP not configured. Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- **Charts**: recharts
- **QR codes**: qrcode (data-URL based)
- **Real-time**: Server-Sent Events (`/api/notifications/stream`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to SQLite
- `pnpm --filter @workspace/db run push-force` — force push (use when destructive)
- `pnpm --filter @workspace/db run seed` — reseed test data (users + lots + spots)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

Override DB location with `DATABASE_PATH` env var (default: `./data/parknow.db` relative to project root).

## Artifacts

- **parknow** — React+Vite frontend at `/`
- **api-server** — Express API server at `/api`

## ParkNow Features

- Arabic/English bilingual RTL interface, mobile-responsive
- Home page with parking lot list + OpenStreetMap-styled map, **search + price/availability filters + ratings display**
- User registration/login with **persistent SQLite-backed sessions**
- **Forgot password** flow (3 steps: email → 6-digit code → new password) with dev-mode banner
- **Profile page** (name/phone/photo via base64 data-URL)
- Spot booking grid with **price-per-hour display + total calculation**
- My bookings with cancel + Google Maps navigation + **QR code dialog + rating dialog**
- **Supervisor dashboard** with tabs:
  - Overview stats (6 cards including revenue + users)
  - Bookings (filter by status/lot/date/search + CSV export)
  - Lots (CRUD with create/edit/active toggle)
  - Users (list + role change + block toggle)
  - Analytics (revenue line chart, popular-lots pie, peak-hours bar)
  - Spots (per-lot status grid)
  - Real-time notifications panel (SSE)
- Role-based access (user / supervisor)

## Database Schema

- `users` — id, name, email, phone, password_hash, role (user/supervisor), is_blocked, profile_photo_url, created_at
- `parking_lots` — id, owner_id, name, location, total_spots, lat, lng, price_per_hour, is_active, created_at
- `spots` — id, lot_id, spot_number, status (available/reserved/occupied)
- `reservations` — id, user_id, spot_id, start_time, end_time, total_price, status, created_at
- `password_reset_codes` — id, user_id, code (6 digits), expires_at, used_at, created_at
- `ratings` — id, reservation_id (unique), user_id, lot_id, stars (1-5), comment, created_at

All ID columns use `integer().primaryKey({ autoIncrement: true })` (SQLite analog of `serial`). Never change ID types.

## Seed Data

- Supervisor: `supervisor@parknow.ps` / `supervisor123`
- User: `user@parknow.ps` / `user123`
- 3 parking lots in Ramallah (5 spots each, prices 5/4/7 ₪)

## API endpoints (key additions)

- `POST /api/auth/forgot-password`, `POST /api/auth/verify-code`, `POST /api/auth/reset-password`
- `PATCH /api/profile`
- `GET /api/users`, `PATCH /api/users/:id` (supervisor only)
- `POST /api/lots`, `PATCH /api/lots/:id` (supervisor only)
- `GET /api/lots?search&maxPrice&minAvailable` (filters)
- `POST /api/reservations/:id/rate`, `GET /api/lots/:id/ratings`
- `GET /api/dashboard/reservations?status&lotId&dateFrom&dateTo`
- `GET /api/dashboard/reservations/export` — CSV
- `GET /api/dashboard/revenue?period=daily|weekly|monthly`
- `GET /api/dashboard/popular-lots`, `GET /api/dashboard/peak-hours`
- `GET /api/notifications/stream` — Server-Sent Events for new reservations

## Codegen Notes

After `orval --config ./orval.config.ts`, the `lib/api-zod/src/index.ts` must only export from `./generated/api` (the codegen script handles this).

Orval names body schemas after operationIds, e.g. `verifyResetCode` → `VerifyResetCodeBody`, `rateReservation` → `RateReservationBody`.
