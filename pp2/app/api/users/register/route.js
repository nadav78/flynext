import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashedPassword } from '@/utils/auth';
import { validateRequestFormat } from '@/utils/request-validator'

const prisma = new PrismaClient();

export async function POST(req) {
    try {
        // Validate that the request is in JSON format
        const formatError = validateRequestFormat(req, 'json');
        if (formatError) {
            return NextResponse.json(formatError, { status: 400 });
        }

        const { email, first_name, last_name, password, phone_number, profileImage } = await req.json();
        // validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // check if user already exists with email
        const existingEmail = await prisma.user.findUnique({ where: { email }});
        if (existingEmail) {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 409 }
            );
        }

        // create user
        const newUser = await prisma.user.create({
            data: {
                email,
                password: await hashedPassword(password),
                first_name,
                last_name,
                phone_number,
                profileImage,
            },
        });

        // Create default user preferences
        await prisma.userPreference.create({
            data: {
                userId: newUser.id,
                theme_mode: "light"
            }
        });

        // return user data (exclude password)
        const { password: _, ...userData } = newUser;
        return NextResponse.json(userData, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Failed to register user" },
            { status: 500}
        );
    } finally {
        await prisma.$disconnect();
    }
}