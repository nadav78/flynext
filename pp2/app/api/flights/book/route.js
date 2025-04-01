import { NextResponse } from "next/server";
import { bookFlight } from "@/utils/get-afs.js";
import { validateRequestFormat } from "@/utils/request-validator";
import { getUserIdFromToken } from "@/utils/auth.js";

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
    const user = await getUserIdFromToken(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firstName = body.firstName || ""; // required
    const lastName = body.lastName || ""; // required
    const email = body.email || ""; // required
    const tripItineraryId = body.tripItineraryId ? parseInt(body.tripItineraryId) : null; 
    const passportNumber = parseInt(body.passportNumber) || ""; // required
    const firstFlightId = body.firstFlightId || ""; // required
    const returnFlightId = body.returnFlightId || ""; // if no return flight specified assume one-way trip

    if(!firstName || !lastName || !email || !passportNumber || !firstFlightId) {
        return NextResponse.json({ error: "First name, last name, email, trip itinerary, and a flight ID are required." }, { status: 400 });
    }

    if (isNaN(passportNumber)) {
        return NextResponse.json({ error: "Passport number must be a number." }, { status: 400 });
    }
    if (passportNumber < 0) {
        return NextResponse.json({ error: "Passport number must be a positive number." }, { status: 400 });
    }

    const bookParams = {
        userId: user.id,
        firstName: firstName,
        lastName: lastName,
        email: email,
        passportNumber: String(passportNumber),
        flightIds: !returnFlightId ? [firstFlightId] : [firstFlightId, returnFlightId],
    }

    const bookResponse = await bookFlight(bookParams, tripItineraryId);
    if (!bookResponse.success) {
        return NextResponse.json({ error: "Booking failed" }, { status: 400 });
    }
    const bookingReference = bookResponse.bookingReference;
    const ticketNumber = bookResponse.ticketNumber;

    return NextResponse.json({ message: "Booking successful", bookingReference: bookingReference, ticketNumber: ticketNumber }, { status: 200 });
}
