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
}).refine(
    data => !data.checkin || !data.checkout || data.checkin < data.checkout,
    {
        message: "Check-in date must be before check-out date",
        path: ["checkin"],
    }
);

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
    console.log(city)
    try {
        // Basic where clause for hotel filters
        const where = { ...hotelFilters };
        
        // Find hotels matching the basic criteria
        const hotels = await prisma.hotel.findMany({
            where: {
                ...where,
                Location: {
                    // Updated to use case-insensitive search for city and country
                    ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
                    ...(country ? { country: { equals: country, mode: 'insensitive' } } : {})
                },
                HotelRoomType: {
                    some: {
                        ...(price_min || price_max ? {
                            price_per_night: {
                                ...(price_min ? { gte: price_min } : {}),
                                ...(price_max ? { lte: price_max } : {})
                            }
                        } : {})
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
                        price_per_night: true,
                        room_count: true,
                        HotelReservation: checkin && checkout ? {
                            where: {
                                is_cancelled: false,
                                check_in_time: { lte: checkout },
                                check_out_time: { gte: checkin }
                            }
                        } : false
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

        // Process the results to check availability
        const filteredHotels = hotels.map(hotel => {
            // Filter room types to only include those with availability
            const availableRoomTypes = hotel.HotelRoomType.filter(roomType => {
                if (!checkin || !checkout) return true;
                
                // Calculate number of reservations during the requested period
                const reservationCount = roomType.HotelReservation?.length || 0;
                // Check if there are available rooms
                return roomType.room_count > reservationCount;
            }).map(roomType => {
                // Remove the reservation data from the response
                const { HotelReservation, ...rest } = roomType;
                return rest;
            });
            
            // Return the hotel only if it has available rooms
            return {
                ...hotel,
                HotelRoomType: availableRoomTypes
            };
        }).filter(hotel => hotel.HotelRoomType.length > 0);

        return NextResponse.json({ hotels: filteredHotels }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ 
            error: "Failed to retrieve hotels",
            details: error.message 
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}