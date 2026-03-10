import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
    try {
        // Run as a transaction so we either delete everything or nothing.
        // Order is important to avoid foreign key constraint errors for NoAction relations.
        await prisma.$transaction([
            prisma.feedbackItem.deleteMany({}),
            prisma.generalFeedback.deleteMany({}),
            prisma.companyProjectInvite.deleteMany({}),
            prisma.accessToken.deleteMany({}),
            prisma.contact.deleteMany({}),
            prisma.project.deleteMany({}),
            prisma.company.deleteMany({}),
            prisma.batch.deleteMany({})
        ]);

        return NextResponse.json({ success: true, message: 'System wiped successfully.' });
    } catch (error) {
        console.error('Error wiping system:', error);
        return NextResponse.json({ error: 'Failed to wipe system.' }, { status: 500 });
    }
}
