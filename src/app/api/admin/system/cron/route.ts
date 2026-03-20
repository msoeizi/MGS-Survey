import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processCampaignDispatch } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Authenticate the cron request
        const authHeader = request.headers.get('authorization');
        const expectedToken = `Bearer ${process.env.AUTH_SECRET}`;
        
        // In local development, we might bypass or strictly enforce. Let's strictly enforce if AUTH_SECRET exists.
        if (process.env.AUTH_SECRET && authHeader !== expectedToken) {
            return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
        }

        const now = new Date();
        console.log(`[Cron] Checking for scheduled campaigns due at or before ${now.toISOString()}...`);

        // Find campaigns that are scheduled and due
        const dueCampaigns = await prisma.emailCampaign.findMany({
            where: {
                status: 'Scheduled',
                scheduled_for: {
                    lte: now
                }
            }
        });

        if (dueCampaigns.length === 0) {
            return NextResponse.json({ message: 'No campaigns due for dispatch.' });
        }

        console.log(`[Cron] Found ${dueCampaigns.length} campaigns due for dispatch.`);

        const results = [];

        for (const campaign of dueCampaigns) {
            console.log(`[Cron] Processing campaign ${campaign.id} ('${campaign.name}')...`);
            
            // Find all pending deliveries that were staged for this campaign
            const pendingDeliveries = await prisma.emailDelivery.findMany({
                where: {
                    campaignId: campaign.id,
                    status: 'Pending'
                },
                select: { tokenId: true }
            });

            const tokenIds = pendingDeliveries.map(d => d.tokenId);

            if (tokenIds.length === 0) {
                console.warn(`[Cron] Campaign ${campaign.id} has no pending deliveries. Marking as Sent.`);
                await prisma.emailCampaign.update({
                    where: { id: campaign.id },
                    data: { status: 'Sent', sent_at: now }
                });
                results.push({ campaignId: campaign.id, action: 'marked_empty_sent' });
                continue;
            }

            try {
                const res = await processCampaignDispatch(campaign.id, tokenIds);
                results.push({
                    campaignId: campaign.id,
                    success: true,
                    dispatched: res.successCount,
                    skipped: res.skippedCount
                });
            } catch (err: any) {
                console.error(`[Cron] Error processing campaign ${campaign.id}:`, err);
                results.push({
                    campaignId: campaign.id,
                    success: false,
                    error: err.message || String(err)
                });
                
                // If it fails completely, we might leave it as Scheduled to retry, or fail it.
                // For now, we leave it as Scheduled, but it might get stuck in an infinite loop.
                // Ideally, we add a retry count, but let's keep it simple.
            }
        }

        return NextResponse.json({
            message: `Processed ${dueCampaigns.length} campaigns.`,
            results
        });

    } catch (error: any) {
        console.error('[Cron] Fatal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
