import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// GET handler to fetch all notifications for a user
export async function GET(request) {
    try {
        const headers = new Headers(request.headers);
        const userId = parseInt(headers.get('x-user-id'));

        // Fetch notifications from database
        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                created_at: "desc",
            },
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

const markAsReadSchema = z.object({
    notificationIds: z.array(z.coerce.number()).nonempty(),
});

// PATCH handler to mark notifications as read
export async function PATCH(req) {
    try {
        const headers = new Headers(req.headers);
        const userId = parseInt(headers.get('x-user-id'));

        // Validate request body
        try {
            const body = await req.json();
            var validationResult = markAsReadSchema.safeParse(body);
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

        // Update notifications to mark them as read
        const updated = await prisma.notification.updateMany({
            where: {
                id: { in: validData.notificationIds },
                userId: userId, // Ensure the notifications belong to this user
            },
            data: {
                is_read: true,
            },
        });

        if (updated.count === 0) {
            return NextResponse.json({
                error: "No notifications found to mark as read"
            }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return NextResponse.json(
            { error: "Failed to mark notifications as read" },
            { status: 500 }
        );
    }
}
