/**
 * This file contains code assistance from AI (Claude 3.7 Sonnet)
 * AI helped implement token refresh mechanism 
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyRefreshToken, generateAccessToken } from '@/utils/auth';
import { validateRequestFormat } from '@/utils/request-validator';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    // Validate that the request is in JSON format
    const formatError = validateRequestFormat(req, 'json');
    if (formatError) {
        return NextResponse.json(formatError, { status: 400 });
    }

    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // check if token exists in database
    const tokenRecord = await prisma.token.findFirst({
      where: { 
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // get user data to generate new access token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // generate new access token
    const newAccessToken = generateAccessToken(user);

    return NextResponse.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}