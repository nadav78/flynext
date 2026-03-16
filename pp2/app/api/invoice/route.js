import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Brand colours
const BRAND_BLUE   = rgb(0.10, 0.37, 0.80);
const BRAND_LIGHT  = rgb(0.93, 0.96, 1.00);
const GREY         = rgb(0.45, 0.45, 0.45);
const BLACK        = rgb(0, 0, 0);
const WHITE        = rgb(1, 1, 1);

export async function POST(req) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const tripId = url.searchParams.get('tripId');
    if (!tripId) return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });

    const trip = await prisma.tripItinerary.findUnique({
      where: { id: parseInt(tripId, 10), userId: parseInt(userId, 10) },
      include: {
        user: true,
        HotelReservation: { include: { hotel: true, roomType: true } },
      },
    });

    if (!trip) return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 });

    // ── Document setup ─────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const page   = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const M = 50; // margin
    let y = height;

    // ── Header band ────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: BRAND_BLUE });
    page.drawText('FlyNext', { x: M, y: height - 52, font: bold, size: 28, color: WHITE });
    page.drawText('Travel Invoice', { x: M, y: height - 70, font: regular, size: 11, color: rgb(0.80, 0.90, 1.00) });

    // Invoice number + date top-right
    const invoiceLabel = `Invoice #${trip.id}`;
    const dateLabel    = trip.created_at.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    page.drawText(invoiceLabel, { x: width - M - bold.widthOfTextAtSize(invoiceLabel, 11), y: height - 45, font: bold,    size: 11, color: WHITE });
    page.drawText(dateLabel,    { x: width - M - regular.widthOfTextAtSize(dateLabel, 10),  y: height - 62, font: regular, size: 10, color: rgb(0.80, 0.90, 1.00) });

    y = height - 100;

    // ── Helper functions ───────────────────────────────────────────────────────
    const text = (str, x, yPos, { font: f = regular, size: s = 11, color: c = BLACK } = {}) => {
      page.drawText(String(str), { x, y: yPos, font: f, size: s, color: c });
    };

    const sectionHeader = (label) => {
      y -= 8;
      page.drawRectangle({ x: M, y: y - 2, width: width - M * 2, height: 20, color: BRAND_LIGHT });
      page.drawText(label, { x: M + 6, y: y + 4, font: bold, size: 11, color: BRAND_BLUE });
      y -= 20;
    };

    const divider = (light = false) => {
      page.drawLine({
        start: { x: M, y },
        end:   { x: width - M, y },
        thickness: light ? 0.5 : 1,
        color: light ? rgb(0.85, 0.85, 0.85) : rgb(0.75, 0.75, 0.75),
      });
      y -= 8;
    };

    const row = (label, value, labelColor = GREY) => {
      text(label, M, y, { color: labelColor, size: 10 });
      text(value, M + 170, y, { size: 10 });
      y -= 16;
    };

    // ── Billed To ──────────────────────────────────────────────────────────────
    sectionHeader('Billed To');
    y -= 4;
    const fullName = `${trip.user.first_name || ''} ${trip.user.last_name || ''}`.trim();
    row('Name',  fullName       || '—');
    row('Email', trip.user.email || '—');
    if (trip.user.phone_number) row('Phone', trip.user.phone_number);
    y -= 4;

    // ── Flight Booking ─────────────────────────────────────────────────────────
    if (trip.afs_booking_reference) {
      sectionHeader('Flight Booking');
      y -= 4;
      row('Booking Reference', trip.afs_booking_reference);
      if (trip.afs_ticket_number) row('Ticket Number', trip.afs_ticket_number);
      y -= 4;
    }

    // ── Hotel Reservations ─────────────────────────────────────────────────────
    const activeReservations = trip.HotelReservation.filter(r => !r.is_cancelled);
    if (activeReservations.length > 0) {
      sectionHeader('Hotel Reservations');
      activeReservations.forEach((res, i) => {
        if (i > 0) { divider(true); }
        y -= 4;
        row('Hotel',     res.hotel.name);
        row('Room',      res.roomType.name);
        row('Check-in',  new Date(res.check_in_time).toLocaleDateString('en-US', { dateStyle: 'medium' }));
        row('Check-out', new Date(res.check_out_time).toLocaleDateString('en-US', { dateStyle: 'medium' }));
        if (res.roomType.price_per_night) {
          const nights = Math.ceil((res.check_out_time - res.check_in_time) / 86400000);
          const total  = (parseFloat(res.roomType.price_per_night) * nights).toFixed(2);
          row('Amount',  `$${total} (${nights} night${nights !== 1 ? 's' : ''} × $${parseFloat(res.roomType.price_per_night).toFixed(2)})`);
        }
        y -= 4;
      });
    }

    // ── Total banner ───────────────────────────────────────────────────────────
    y -= 12;
    divider();
    page.drawRectangle({ x: M, y: y - 6, width: width - M * 2, height: 30, color: BRAND_BLUE });
    text('Total Amount', M + 8, y + 10, { font: bold, size: 12, color: WHITE });
    const totalStr = `$${parseFloat(trip.total_price || 0).toFixed(2)}`;
    text(totalStr, width - M - bold.widthOfTextAtSize(totalStr, 14) - 8, y + 8, { font: bold, size: 14, color: WHITE });
    y -= 44;

    // ── Footer ─────────────────────────────────────────────────────────────────
    page.drawText('Thank you for booking with FlyNext.', {
      x: M, y: 40, font: regular, size: 9, color: GREY,
    });
    page.drawText('This is a computer-generated invoice and does not require a signature.', {
      x: M, y: 28, font: regular, size: 9, color: GREY,
    });

    // ── Render ─────────────────────────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice_${trip.id}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Error generating invoice' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
