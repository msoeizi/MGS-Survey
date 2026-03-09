import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const companiesCount = await prisma.company.count();
        const projectsCount = await prisma.project.count();
        const contactsCount = await prisma.contact.count();
        const batchesCount = await prisma.batch.count();
        const feedbackCount = await prisma.feedbackItem.count();

        return NextResponse.json({
            companies: companiesCount,
            projects: projectsCount,
            contacts: contactsCount,
            batches: batchesCount,
            feedback: feedbackCount
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
