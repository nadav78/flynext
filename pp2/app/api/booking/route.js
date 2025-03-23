import { NextResponse } from "next/server";
import { bookFlight } from "@/utils/get-afs.js";
import { validateRequestFormat } from "@/utils/request-validator";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Assistance was used from GitHub Copilot for this function
export async function POST(req) {
    try {
        if (req.method !== "POST") {
            return NextResponse.json({ error: "Invalid method, must be POST" }, { status: 405 });
        }

        // Validate that the request is in JSON format
        const formatError = validateRequestFormat(req, 'json');
        if (formatError) {
            return NextResponse.json(formatError, { status: 400 });
        }
        // parse request body
        const body = await req.json();

        // Get user ID from middleware-added header
        const userId = req.headers.get('x-user-id');

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
            console.error(`Invalid user with: ${userId}`);
            return NextResponse.json({ error: "User not found" }, { status: 400 });
        }

        // get flight details from request body
        const firstName = body.firstName || "";
        const lastName = body.lastName || "";
        const email = body.email || "";
        const passportNumber = body.passportNumber || "";
        const firstFlightId = body.firstFlightId || "";
        const returnFlightId = body.returnFlightId || "";

        // get hotel details from request body
        const hotelId = body.hotelId ? parseInt(body.hotelId) : null;
        const check_in_time = body.checkInTime || "";
        const check_out_time = body.checkOutTime || "";
        const hotelRoomTypeId = body.roomTypeId ? parseInt(body.roomTypeId) : null;
        const tripItineraryId = body.tripItineraryId ? parseInt(body.tripItineraryId) : null;

        // if either one of hotel/flight details is fully empty
        // then we only try booking one of them   
        if (!hotelId && !check_in_time && !check_out_time && !hotelRoomTypeId && !tripItineraryId) {
            // handle flight booking only
            if (!firstName || !lastName) {
                return NextResponse.json({ error: "First and last name required" }, { status: 400 });
            }
            if (!email) {
                return NextResponse.json({ error: "Email required" }, { status: 400 });
            }
            if (!passportNumber) {
                return NextResponse.json({ error: "Passport number required" }, { status: 400 });
            }
            if (!firstFlightId) {
                return NextResponse.json({ error: "First flight ID required" }, { status: 400 });
            }

            const result = await bookFlight({
                userId: userId,
                firstName: firstName,
                lastName: lastName,
                email: email,
                passportNumber: parseInt(passportNumber),
                flightIds: [firstFlightId, returnFlightId],
                id: userExists.id,
            });
            if (result && result.error) {
                return NextResponse.json(result, { status: 400 });
            }
            return NextResponse.json({ message: "Flight booked successfully", result });
        } else if (!firstName || !lastName || !email || !passportNumber || !firstFlightId) {
            // handle hotel booking only
            if (!hotelId) {
                return NextResponse.json({ error: "Hotel ID required" }, { status: 400 });
            }
            if (!check_in_time) {
                return NextResponse.json({ error: "Check-in time required" }, { status: 400 });
            }
            if (!check_out_time) {
                return NextResponse.json({ error: "Check-out time required" }, { status: 400 });
            }
            if (!hotelRoomTypeId) {
                return NextResponse.json({ error: "Room type ID required" }, { status: 400 });
            }
            if (!tripItineraryId) {
                return NextResponse.json({ error: "Trip itinerary ID required" }, { status: 400 });
            }

        } else {
            // we handle both flight and hotel booking at same time
            // check validity of flight params
            if (!firstName || !lastName) {
                return NextResponse.json({ error: "First and last name required" }, { status: 400 });
            }
            if (!email) {
                return NextResponse.json({ error: "Email required" }, { status: 400 });
            }
            if (!passportNumber) {
                return NextResponse.json({ error: "Passport number required" }, { status: 400 });
            }
            if (!firstFlightId) {
                return NextResponse.json({ error: "First flight ID required" }, { status: 400 });
            }

            const result = await bookFlight({
                userId: userId,
                firstName: firstName,
                lastName: lastName,
                email: email,
                passportNumber: parseInt(passportNumber),
                flightIds: [firstFlightId, returnFlightId],
                id: userExists.id,
            });
            if (result && result.error) {
                return NextResponse.json(result, { status: 400 });
            }
            // flight booked successfully now book hotel
            // check validity of hotel params
            if (!hotelId) {
                return NextResponse.json({ error: "Hotel ID required" }, { status: 400 });
            }
            if (!check_in_time) {
                return NextResponse.json({ error: "Check-in time required" }, { status: 400 });
            }
            if (!check_out_time) {
                return NextResponse.json({ error: "Check-out time required" }, { status: 400 });
            }
            if (!hotelRoomTypeId) {
                return NextResponse.json({ error: "Room type ID required" }, { status: 400 });
            }
            if (!tripItineraryId) {
                return NextResponse.json({ error: "Trip itinerary ID required" }, { status: 400 });
            }

            // check hotelId, tripItineraryId, hotelRoomTypeId exist 
            // compare hotelId, tripItineraryId, hotelRoomTypeId with hotels, etc in the database
            const hotelExists = await prisma.hotel.findFirst({
                where: {
                    id: hotelId,
                },
            });
            if (!hotelExists) {
                console.error(`Invalid hotel with ID ${hotelId}`);
                return NextResponse.json({ error: "Hotel not found" }, { status: 400 });
            }

            const tripItineraryExists = await prisma.tripItinerary.findFirst({
                where: {
                    id: tripItineraryId,
                },
            });
            if (!tripItineraryExists) {
                console.error(`Invalid trip itinerary with ID ${tripItineraryId}`);
                return NextResponse.json({ error: "Trip itinerary not found" }, { status: 400 });
            }

            const hotelRoomTypeExists = await prisma.hotelRoomType.findFirst({
                where: {
                    id: hotelRoomTypeId,
                },
            });
            if (!hotelRoomTypeExists) {
                console.error(`Invalid hotel room type with ID ${hotelRoomTypeId}`);
                return NextResponse.json({ error: "Hotel room type not found" }, { status: 400 });
            }

            // check check_out_time > check_in_time
            if (check_out_time <= check_in_time) {
                return NextResponse.json({ error: "Check-out time must be after check-in time" }, { status: 400 });
            }

            // now create a HotelReservation with the given details
            const hotelReservation = await prisma.hotelReservation.create({
                data: {
                    check_in_time: check_in_time,
                    check_out_time: check_out_time,
                    hotelId: hotelId,
                    hotelRoomTypeId: hotelRoomTypeId,
                    tripItineraryId: tripItineraryId,
                    userId: userId,
                }
            });

            return NextResponse.json({ message: "Flight and hotel booked successfully", result, hotelReservation });
        }
    } catch (error) {
        console.error("Booking error:", error);
        return NextResponse.json({ error: "Failed to process booking" }, { status: 500 });
    }
}
