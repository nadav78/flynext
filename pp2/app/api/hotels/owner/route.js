import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
    const headers = new Headers(req.headers);
    const userId = parseInt(headers.get('x-user-id'));

    try {
        const hotels = await prisma.hotel.findMany({
            where: {
                ownerId: userId
            }
        });

        return NextResponse.json(hotels);
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "Failed to fetch hotels",
            details: error.message
        }, { status: 500 });
    }
}