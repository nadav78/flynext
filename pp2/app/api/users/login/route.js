import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { comparePassword, generateAccessToken, generateRefreshToken } from '@/utils/auth';
import { validateRequestFormat } from '@/utils/request-validator'

const prisma = new PrismaClient();

export async function POST(req) {
    try {
        // Validate that the request is in JSON format
        const formatError = validateRequestFormat(req, 'json');
        if (formatError) {
            return NextResponse.json(formatError, { status: 400 });
        }

        const { email, password } = await req.json();

        // validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // check if user exists and password matches
        if (!user || !(await comparePassword(password, user.password))) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        return NextResponse.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Failed to authenticate" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}