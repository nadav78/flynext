import { NextResponse } from "next/server";
import { verifyFlight } from "@/utils/get-afs.js";

export async function GET(req) {
    const {params} = new URL(req.url);

    const lastName = params.get("lastName") || "";
    const bookingReference = params.get("bookingReference") || "";
    const userId = req.headers.get('x-user-id');

    if(!lastName) {
        return NextResponse.json({ error: "Last name required" }, { status: 400 });
    }
    if(!bookingReference) {
        return NextResponse.json({ error: "Booking reference required" }, { status: 400 });
    }
    if(!userId) {
        return NextResponse.json({ error: "User ID required, should be logged in." }, { status: 400 });
    }

    const userExists = await prisma.user.findFirst({
        where: {
          last_name: { not: null },
        },
    });
    if(!userExists) {
        console.error(`Invalid user with last name ${lastName}`);
        return NextResponse.json({ error: "User not found" }, { status: 400 });
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

