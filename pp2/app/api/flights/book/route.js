import { NextResponse } from "next/server";
import { bookFlight } from "@/utils/get-afs.js";
import { validateRequestFormat } from "@/utils/request-validator";
import { PrismaClient } from '@prisma/client';
import { returnUserId } from "@/middleware.js";
import { parse } from "path";

const prisma = new PrismaClient();

// Assistance was used from GitHub Copilot for this function
export async function POST(req) {
    if (req.method !== "POST") {
        return NextResponse.json({ error: "Invalid method, must be POST" }, { status: 405 });
    }

    // Validate that the request is in JSON format
    const formatError = validateRequestFormat(req, 'json');
    if (formatError) {
        return NextResponse.json(formatError, { status: 400 });
    }

    const body = await req.json();
    // Get user ID from middleware-added header
    const userId = await returnUserId(req);

    // first ensure that in all cases user exists and logged in
    if (!userId) {
        return NextResponse.json({ error: "User ID required, should be logged in." }, { status: 400 });
    }
    const userExists = await prisma.user.findFirst({
        where: {
            id: userId,
        },
    });
    if (!userExists) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const firstName = body.firstName || ""; // required
    const lastName = body.lastName || ""; // required
    const email = body.email || ""; // required
    const tripItineraryId = body.tripItineraryId ? parseInt(body.tripItineraryId) : null; // required
    const passportNumber = body.passportNumber || ""; // required
    const firstFlightId = body.firstFlightId || ""; // required
    const returnFlightId = body.returnFlightId || ""; // if no return flight specified assume one-way trip

    if(!firstName || !lastName || !email || !tripItineraryId || !passportNumber || !firstFlightId) {
        return NextResponse.json({ error: "First name, last name, email, trip itinerary, and a flight ID are required." }, { status: 400 });
    }

    try {
        passportNumber = parseInt(passportNumber);
    }
    catch (error) {
        return NextResponse.json({ error: "Passport number must be a number." }, { status: 400 });
    }
    if (isNaN(passportNumber)) {
        return NextResponse.json({ error: "Passport number must be a number." }, { status: 400 });
    }
    if (passportNumber < 0) {
        return NextResponse.json({ error: "Passport number must be a positive number." }, { status: 400 });
    }

    bookParams = {
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        passportNumber: passportNumber,
        flightIds: !returnFlightId ? [firstFlightId] : [firstFlightId, returnFlightId],
        tripItineraryId: tripItineraryId,
    }

    bookResponse = await bookFlight(bookParams);
    if (bookResponse.error) {
        return NextResponse.json({ error: bookResponse.error }, { status: 400 });
    }
    if (bookResponse.status !== 200) {
        return NextResponse.json({ error: "Booking failed" }, { status: 400 });
    }
    const bookingReference = bookResponse.bookingReference;
    const ticketNumber = bookResponse.ticketNumber;

    if(!bookingReference || !ticketNumber) {
        return NextResponse.json({ error: "Booking failed, non-existent reference/ticket num" }, { status: 400 });
    }

    // save booking to DB
    const trip = await prisma.tripItinerary.findFirst({
        where: {
            id: tripItineraryId,
        },
    });
    if (!trip) {
        // create new trip itinerary with booking
        const newTrip = await prisma.tripItinerary.create({
            data: {
                userId: userId,
                tripName: trip.tripName,
                startDate: trip.startDate,
                endDate: trip.endDate,
                bookingReference: bookingReference,
                ticketNumber: ticketNumber,
            },
        });
        if (!newTrip) {
            return NextResponse.json({ error: "Failed to create trip itinerary" }, { status: 400 });
        }
    }
    else {
        // update existing trip itinerary with booking
        const updatedTrip = await prisma.tripItinerary.update({
            where: {
                id: tripItineraryId,
            },
            data: {
                bookingReference: bookingReference,
                ticketNumber: ticketNumber,
            },
        });
        if (!updatedTrip) {
            return NextResponse.json({ error: "Failed to update trip itinerary" }, { status: 400 });
        }
    }
    return NextResponse.json({ message: "Booking successful", bookingReference: bookingReference, ticketNumber: ticketNumber }, { status: 200 });
}
