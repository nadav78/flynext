import { NextResponse } from "next/server";
import { cancelFlight } from "@/utils/get-afs.js";
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

    const bookingReference = body.bookingReference || ""; // required
    const lastName = body.ticketNumber || ""; // required
    const response = await cancelFlight(bookingReference, lastName);
    if (!response.success) {
        return NextResponse.json({ error: "Cancellation failed" }, { status: 400 });
    }
    return NextResponse.json({ message: "Flight cancellation successful" }, { status: 200 });
}