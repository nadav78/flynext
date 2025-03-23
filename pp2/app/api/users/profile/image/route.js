/**
 * API route for handling user profile image uploads
 * Contains code generated with assistance from Claude 3.7 Sonnet
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

// max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// valid image types
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * upload/update user profile image
 */
export async function POST(req) {
  try {
    // get authenticated user ID from middleware
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get('content-type');
    // Check if it's a multipart form
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        error: "Invalid request format", 
        details: "This endpoint expects multipart/form-data for file uploads." 
      }, { status: 400 });
    }
    
    // parse form data
    const formData = await req.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    
    // validate file type
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPEG, PNG and WebP images are allowed" 
      }, { status: 400 });
    }
    
    // validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 5MB" 
      }, { status: 400 });
    }
    
    // create user images directory if it doesn't exist
    const userDir = path.join(process.cwd(), 'public', 'images', 'users', userId);
    await fs.mkdir(userDir, { recursive: true });
    
    // process and save the image
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // resize and optimize the image
    const processedImage = await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // save the processed image
    const imagePath = path.join(userDir, 'profile.jpg');
    await fs.writeFile(imagePath, processedImage);
    
    // update the user profile in the database
    const relativePath = `/images/users/${userId}/profile.jpg`;
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { profileImage: relativePath },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        profileImage: true,
      }
    });
    
    return NextResponse.json({
      message: "Profile image uploaded successfully",
      user: updatedUser
    }, { status: 200 });
    
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json({ 
      error: "Failed to upload profile image" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
