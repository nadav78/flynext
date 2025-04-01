import { NextResponse } from "next/server";
import { verifyFlight } from "@/utils/get-afs.js";
import { validateRequestFormat } from "@/utils/request-validator";
import { PrismaClient } from '@prisma/client';
import { getUserIdFromToken } from "@/utils/auth.js";

const prisma = new PrismaClient();

export async function GET(req) {
    if (req.method !== "POST") {
        return NextResponse.json({ error: "Invalid method, must be GET" }, { status: 405 });
    }

    // Validate that the request is in JSON format
    const formatError = validateRequestFormat(req, 'json');
    if (formatError) {
        return NextResponse.json(formatError, { status: 400 });
    }

    const lastName = params.get("lastName") || "";
    const bookingReference = params.get("bookingReference") || "";
    const userId = await getUserIdFromToken(req);

    // first ensure that in all cases user exists and logged in
    if (!userId) {
        return NextResponse.json({ error: "User ID required, should be logged in." }, { status: 400 });
    }
    const userExists = await prisma.user.findFirst({
        where: {
            id: userId,
            lastName: lastName,
        },
    });
    if (!userExists) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
    }
    if(!lastName) {
        return NextResponse.json({ error: "Last name required" }, { status: 400 });
    }
    if(!bookingReference) {
        return NextResponse.json({ error: "Booking reference required" }, { status: 400 });
    }

    const result = await verifyFlight({
        userId: userId,
        lastName: lastName,
        bookingReference: bookingReference,
    });
    
    if(result && result.error) {
        return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({verified: true ? result.status === "CONFIRMED" : false});
}

