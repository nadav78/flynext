import { NextResponse } from "next/server";
import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
    const userId = parseInt(req.headers.get('x-user-id'));
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const reservationId = parseInt(body.reservation_id);
    if (!reservationId) {
        return NextResponse.json({ error: "reservation_id is required" }, { status: 400 });
    }

    try {
        const reservation = await prisma.hotelReservation.findUnique({
            where: { id: reservationId },
            include: { hotel: { select: { ownerId: true, name: true } } },
        });

        if (!reservation) {
            return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
        }

        if (reservation.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (reservation.is_cancelled) {
            return NextResponse.json({ error: "Reservation is already cancelled" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.hotelReservation.update({
                where: { id: reservationId },
                data: { is_cancelled: true },
            });

            await tx.notification.create({
                data: {
                    user: { connect: { id: userId } },
                    reservation: { connect: { id: reservationId } },
                    message: `Your reservation at ${reservation.hotel.name} has been cancelled`,
                    type: NotificationType.USER_BOOKING_CREATED,
                },
            });

            await tx.notification.create({
                data: {
                    user: { connect: { id: reservation.hotel.ownerId } },
                    reservation: { connect: { id: reservationId } },
                    message: `A reservation at ${reservation.hotel.name} has been cancelled`,
                    type: NotificationType.OWNER_NEW_BOOKING,
                },
            });
        });

        return NextResponse.json({ message: "Reservation cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling reservation:", error);
        return NextResponse.json({ error: "Failed to cancel reservation" }, { status: 500 });
    }
}
