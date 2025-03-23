import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const roomTypeCreationSchema = z.object({
    hotel_id: z.number().int(),
    name: z.string().min(1, "Room type name is required"),
    price_per_night: z.number().finite().positive(),
    amenities: z.array(z.string()).nullable(),
    room_count: z.number().int().positive()
});

export async function POST(req) {
    const headers = new Headers(req.headers);
    const userId = parseInt(headers.get('x-user-id'));
    if (!userId) {
        return NextResponse.json({
            error: "Unauthorized"
        }, { status: 401 });
    }

    // Validate against schema
    try {
        const body = await req.json();
        var validationResult = roomTypeCreationSchema.safeParse(body);
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
        const roomType = await prisma.hotelRoomType.create({
            data: {
                name: validData.name,
                price_per_night: validData.price_per_night,
                amenities: validData.amenities ? JSON.stringify(validData.amenities) : null,
                room_count: validData.room_count,
                hotel: {
                    connect: {
                        id: validData.hotel_id,
                        ownerId: userId
                    }
                }
            }
        })

        return NextResponse.json(roomType, { status: 201 });
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({
                error: "Hotel not found"
            }, { status: 404 });
        }
        console.log(error);
        return NextResponse.json({
            error: "Failed to create room type",
            details: error.message
        }, { status: 500 });
    }
}

const roomTypeGetSchema = z.object({
    hotel_id: z.coerce.number().int()
});

export async function GET(req) {
    const url = new URL(req.url);
    const headers = new Headers(req.headers);
    const userId = parseInt(headers.get('x-user-id'));

    try {
        var validationResult = roomTypeGetSchema.safeParse(
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
        const roomTypes = await prisma.hotelRoomType.findMany({
            where: {
                hotelId: validData.hotel_id,
                hotel: {
                    ownerId: userId
                }
            }
        });

        return NextResponse.json(roomTypes, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "Failed to fetch room types",
            details: error.message
        }, { status: 500 });
    }    
}

const roomTypePatchSchema = z.object({
    hotel_id: z.number().int(),
    room_type_id: z.number().int(),
    name: z.string().min(1, "Room type name is required").optional(),
    price_per_night: z.number().finite().positive().optional(),
    amenities: z.array(z.string()).nullable().optional(),
    room_count: z.number().int().positive().optional()
});

export async function PATCH(req) {
    const headers = new Headers(req.headers);
    const userId = parseInt(headers.get('x-user-id'));
    if (!userId) {
        return NextResponse.json({
            error: "Unauthorized"
        }, { status: 401 });
    }

    // Validate against schema
    try {
        const body = await req.json();
        var validationResult = roomTypePatchSchema.safeParse(body);
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

    // Prepare update data
    const updateData = {};
    validData.amenities = validData.amenities ? JSON.stringify(validData.amenities) : null

    try {
        const roomType = await prisma.hotelRoomType.findFirst({
            where: {
                id: validData.room_type_id,
                hotel: {
                    id: validData.hotel_id,
                    ownerId: userId
                }
            }
        });

        if (!roomType) {
            return NextResponse.json({
                error: "Room type not found or you don't have permission to update it"
            }, { status: 404 });
        }

        // Update the room type
        const updatedRoomType = await prisma.hotelRoomType.update({
            where: {
                id: validData.room_type_id
            },
            data: updateData
        });

        return NextResponse.json(updatedRoomType, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "Failed to update room type",
            details: error.message
        }, { status: 500 });
    }
}