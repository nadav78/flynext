/**
 * This file contains code assistance from AI (Claude 3.7 Sonnet)
 * AI assistance with:
 * - Setting up Prisma queries for user profile retrieval and updates
 * - Proper error handling
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashedPassword } from '@/utils/auth';

const prisma = new PrismaClient();

// get profile
export async function GET(req) {
  try {
    // get user id from middleware
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // get user data
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) }, // convert string to integer
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        profileImage: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// update profile
export async function PUT(req) {
  try {
    // get user id from middleware
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // get update data
    const { first_name, last_name, phone_number, password, profileImage } = await req.json();
    
    // prepare update data
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone_number) updateData.phone_number = phone_number;
    if (profileImage) updateData.profileImage = profileImage;
    if (password) updateData.password = await hashedPassword(password);

    // update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        profileImage: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}