import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import prisma from '@/prisma';
import { NextResponse } from 'next/server';

// part of this function was created using assistance from chatgpt
export default async function POST(req) {
  if(req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  
  // get tripid from query
  const tripId = req.query.tripId; 

  if (!tripId) {
    return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
  }

  const tripItinerary = await prisma.tripItinerary.findUnique({
    where: { id: tripId },
    include: {
      HotelReservation: {
        include: {
          hotel: true,
          roomType: true,
        },
      },
    },
  });

  if (!tripItinerary) {
    return NextResponse .json({ error: 'Trip not found' }, { status: 404 });
  }

  const doc = new PDFDocument();
  // invoices stored in pp1/public/invoices
  const invoiceDir = path.join(process.cwd(), 'public', 'invoices');

  // check invoice directory exists else create it
  if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir, { recursive: true });
  }

  const invoiceFileName = `invoice_${tripItinerary.id}.pdf`;
  const invoiceFullPath = path.join(invoiceDir, invoiceFileName);
  const writeStream = fs.createWriteStream(invoiceFullPath);
  doc.pipe(writeStream);

  // basic details
  doc.fontSize(20).text('Trip Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Booking Reference: ${tripItinerary.afs_booking_reference || 'N/A'}`);
  doc.text(`Total Price: ${tripItinerary.total_price || 'N/A'}`);
  doc.text(`Date of invoice: ${tripItinerary.created_at.toDateString()}`);
  doc.moveDown();
  doc.fontSize(16).text('Contact Information', { underline: true });
  doc.moveDown();
  doc.text(`Full Name: ${tripItinerary.firstName} ${tripItinerary.lastName}`);
  doc.text(`Email: ${tripItinerary.email}`);
  doc.text(`Phone: ${tripItinerary.phone_number}`);
  doc.moveDown();

  if (tripItinerary.HotelReservation.length > 0) {
    doc.fontSize(16).text('Hotel Reservations', { underline: true });
    doc.moveDown();

    tripItinerary.HotelReservation.forEach((reservation, index) => {
      doc.fontSize(14).text(`Reservation ${index + 1}`, { underline: true });
      
      // hotel details
      doc.text(`Hotel Name: ${reservation.hotel.name}`);
      if (reservation.hotel.address) doc.text(`Address: ${reservation.hotel.address}`);
      if (reservation.hotel.location) doc.text(`Location: ${reservation.hotel.location}`);
      if (reservation.hotel.star_rating) doc.text(`Star Rating: ${reservation.hotel.star_rating}`);
      if (reservation.hotel.description) doc.text(`Description: ${reservation.hotel.description}`);
      if (reservation.hotel.website) doc.text(`Website: ${reservation.hotel.website}`);
      if (reservation.hotel.contact_email) doc.text(`Contact Email: ${reservation.hotel.contact_email}`);
      if (reservation.hotel.contact_phone) doc.text(`Contact Phone: ${reservation.hotel.contact_phone}`);
      if (reservation.hotel.amenities) doc.text(`Amenities: ${reservation.hotel.amenities}`);
      doc.moveDown();

      // room type details
      doc.text(`Room Type: ${reservation.roomType.name}`);
      if (reservation.roomType.description) doc.text(`Room Description: ${reservation.roomType.description}`);
      if (reservation.roomType.price_per_night) doc.text(`Price per Night: ${reservation.roomType.price_per_night}`);
      if (reservation.roomType.amenities) doc.text(`Room Amenities: ${reservation.roomType.amenities}`);
      doc.text(`Room Count: ${reservation.roomType.room_count}`);
      doc.text(`Max Occupancy: ${reservation.roomType.max_occupancy}`);
      doc.moveDown();

      // reservation details
      doc.text(`Check-in: ${new Date(reservation.check_in_time).toLocaleString()}`);
      doc.text(`Check-out: ${new Date(reservation.check_out_time).toLocaleString()}`);
      doc.text(`Reservation Valid: ${reservation.is_valid ? 'Yes' : 'No'}`);
      doc.moveDown();
      doc.moveDown();
    });
  } else {
    doc.text('No hotel reservations found for this trip.');
  }

  doc.end();

  // when finished update db 
  writeStream.on('finish', async () => {
    const invoiceUrl = `/invoices/${invoiceFileName}`;

    await prisma.tripItinerary.update({
      where: { id: tripItinerary.id },
      data: { invoice_url: invoiceUrl },
    });

    return NextResponse.json({ invoiceUrl }, { status: 200 });
  });

  writeStream.on('error', (err) => {
    console.error('Error writing PDF:', err);
    return NextResponse.json({ error: 'Error writing PDF' }, { status: 500 });
  });
}
