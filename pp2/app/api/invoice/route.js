import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    // Get user ID from middleware
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get trip ID from URL params
    const url = new URL(req.url);
    const tripId = url.searchParams.get('tripId');
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    // Find trip itinerary and verify ownership
    const tripItinerary = await prisma.tripItinerary.findUnique({
      where: { 
        id: parseInt(tripId, 10),
        userId: parseInt(userId, 10)
      },
      include: {
        user: true,
        HotelReservation: {
          include: {
            hotel: true,
            roomType: true,
          },
        },
      },
    });

    if (!tripItinerary) {
      return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 });
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    // Set fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const textColor = rgb(0, 0, 0);

    // Helper function to add text
    let y = 750; // Starting Y position for content
    const lineHeight = 14;
    const margin = 50;

    const addText = (text, options = {}) => {
      page.drawText(text, {
        x: margin,
        y,
        font,
        size: fontSize,
        color: textColor,
        ...options,
      });
      y -= lineHeight;
    };

    // Add content to PDF
    addText('Trip Invoice', { size: 20, align: 'center' });
    addText(`Booking Reference: ${tripItinerary.afs_booking_reference || 'N/A'}`);
    addText(`Total Price: ${tripItinerary.total_price || 'N/A'}`);
    addText(`Date of invoice: ${tripItinerary.created_at.toDateString()}`);
    addText('Contact Information', { size: 16 });
    addText(`Full Name: ${tripItinerary.user.first_name || ''} ${tripItinerary.user.last_name || ''}`);
    addText(`Email: ${tripItinerary.user.email || ''}`);
    addText(`Phone: ${tripItinerary.user.phone_number || ''}`);

    if (tripItinerary.HotelReservation.length > 0) {
      addText('Hotel Reservations', { size: 16 });
      tripItinerary.HotelReservation.forEach((reservation, index) => {
        addText(`Reservation ${index + 1}`, { size: 14 });
        addText(`Hotel Name: ${reservation.hotel.name}`);
        addText(`Room Type: ${reservation.roomType.name}`);
        addText(`Check-in: ${new Date(reservation.check_in_time).toLocaleString()}`);
        addText(`Check-out: ${new Date(reservation.check_out_time).toLocaleString()}`);
      });
    } else {
      addText('No hotel reservations found for this trip.');
    }

    // Serialize the PDF to bytes (Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Convert Uint8Array to ArrayBuffer
    const pdfBuffer = pdfBytes.buffer;

    // Return PDF file directly
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice_${tripItinerary.id}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: "Error generating invoice" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}