import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const batchId = (await params).id;

        const campaigns = await prisma.emailCampaign.findMany({
            where: { batchId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { deliveries: true }
                }
            }
        });

        return NextResponse.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const batchId = (await params).id;
        const body = await request.json();
        const { name, duplicateFromId } = body;

        console.log(`[Campaign API] Creating campaign for batch ${batchId}. Body:`, body);
        console.log('[Campaign API] Prisma model keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));

        if (!(prisma as any).emailCampaign) {
            console.error('[Campaign API] FATAL: prisma.emailCampaign is UNDEFINED');
            return NextResponse.json({
                error: 'Database Client Desync',
                details: 'The Prisma client is missing the emailCampaign model. Try restarting the dev server.',
                availableModels: Object.keys(prisma).filter(k => !k.startsWith('_'))
            }, { status: 500 });
        }
        const batch = await prisma.batch.findUnique({
            where: { id: batchId }
        });

        if (!batch) {
            console.error(`[Campaign API] Batch ${batchId} not found.`);
            return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
        }

        // If a duplicate source is provided
        if (duplicateFromId) {
            const source = await prisma.emailCampaign.findUnique({
                where: { id: duplicateFromId }
            });
            if (!source) {
                return NextResponse.json({ error: 'Source campaign not found.' }, { status: 404 });
            }

            const newCampaign = await prisma.emailCampaign.create({
                data: {
                    batchId: batchId,
                    name: `${source.name} (Copy)`,
                    subject: source.subject,
                    htmlBody: source.htmlBody,
                    status: 'Draft',
                }
            });
            return NextResponse.json(newCampaign);
        }

        // Standard new draft creation flow
        if (!name) {
            return NextResponse.json({ error: 'Campaign name is required.' }, { status: 400 });
        }

        const newCampaign = await prisma.emailCampaign.create({
            data: {
                batchId: batchId,
                name,
                subject: '',
                htmlBody: '',
                status: 'Draft',
            }
        });

        return NextResponse.json(newCampaign);
    } catch (error: any) {
        console.error('[Campaign API] Error details:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
