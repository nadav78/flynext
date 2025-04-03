import { NextResponse } from "next/server";
import { PrismaClient, NotificationType } from '@prisma/client';
import { z } from 'zod';
import { connect } from "http2";

const prisma = new PrismaClient();

const reservationGetSchema = z.object({
    hotel_id: z.coerce.number().int(),
    room_type_id: z.coerce.number().int().optional(),
    checkin_date: z.coerce.date().optional(),
    checkout_date: z.coerce.date().optional(),
    is_cancelled: z.union([
        z.literal('true'),
        z.literal('false')
    ]).optional(),
    is_paid: z.union([
        z.literal('true'),
        z.literal('false')
    ]).optional(),
});

export async function GET(req) {
    const url = new URL(req.url);
    const headers = new Headers(req.headers);
    const userId = parseInt(headers.get('x-user-id'));

    try {
        var validationResult = reservationGetSchema.safeParse(
            Object.fromEntries(url.searchParams)
        );
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
        const hotel = await prisma.hotel.findFirst({
            where: {
                id: validData.hotel_id,
                ownerId: userId
            }
        });

        if (!hotel) {
            return NextResponse.json({
                error: "Hotel not found or you don't have permission to update it"
            }, { status: 404 });
        }

        const where = {
            hotelId: validData.hotel_id,
            checkinDate: validData.checkin_date,
            checkoutDate: validData.checkout_date,
            ...(validData.room_type_id ? { hotelRoomTypeId: validData.room_type_id } : {}),
            ...(validData.status ? { status: validData.status } : {}),
            ...(validData.is_cancelled !== undefined ? { is_cancelled: validData.is_cancelled === 'true' } : {}),
            ...(validData.is_paid !== undefined ? { is_paid: validData.is_paid === 'true' } : {})
        };

        const reservations = await prisma.hotelReservation.findMany({
            where: where
        });

        return NextResponse.json(reservations, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "Failed to fetch hotel",
            details: error.message
        }, { status: 500 });
    }
}

const reservationUpdateSchema = z.object({
    reservation_id: z.coerce.number().int(),
    is_cancelled: z.union([
        z.literal('true'),
        z.literal('false')
    ])
});

export async function PATCH(req) {
    const headers = new Headers(req.headers);
    const userId = parseInt(headers.get('x-user-id'));
        
    try {
        const body = await req.json();
        const validationResult = reservationUpdateSchema.safeParse(body);
        
        if (!validationResult.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: validationResult.error.format()
            }, { status: 400 });
        }
        
        const validData = validationResult.data;
        
        // Get the reservation first
        const reservation = await prisma.hotelReservation.findUnique({
            where: { id: validData.reservation_id }
        });
        
        if (!reservation) {
            return NextResponse.json({
                error: "You don't have permission to update this reservation"
            }, { status: 404 });
        }
        
        // Check if the hotel belongs to the user
        const hotel = await prisma.hotel.findFirst({
            where: {
                id: reservation.hotelId,
                ownerId: userId
            }
        });
        
        if (!hotel) {
            return NextResponse.json({
                error: "You don't have permission to update this reservation"
            }, { status: 403 });
        }
        
        // Update the reservation
        const updates = {};
        if (validData.is_cancelled !== undefined) {
            updates.is_cancelled = validData.is_cancelled === 'true';
        }
        
        // Use a transaction to update reservation and create notification
        const updatedReservation = await prisma.$transaction(async (tx) => {
            const updated = await tx.hotelReservation.update({
                where: { id: validData.reservation_id },
                data: updates,
                include: {
                    reserver: true
                }
            });
            
            // Create notification for the user if reservation was cancelled
            if (updates.is_cancelled) {
                await tx.notification.create({
                    data: {
                        user: {
                            connect: {
                                id: updated.reserver.id
                            }
                        },
                        reservation: {
                            connect: {
                                id: updated.id
                            }
                        },
                        message: `Your reservation has been cancelled`,
                        type: NotificationType.USER_BOOKING_CANCELLED,
                    }
                });
            }
            
            return updated;
        });
        
        return NextResponse.json(updatedReservation, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "Failed to update reservation",
            details: error.message
        }, { status: 500 });
    }
}