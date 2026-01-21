# FlyNext (CSC309) — Group Project

A full‑stack travel app for searching flights and hotels, reserving rooms, booking flights, checking out with card validation (no real charges), viewing invoices, and receiving notifications.

## Group Project
- This repository contains team work completed for CSC309. Multiple contributors worked across backend, frontend, and infrastructure.
- See `group_responsibilities.txt` for detailed roles and tasks.

## Personal Contributions
- Checkout flow: `pp2/app/checkout/page.tsx` (card validation, flow control)
- Hotel reservation UX: `pp2/app/hotels/page.tsx` (reserve + localStorage handoff)
- Notifications UI: `pp2/components/Navbar.tsx` (polling + badge)
- Flight booking integration: `pp2/app/flights/results/page.tsx` (handoff to checkout)

## Tech Stack
- Next.js (App Router), TypeScript, React
- Prisma ORM + PostgreSQL
- Tailwind CSS
- REST API under `pp2/app/api/*`
- Docker Compose for local infra

## Project Structure
- `pp2/app/*`: Next.js routes (pages + API)
- `pp2/prisma/*`: Prisma schema and migrations
- `pp2/components/*`: UI components
- `pp2/utils/*`: Auth/validation helpers
- `docker-compose.yml`: Local services and wiring
- `group_responsibilities.txt`: Team roles/tasks

## Prerequisites
- Node 18+ and npm
- PostgreSQL (local or via Docker)
- Docker Desktop (optional, for Compose)
- Environment variables in `pp2/.env` (not committed)

Minimum `pp2/.env`:
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME`
- `JWT_SECRET=replace_me`
- (Optional) `AFS_BASE_URL`, other keys if used

## Local Development
```bash
cd pp2
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

App runs at http://localhost:3000

## Run with Docker
```bash
docker compose up -d --build
# stop
docker compose down
```

Notes:
- Do not commit secrets. Keep `.env` and `pp2/api-keys.txt` out of version control.
- Data import should be done via scripts/compose services; do not commit DB dumps.

## Data
- Schema managed by Prisma migrations (`pp2/prisma/migrations`).
- For demo content (e.g., ≥50 hotels across multiple cities), use import scripts and run them via Compose/startup scripts.

## Key Features
- Hotel search (public) with filters (city, name, stars, price)
- Room reservation with availability checks
- Flight booking (AFS integration)
- Checkout with card validation (no real charges)
- Notifications (polling badge in navbar)
- Invoices page (PDF download if enabled)

## Deployment
- Provide your deployed URL in `url.txt` (single line).
- HTTPS endpoint recommended.

## Notes
- This repo includes team contributions. My individual work is listed above and in `group_responsibilities.txt`.
