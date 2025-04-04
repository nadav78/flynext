import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRequestFormat } from '@/utils/request-validator'


const prisma = new PrismaClient();

const hotelSchema = z.object({
    name: z.string().min(1, "Hotel name is required"),
    address: z.string(),
    city: z.string(),
    country: z.string(),
    star_rating: z.number().int().min(1).max(5),
    description: z.string(),
    website: z.string().url("Invalid website URL"),
    contact_email: z.string().email("Invalid email"),
    contact_phone: z.string(),
    amenities: z.array(z.string()).nullable(),
});

export async function POST(req) {
    try {
        // Validate that the request is in JSON format
        const formatError = validateRequestFormat(req, 'json');
        if (formatError) {
            return NextResponse.json(formatError, { status: 400 });
        }
        
        // Parse request body
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
            var validationResult = hotelSchema.safeParse(body);
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

        // Use validated data
        const validData = validationResult.data;
        
        // Declare location variable outside the try block to maintain scope
        let location;

        try {
            // check if location exists with case insensitive search
            location = await prisma.location.findFirst({
                where: {
                    city: {
                        equals: validData.city,
                        mode: 'insensitive'
                    },
                    country: {
                        equals: validData.country,
                        mode: 'insensitive'
                    }
                }
            });

            if (!location) {
                return NextResponse.json({
                    error: "Country or city not found"
                }, { status: 404 });
            }
        } catch (error) {
            console.error("Error checking location:", error);
            return NextResponse.json({
                error: "Failed to check location",
                details: error.message
            }, { status: 500 });
        }

        // Create hotel with owner ID from authenticated user
        const hotel = await prisma.hotel.create({
            data: {
                name: validData.name,
                owner: {
                    connect: {
                        id: userId
                    }
                },
                Location: {
                    connect: {
                        id: location.id // Connect using the found location's ID
                    }
                },
                address: validData.address,
                star_rating: validData.star_rating,
                description: validData.description,
                website: validData.website,
                contact_email: validData.contact_email,
                contact_phone: validData.contact_phone,
                amenities: validData.amenities ? JSON.stringify(validData.amenities) : null,
                // gallery_count has default value in schema
            }
        });

        return NextResponse.json({
            message: "Hotel created successfully",
            hotel
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating hotel:", error);
        return NextResponse.json({
            error: "Failed to create hotel",
            details: error.message
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}