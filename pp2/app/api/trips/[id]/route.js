/* Created with assistance from Claude 3.7 Sonnet */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyFlight } from '@/utils/get-afs.js';

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  try {
    // Get user ID from middleware
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    const tripId = id;
    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    // Fetch trip details including hotel reservations
    const trip = await prisma.tripItinerary.findUnique({
      where: { 
        id: parseInt(tripId, 10),
        userId: parseInt(userId, 10) // Ensure user can only access their own trips
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true
          }
        },
        HotelReservation: {
          include: {
            hotel: true,
            roomType: true
          }
        }
      }
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Fetch flight details from AFS if this trip has a flight booking
    let flightDetails = [];
    if (trip.afs_booking_reference && trip.user.last_name) {
      const afsResult = await verifyFlight({
        lastName: trip.user.last_name,
        bookingReference: trip.afs_booking_reference,
      });
      if (afsResult && !afsResult.error && Array.isArray(afsResult.flights)) {
        flightDetails = afsResult.flights.map(f => ({
          id: f.id ?? f.flightNumber ?? '',
          flightNumber: f.flightNumber ?? '',
          airline: f.airline?.name ?? f.airline ?? '',
          origin: f.origin?.city ? `${f.origin.city} (${f.origin.code})` : (f.origin ?? ''),
          destination: f.destination?.city ? `${f.destination.city} (${f.destination.code})` : (f.destination ?? ''),
          departureTime: f.departureTime ?? '',
          arrivalTime: f.arrivalTime ?? '',
          price: f.price?.toString() ?? '0',
        }));
      }
    }

    // Format the response
    const rawRef = trip.afs_booking_reference || null;
    const flightCancelled = rawRef?.startsWith('CANCELLED_') ?? false;
    const bookingReference = flightCancelled ? rawRef.replace('CANCELLED_', '') : (rawRef || 'N/A');

    const response = {
      id: trip.id.toString(),
      tripId: trip.id.toString(),
      bookingReference,
      flightCancelled,
      ticketNumber: trip.afs_ticket_number || 'N/A',
      totalPrice: trip.total_price ? trip.total_price.toString() : '0',
      createdAt: trip.created_at.toISOString(),
      invoiceUrl: trip.invoice_url || null,
      user: {
        firstName: trip.user.first_name || '',
        lastName: trip.user.last_name || '',
        email: trip.user.email || '',
        phoneNumber: trip.user.phone_number || ''
      },
      hotelReservations: trip.HotelReservation.map(reservation => ({
        id: reservation.id.toString(),
        hotelName: reservation.hotel.name,
        roomType: reservation.roomType.name,
        checkIn: reservation.check_in_time.toISOString(),
        checkOut: reservation.check_out_time.toISOString(),
        cancelled: reservation.is_cancelled,
        bookingReference: reservation.booking_reference || null,
        price: reservation.roomType.price_per_night ?
               (parseFloat(reservation.roomType.price_per_night) *
               Math.ceil((reservation.check_out_time - reservation.check_in_time) / (1000 * 60 * 60 * 24))).toFixed(2) :
               '0'
      })),
      flights: flightDetails
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching trip details:', error);
    return NextResponse.json(
      { error: "Failed to fetch trip details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}