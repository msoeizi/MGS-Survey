import { NextResponse } from 'next/server';
import { processCampaignDispatch } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const campaignId = (await params).id;
        const { tokenIds } = await request.json();

        if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
            return NextResponse.json({ error: 'No contacts selected.' }, { status: 400 });
        }

        const result = await processCampaignDispatch(campaignId, tokenIds);

        if (result.successCount === 0 && result.tokensProcessed > 0 && !result.isScheduled) {
            return NextResponse.json({
                error: result.lastError || 'Failed to send emails. Check your Resend configuration.',
                details: 'If you are in Sandbox mode, you can only send to your own verified email.'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            count: result.successCount,
            skipped: result.skippedCount,
            skippedNames: result.skippedEmails,
            status: result.isScheduled ? 'Scheduled' : 'Sent'
        });

    } catch (error: any) {
        console.error('FATAL Error sending campaign:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
