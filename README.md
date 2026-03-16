# FlyNext

A full-stack travel booking platform for searching flights and hotels, reserving rooms, checking out, managing trips, and downloading PDF invoices.

**Live:** https://flynext-zeta.vercel.app

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** PostgreSQL via Prisma ORM (Neon on production)
- **Auth:** JWT (access + refresh tokens), middleware-enforced protected routes
- **Styling:** Tailwind CSS + daisyUI
- **Deployment:** Vercel

## Features

- **Flight search** — search by origin/destination/date with one-way and round-trip support; autocomplete airport/city input
- **Hotel search** — search by city with check-in/check-out dates; filter by star rating, price, and amenities
- **Checkout** — cart-based flow combining a flight booking and/or hotel reservation into a single trip with payment
- **Trips & invoices** — view all past trips, cancel individual flights or hotel reservations, and download a branded PDF invoice per trip
- **Hotel management** — hotel owners can create and manage their hotels and room types
- **Notifications** — navbar badge with polling for booking and cancellation events
- **Profile** — update name, email, phone, password, and profile photo

## Local Setup

```bash
cd pp2
npm install
```

Create `pp2/.env`:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
JWT_SECRET=your_secret
```

Then run:

```bash
npx prisma migrate deploy
npm run seed       # seeds airports, locations, and sample hotels
npm run dev
```

App runs at http://localhost:3000.

## Project Structure

```
pp2/
  app/
    page.tsx              # Landing page
    flights/              # Flight search + results
    hotels/               # Hotel search
    bookings/             # Pre-checkout review
    checkout/             # Payment & booking finalization
    trips/                # Trip history
    invoice/[id]/         # Trip detail + PDF download + cancellation
    manage-hotels/        # Hotel owner dashboard
    profile/              # User profile
    api/                  # REST API routes
  components/             # Navbar, ProtectedRoute, Autocomplete, etc.
  prisma/
    schema.prisma
    seed.js
  utils/
    get-afs.js            # Mock flight data layer (search, book, verify, cancel)
```

## Notes

- This started as a group project for CSC309 at the University of Toronto. Post-submission, I extended and fixed it significantly: deployed to Vercel + Neon, fixed the booking flow, added hotel booking references, improved the PDF invoice, and resolved several bugs.
- No real charges are made — card validation is simulated.
- Flight data is served by a mock layer (`utils/get-afs.js`) using a seeded PRNG.
