'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

type Trip = {
  id: number;
  bookingReference: string | null;
  totalPrice: string;
  createdAt: string;
  hasFlights: boolean;
  hotels: Array<{
    hotelName: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    cancelled: boolean;
  }>;
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trips', {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTrips(data);
        else setError(data.error || 'Failed to load trips');
      })
      .catch(() => setError('Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-base-200 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Trips</h1>

          {loading && <p>Loading...</p>}
          {error && <p className="text-error">{error}</p>}

          {!loading && !error && trips.length === 0 && (
            <div className="card bg-base-100 shadow p-6 text-center">
              <p className="text-base-content/70">No trips yet.</p>
              <Link href="/flights" className="btn btn-primary mt-4">Search Flights</Link>
            </div>
          )}

          <div className="space-y-4">
            {trips.map(trip => (
              <div key={trip.id} className="card bg-base-100 shadow">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-base-content/60">
                        {new Date(trip.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </p>
                      {trip.hasFlights && (
                        <p className="font-medium">
                          Flight ref: <span className="font-mono">{trip.bookingReference}</span>
                        </p>
                      )}
                      {trip.hotels.filter(h => !h.cancelled).map((h, i) => (
                        <p key={i} className="text-sm">
                          {h.hotelName} — {h.roomType} ({new Date(h.checkIn).toLocaleDateString()} → {new Date(h.checkOut).toLocaleDateString()})
                        </p>
                      ))}
                      {!trip.hasFlights && trip.hotels.every(h => h.cancelled) && (
                        <p className="text-sm text-base-content/50">All reservations cancelled</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${parseFloat(trip.totalPrice).toFixed(2)}</p>
                      <Link href={`/invoice/${trip.id}`} className="btn btn-sm btn-primary mt-2">
                        View Invoice
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
