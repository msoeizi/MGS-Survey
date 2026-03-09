import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            include: {
                _count: {
                    select: { contacts: true, projectInvites: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(companies);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}
