import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const trips = await prisma.tripItinerary.findMany({
    where: { userId: parseInt(userId, 10) },
    orderBy: { created_at: 'desc' },
    include: {
      HotelReservation: {
        include: { hotel: true, roomType: true },
      },
    },
  });

  const result = trips.map(trip => ({
    id: trip.id,
    bookingReference: trip.afs_booking_reference || null,
    totalPrice: trip.total_price ? trip.total_price.toString() : '0',
    createdAt: trip.created_at.toISOString(),
    hasFlights: !!trip.afs_booking_reference,
    hotels: trip.HotelReservation.map(r => ({
      hotelName: r.hotel.name,
      roomType: r.roomType.name,
      checkIn: r.check_in_time.toISOString(),
      checkOut: r.check_out_time.toISOString(),
      cancelled: r.is_cancelled,
    })),
  }));

  return NextResponse.json(result);
}
