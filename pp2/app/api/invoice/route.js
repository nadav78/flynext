/* This file was created with assistance from Claude 3.7 Sonnet */ 

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import prisma from '@/prisma';
import { NextResponse } from 'next/server';

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

    // Find trip and verify ownership
    const tripItinerary = await prisma.tripItinerary.findUnique({
      where: { 
        id: parseInt(tripId, 10),
        userId: parseInt(userId, 10) // Ensure user can only access their own trips
      },
      include: {
        user: true, // Include user details for the invoice
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

    // Setup invoice directory
    const invoiceDir = path.join(process.cwd(), 'public', 'invoices');
    await fsPromises.mkdir(invoiceDir, { recursive: true });

    const invoiceFileName = `invoice_${tripItinerary.id}.pdf`;
    const invoiceFullPath = path.join(invoiceDir, invoiceFileName);

    // Create PDF document
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(invoiceFullPath);
    
    doc.pipe(writeStream);

    // Add content to PDF
    doc.fontSize(20).text('Trip Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Booking Reference: ${tripItinerary.afs_booking_reference || 'N/A'}`);
    doc.text(`Total Price: ${tripItinerary.total_price || 'N/A'}`);
    doc.text(`Date of invoice: ${tripItinerary.created_at.toDateString()}`);
    doc.moveDown();
    doc.fontSize(16).text('Contact Information', { underline: true });
    doc.moveDown();
    
    // Use the related user data instead of direct properties
    doc.text(`Full Name: ${tripItinerary.user.first_name || ''} ${tripItinerary.user.last_name || ''}`);
    doc.text(`Email: ${tripItinerary.user.email || ''}`);
    doc.text(`Phone: ${tripItinerary.user.phone_number || ''}`);
    doc.moveDown();

    if (tripItinerary.HotelReservation.length > 0) {
      doc.fontSize(16).text('Hotel Reservations', { underline: true });
      doc.moveDown();

      tripItinerary.HotelReservation.forEach((reservation, index) => {
        // Hotel reservation details
        doc.fontSize(14).text(`Reservation ${index + 1}`, { underline: true });
        
        // Rest of your hotel details code...
        doc.text(`Hotel Name: ${reservation.hotel.name}`);
        if (reservation.hotel.address) doc.text(`Address: ${reservation.hotel.address}`);
        // Continue with other hotel details

        // Room details
        doc.text(`Room Type: ${reservation.roomType.name}`);
        if (reservation.roomType.price_per_night) doc.text(`Price per Night: ${reservation.roomType.price_per_night}`);
        
        // Dates
        doc.text(`Check-in: ${new Date(reservation.check_in_time).toLocaleString()}`);
        doc.text(`Check-out: ${new Date(reservation.check_out_time).toLocaleString()}`);
        doc.moveDown();
      });
    } else {
      doc.text('No hotel reservations found for this trip.');
    }

    // Add flight details if needed
    
    // Finish PDF
    doc.end();

    // Wait for the PDF to be fully written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Update the database with the invoice URL
    const invoiceUrl = `/invoices/${invoiceFileName}`;
    await prisma.tripItinerary.update({
      where: { id: parseInt(tripId, 10) },
      data: { invoice_url: invoiceUrl },
    });

    return NextResponse.json({ 
      success: true,
      invoiceUrl 
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Error generating invoice' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}