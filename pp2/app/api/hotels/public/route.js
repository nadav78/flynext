import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const hotelSearchSchema = z.object({
    hotel_id: z.coerce.number().int().optional(),
    name: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    star_rating: z.coerce.number().int().min(1).max(5).optional(),
    price_min: z.coerce.number().min(0).optional(),
    price_max: z.coerce.number().min(0).optional(),
    checkin: z.coerce.date().optional(),
    checkout: z.coerce.date().optional(),
});

export async function GET(req) {
    const url = new URL(req.url);

    try {
        var validationResult = hotelSearchSchema.safeParse(
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

    const filters = validationResult.data;
    const { checkin, checkout, price_min, price_max, city, country, ...hotelFilters } = filters;

    try {
        // Basic where clause for hotel filters
        const where = { ...hotelFilters };
        
        // Find hotels with availability during the specified period
        const hotels = await prisma.hotel.findMany({
            where: {
                ...where,
                Location: {
                    ...(city ? { city: city } : {}),
                    ...(country ? { country: country } : {})
                },
                // Only include hotels that have at least one room type with availability
                HotelRoomType: {
                    some: {
                        // Price range filtering if specified
                        ...(price_min || price_max ? {
                            price_per_night: {
                                ...(price_min ? { gte: price_min } : {}),
                                ...(price_max ? { lte: price_max } : {})
                            }
                        } : {}),
                        // Check that room count is greater than reserved rooms
                        room_count: {
                            gt: checkin && checkout ? 
                                prisma.hotelReservation.count({
                                    where: {
                                        hotelRoomTypeId: { equals: prisma.hotelRoomType.id },
                                        is_cancelled: false,
                                        OR: [
                                            // Reservation overlaps with requested period
                                            {
                                                check_in_time: { lte: checkout },
                                                check_out_time: { gte: checkin }
                                            }
                                        ]
                                    }
                                }) : 0
                        }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                address: true,
                Location: {
                    select: {
                        city: true,
                        country: true
                    }
                },
                star_rating: true,
                HotelRoomType: {
                    select: {
                        id: true,
                        name: true,
                        price_per_night: true
                    },
                    where: price_min || price_max ? {
                        price_per_night: {
                            ...(price_min ? { gte: price_min } : {}),
                            ...(price_max ? { lte: price_max } : {})
                        }
                    } : {}
                }
            }
        });

        return NextResponse.json({ hotels }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ 
            error: "Failed to retrieve hotels",
            details: error.message 
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}