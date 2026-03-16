# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlyNext is a full-stack travel booking platform built with Next.js 15 (App Router). Users can search/book flights via an external AFS (Advanced Flight System) API and reserve hotel rooms. Users can also register as hotel owners to list and manage properties.

The Next.js application lives in the `pp2/` subdirectory. All commands below should be run from `pp2/`.

## Commands

```bash
# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint

# Database
npx prisma generate              # Regenerate Prisma client after schema changes
npx prisma migrate dev           # Apply migrations (dev)
npx prisma migrate deploy        # Apply migrations (prod)
npx prisma studio                # Open Prisma Studio GUI

# Docker (run from repo root)
docker compose up -d --build     # Start app + PostgreSQL
docker compose down              # Stop services
```

## Architecture

### Directory Structure (inside `pp2/`)

- `app/` — Next.js App Router pages and API routes
  - `app/api/` — REST API handlers (`route.js` files)
  - `app/(pages)/` — Frontend page components
- `components/` — Shared React components (Navbar, Toast, autocomplete, auth forms)
- `contexts/` — React Context providers (auth state)
- `utils/` — Server-side helpers: `auth.js` (JWT), `get-afs.js` (AFS flight API wrapper), `request-validator.js`
- `lib/` — Library utilities
- `prisma/` — Prisma schema and migrations
- `scripts/` — Utility scripts (e.g., `start-db.sh`)
- `public/` — Static assets

### Authentication

JWT-based auth with access + refresh tokens. `middleware.js` (App Router middleware) intercepts requests to protected paths and verifies the Bearer token, injecting `x-user-id` as a header into downstream route handlers.

Protected path prefixes: `/api/users/*`, `/api/flights/*`, `/api/hotels/*`, `/api/booking/*`, `/api/trips/*`, `/api/invoice/*`

Token helpers are in `utils/auth.js`. The JWT secrets are `JWT_SECRET` and `JWT_REFRESH_SECRET` (set in `.env` and exported via `next.config.ts`).

### Database (Prisma + PostgreSQL)

Key models and their relationships:
- **User** → owns Hotels, has HotelReservations, Notifications, TripItineraries, PaymentSessions, Tokens
- **Hotel** → has HotelRoomTypes; belongs to User (owner)
- **HotelReservation** → links User + HotelRoomType; tracks check-in/out, payment status, cancellation
- **TripItinerary** → groups HotelReservations + AFS flight bookings for a user
- **PaymentSession** — temporary data for the checkout flow
- **Notification** — user-facing alerts for booking events

### AFS Flight Integration

All AFS API calls are centralized in `utils/get-afs.js`. On startup, `instrumentation.js` calls `getInitialData()` to seed airport/location data from AFS. Flight search, booking, verification, and cancellation all go through this utility.

### API Route Patterns

- Public routes: `app/api/public/*` (no auth required)
- Protected routes: `app/api/hotels/*`, `app/api/flights/*`, `app/api/trips/*`, etc.
- Hotel owner-specific: `app/api/hotels/owner/*`
- Route files follow Next.js App Router convention: `app/api/[resource]/route.js`

### Styling

Tailwind CSS 4 + daisyUI 5. Theme preference stored per-user in `UserPreference` model.

## Environment Variables

Required in `pp2/.env`:
```
DATABASE_URL=postgresql://postgres:password123@localhost:5432/flynextdb
JWT_SECRET=...
JWT_REFRESH_SECRET=...
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password123
POSTGRES_DB=flynextdb
AMADEUS_CLIENT_ID=...       # from developers.amadeus.com (free)
AMADEUS_CLIENT_SECRET=...   # from developers.amadeus.com (free)
```

For Docker, `DATABASE_URL` should point to `db` host: `postgresql://postgres:postgres@db:5432/flynext`.

### Getting Amadeus credentials (free)
1. Sign up at https://developers.amadeus.com
2. Go to **My Self-Service Workspace** → **Create New App**
3. Copy the **API Key** (→ `AMADEUS_CLIENT_ID`) and **API Secret** (→ `AMADEUS_CLIENT_SECRET`)
4. The free test environment (`test.api.amadeus.com`) is used by default — no credit card needed

On first startup, the app seeds the Location and Airport tables from the Amadeus reference-data API automatically.
