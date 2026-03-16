'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';

const DESTINATIONS = ['New York', 'London', 'Tokyo', 'Dubai', 'Paris', 'Sydney'];

export default function Home() {
  const { user } = useAuth();
  const [destIndex, setDestIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setDestIndex(i => (i + 1) % DESTINATIONS.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-28 bg-gradient-to-br from-primary to-blue-700 text-primary-content overflow-hidden">
        {/* subtle background circles */}
        <div className="absolute w-96 h-96 rounded-full bg-white/5 -top-24 -left-24 pointer-events-none" />
        <div className="absolute w-64 h-64 rounded-full bg-white/5 bottom-0 right-0 pointer-events-none" />

        <p className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-80">
          Your journey starts here
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4">
          Fly to{' '}
          <span
            style={{
              display: 'inline-block',
              transition: 'opacity 0.4s, transform 0.4s',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(8px)',
              minWidth: '6ch',
            }}
          >
            {DESTINATIONS[destIndex]}
          </span>
        </h1>
        <p className="text-lg md:text-xl opacity-80 max-w-xl mb-10">
          Search flights, book hotels, and manage your trips — all in one place.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/flights" className="btn btn-lg bg-white text-primary hover:bg-white/90 border-none shadow-lg">
            Search Flights
          </Link>
          <Link href="/hotels" className="btn btn-lg btn-outline border-white text-white hover:bg-white/10">
            Find Hotels
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-3">✈️</div>
              <h2 className="card-title">Flights</h2>
              <p className="text-base-content/70 text-sm">
                Search hundreds of routes and find the best fares for any date.
              </p>
              <div className="card-actions mt-4">
                <Link href="/flights" className="btn btn-primary btn-sm">Search Flights</Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-3">🏨</div>
              <h2 className="card-title">Hotels</h2>
              <p className="text-base-content/70 text-sm">
                Browse hotels by city, star rating, and price — with real-time availability.
              </p>
              <div className="card-actions mt-4">
                <Link href="/hotels" className="btn btn-primary btn-sm">Find Hotels</Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <h2 className="card-title">My Trips</h2>
              <p className="text-base-content/70 text-sm">
                View all your bookings, download invoices, and manage cancellations.
              </p>
              <div className="card-actions mt-4">
                <Link href="/trips" className="btn btn-primary btn-sm">View Trips</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner — only shown to guests */}
      {!user && (
        <section className="bg-base-100 py-16 px-4 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to take off?</h2>
          <p className="text-base-content/70 mb-6 max-w-md mx-auto">
            Create a free account and start booking your next adventure in minutes.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">Get Started</Link>
        </section>
      )}
    </main>
  );
}
