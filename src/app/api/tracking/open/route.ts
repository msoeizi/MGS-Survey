import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const deliveryId = searchParams.get('deliveryId');

    if (deliveryId) {
        try {
            await prisma.emailDelivery.update({
                where: { id: deliveryId },
                data: { opened_at: new Date() }
            });
            console.log(`[Tracking] Email opened for Delivery: ${deliveryId}`);
        } catch (error) {
            console.error(`[Tracking] Error updating open status for Delivery ${deliveryId}:`, error);
        }
    }

    // Return a 1x1 transparent PNG image
    // This is a standard 1x1 base64 encoded transparent PNG
    const transparentPixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
    );

    return new Response(transparentPixel, {
        headers: {
            'Content-Type': 'image/png',
            'Content-Length': transparentPixel.length.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
