/**
 * API route for hotel room types
 * Created with assistance from Claude 3.7 Sonnet
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateRequestFormat } from '@/utils/request-validator';

const prisma = new PrismaClient();

/**
 * create a new room type for a hotel
 */
export async function POST(req, { params }) {
  try {
    // Validate that the request is in JSON format
    const formatError = validateRequestFormat(req, 'json');
    if (formatError) {
        return NextResponse.json(formatError, { status: 400 });
    }
    
    // get authenticated user ID from middleware
    const userId = parseInt(req.headers.get('x-user-id'), 10);
    const hotelId = parseInt(params.hotelId, 10);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // verify hotel exists and user is owner
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });
    
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }
    
    if (hotel.ownerId !== userId) {
      return NextResponse.json({ error: "You don't have permission to update this hotel" }, { status: 403 });
    }
    
    // parse request body
    const roomTypeData = await req.json();
    
    // basic validation
    if (!roomTypeData.name || !roomTypeData.price_per_night) {
      return NextResponse.json({ 
        error: "Room type name and price are required" 
      }, { status: 400 });
    }
    
    if (!roomTypeData.room_count || roomTypeData.room_count < 1) {
      return NextResponse.json({ 
        error: "Room count must be at least 1" 
      }, { status: 400 });
    }
    
    // create room type in database
    const roomType = await prisma.hotelRoomType.create({
      data: {
        name: roomTypeData.name,
        price_per_night: roomTypeData.price_per_night,
        room_count: roomTypeData.room_count,
        amenities: roomTypeData.amenities ? JSON.stringify(roomTypeData.amenities) : null,
        gallery_count: 0,
        hotel: {
          connect: { id: hotelId }
        }
      }
    });
    
    return NextResponse.json(roomType, { status: 201 });
  } catch (error) {
    console.error("Room type creation error:", error);
    return NextResponse.json({ 
      error: "Failed to create room type" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * get all room types for a hotel
 */
export async function GET(req, { params }) {
  try {
    const hotelId = parseInt(params.hotelId, 10);
    
    // verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });
    
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }
    
    // get all room types for this hotel
    const roomTypes = await prisma.hotelRoomType.findMany({
      where: { hotelId: hotelId }
    });
    
    return NextResponse.json(roomTypes);
  } catch (error) {
    console.error("Error fetching room types:", error);
    return NextResponse.json({ 
      error: "Failed to fetch room types" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}