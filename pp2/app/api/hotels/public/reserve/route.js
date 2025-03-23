import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// get all reservations for a user
export async function GET(req) {
    const headers = new Headers(req.headers);
    const userId = parseInt(headers.get('x-user-id'));

    try {
        const reservations = await prisma.hotelReservation.findMany({
            where: {
                reserver: {
                    id: userId
                }
            },
            include: {
                hotel: true,
                roomType: true
            }
        });

        return NextResponse.json(reservations);
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "Failed to fetch reservations",
            details: error.message
        }, { status: 500 });
    }
}

const reservationCreationSchema = z.object({
    hotel_id: z.number().int(),
    room_type_id: z.number().int(),
    check_in_time: z.coerce.date(),
    check_out_time: z.coerce.date()
}).refine(data => data.check_in_time < data.check_out_time, {
    message: "Check-in time must be before check-out time",
    path: ["check_out_time"]
});

export async function POST(req) {
    const headers = new Headers(req.headers);
    const userId = parseInt(headers.get('x-user-id'));

    try {
        const body = await req.json();
        var validationResult = reservationCreationSchema.safeParse(body);
    } catch (error) {
        return NextResponse.json({
            error: "Invalid parameters",
            details: error.message
        }, { status: 400 });
    }

    if (!validationResult.success) {
        return NextResponse.json({
            error: "Validation failed",
            details: validationResult.error.format()
        }, { status: 400 });
    }

    const validData = validationResult.data;

    try {
        const reservation = await prisma.$transaction(async (tx) => {
            const overlappingReservations = await tx.hotelReservation.findMany({
                where: {
                    hotelRoomTypeId: validData.room_type_id,
                    check_in_time: {
                        lte: validData.check_out_time
                    },
                    check_out_time: {
                        gte: validData.check_in_time
                    }
                }
            });

            if (overlappingReservations.length > 0) {
                throw new Error("Room is not available for the selected dates");
            }

            const hotel = await tx.hotel.findUnique({
                where: {
                    id: validData.hotel_id
                },
                select: {
                    ownerId: true
                }
            });

            if (!hotel) {
                throw new Error("Hotel not found");
            }

            const reservation = await tx.hotelReservation.create({
                data: {
                    hotel: {
                        connect: {
                            id: validData.hotel_id
                        }
                    },
                    roomType: {
                        connect: {
                            id: validData.room_type_id
                        }
                    },
                    reserver: {
                        connect: {
                            id: userId
                        }
                    },
                    check_in_time: validData.check_in_time,
                    check_out_time: validData.check_out_time
                }
            });

            await tx.notification.create({
                data: {
                    user: {
                        connect: {
                            id: hotel.ownerId
                        }
                    },
                    reservation: {
                        connect: {
                            id: reservation.id
                        }
                    },
                    message: `Reservation created`,
                    type: "BOOKING"
                }
            })

            return reservation
        });

        return NextResponse.json(reservation, { status: 201 });
    } catch (error) {
        if (error.message === "Room is not available for the selected dates") {
            return NextResponse.json({
                error: error.message,
                details: "The selected dates overlap with existing reservations"
            }, { status: 400 });
        }
        console.log(error);
        return NextResponse.json({
            error: "Failed to create reservation",
            details: error.message
        }, { status: 500 });
    }
}

