import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashedPassword, comparePassword } from '@/utils/auth';
import { validateRequestFormat } from '@/utils/request-validator';

const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    // Validate request format
    const formatError = validateRequestFormat(req, 'json');
    if (formatError) {
      return NextResponse.json(formatError, { status: 400 });
    }
    
    // Get user ID from middleware
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get password data
    const { current_password, new_password } = await req.json();
    
    // Validate input
    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      );
    }
    
    // Verify password length
    if (new_password.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: {
        id: true,
        password: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Verify current password
    const passwordValid = await comparePassword(current_password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }
    
    // Hash and update the password
    const hashedNewPassword = await hashedPassword(new_password);
    
    await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: {
        password: hashedNewPassword,
      },
    });
    
    return NextResponse.json({
      message: "Password changed successfully"
    });
    
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}