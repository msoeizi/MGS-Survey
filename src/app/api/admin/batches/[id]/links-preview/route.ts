import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const batchId = params.id;

        // Fetch non-revoked tokens mapped to this Batch
        const tokens = await prisma.accessToken.findMany({
            where: {
                batchId,
                revoked_at: null
            },
            include: {
                company: { select: { name: true } },
                contact: { select: { name: true, email: true } },
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Map safe visual projection for Admin Display
        const previewData = tokens.map((t: any) => ({
            companyName: t.company?.name || 'Unknown',
            contactName: t.contact?.name || 'Company-Wide Link',
            contactEmail: t.contact?.email || 'N/A',
            token: t.token, // Display actual string link for clicking
            created_at: t.created_at
        }));

        return NextResponse.json(previewData);
    } catch (error) {
        console.error("Links Preview Error: ", error);
        return NextResponse.json({ error: 'Failed to load preview links' }, { status: 500 });
    }
}
