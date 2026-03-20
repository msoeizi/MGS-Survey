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

        // Pre-fetch all deliveries for this batch to backfill missing AccessToken metrics for legacy campaigns
        const allDeliveries = await prisma.emailDelivery.findMany({
            where: { campaign: { batchId }, status: { in: ['Sent', 'Delivered'] } },
            select: { tokenId: true, sent_at: true, opened_at: true }
        });

        const deliveryMap = new Map();
        for (const d of allDeliveries) {
            const existing = deliveryMap.get(d.tokenId) || { sent_at: null, opened_at: null };
            if (d.sent_at && (!existing.sent_at || d.sent_at > existing.sent_at)) existing.sent_at = d.sent_at;
            if (d.opened_at && (!existing.opened_at || d.opened_at > existing.opened_at)) existing.opened_at = d.opened_at;
            deliveryMap.set(d.tokenId, existing);
        }

        // Map safe visual projection for Admin Display
        const previewData = await Promise.all(tokens.map(async (t: any) => {
            // Check submission status
            const feedbackItems = await prisma.feedbackItem.findMany({
                where: {
                    batchId,
                    companyId: t.companyId,
                    contactId: t.contactId
                },
                select: { status: true }
            });

            const total = feedbackItems.length;
            const submitted = feedbackItems.filter(f => f.status === 'Submitted').length;
            const isCompleted = total > 0 && submitted === total;

            const legacyDeliv = deliveryMap.get(t.id);

            return {
                id: t.id,
                companyName: t.company?.name || 'Unknown',
                contactName: t.contact?.name || 'Company-Wide Link',
                contactEmail: t.contact?.email || 'N/A',
                token: t.token, // Display actual string link for clicking
                created_at: t.created_at,
                email_sent_at: t.email_sent_at || legacyDeliv?.sent_at || null,
                email_opened_at: t.email_opened_at || legacyDeliv?.opened_at || null,
                open_count: t.open_count || 0,
                isCompleted,
                completionStats: `${submitted}/${total}`
            };
        }));

        return NextResponse.json(previewData);
    } catch (error) {
        console.error("Links Preview Error: ", error);
        return NextResponse.json({ error: 'Failed to load preview links' }, { status: 500 });
    }
}
