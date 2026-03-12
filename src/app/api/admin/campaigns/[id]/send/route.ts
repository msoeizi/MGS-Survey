import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('[SendRoute] RESEND_API_KEY is not set!');
        }
        const resend = new Resend(process.env.RESEND_API_KEY);
        const campaignId = (await params).id;
        const { tokenIds } = await request.json();

        if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
            return NextResponse.json({ error: 'No contacts selected.' }, { status: 400 });
        }

        // Fetch the campaign details
        const campaign = await prisma.emailCampaign.findUnique({
            where: { id: campaignId },
            include: { batch: true }
        });

        if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        if (campaign.status === 'Sent') return NextResponse.json({ error: 'Campaign was already sent' }, { status: 400 });

        console.log(`[SendRoute] Campaign ${campaignId} for Batch ${campaign.batchId}. Received ${tokenIds.length} token IDs:`, tokenIds);

        // Fetch tokens to build emails
        const tokens = await prisma.accessToken.findMany({
            where: {
                batchId: campaign.batchId,
                id: { in: tokenIds }
            },
            include: {
                company: true,
                contact: true
            }
        });

        console.log(`[SendRoute] Found ${tokens.length} matching tokens in database.`);
        if (tokens.length === 0) {
            // Check if tokens exist at all for this batch
            const anyTokens = await prisma.accessToken.count({ where: { batchId: campaign.batchId } });
            console.log(`[SendRoute] Total tokens for batch ${campaign.batchId}: ${anyTokens}`);
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        let successCount = 0;
        let lastError = null;

        // Check if this is a scheduled send
        const now = new Date();
        const isScheduled = campaign.scheduled_for && new Date(campaign.scheduled_for) > now;

        for (const t of tokens) {
            if (!t.contact || !t.contact.email) continue;

            const companyName = t.company?.name || 'Your Company';
            const contactName = t.contact.name || 'Estimator';
            const surveyLink = `${appUrl}/survey/${t.token}?batch=${campaign.batchId}`;

            // Create Pending delivery record
            const delivery = await prisma.emailDelivery.upsert({
                where: {
                    campaignId_tokenId: {
                        campaignId: campaign.id,
                        tokenId: t.id
                    }
                },
                update: { status: 'Pending' },
                create: {
                    campaignId: campaign.id,
                    tokenId: t.id,
                    status: 'Pending'
                }
            });

            if (isScheduled) {
                // Skip actual sending if scheduled for later
                successCount++;
                continue;
            }

            const parsedSubject = campaign.subject
                .replace(/{{CompanyName}}/g, companyName)
                .replace(/{{ContactName}}/g, contactName);

            const trackingPixelHtml = `<img src="${appUrl}/api/tracking/open?deliveryId=${delivery.id}" width="1" height="1" alt="" style="display:none;" />`;

            // Replace merge tags in HTML body
            const parsedBody = campaign.htmlBody
                .replace(/{{CompanyName}}/g, companyName)
                .replace(/{{ContactName}}/g, contactName)
                .replace(/{{SurveyLink}}/g, surveyLink);

            const finalHtml = parsedBody + trackingPixelHtml;

            try {
                // Dispatch via Resend
                const fromAddress = process.env.RESEND_FROM_EMAIL || 'MGS Survey <info@moderngrains.com>';
                const { data, error } = await resend.emails.send({
                    from: fromAddress,
                    to: t.contact.email,
                    subject: parsedSubject,
                    html: finalHtml,
                });

                if (error) {
                    console.error(`[Resend Error] Sending to ${t.contact.email}:`, error);
                    lastError = error.message;
                    await prisma.emailDelivery.update({
                        where: { id: delivery.id },
                        data: { status: 'Failed' }
                    });
                } else {
                    successCount++;
                    // Mark delivery as sent
                    await prisma.emailDelivery.update({
                        where: { id: delivery.id },
                        data: { status: 'Sent', sent_at: new Date() }
                    });
                }
            } catch (resendError: any) {
                console.error(`[Resend Exception] Sending to ${t.contact.email}:`, resendError);
                lastError = resendError.message;
                await prisma.emailDelivery.update({
                    where: { id: delivery.id },
                    data: { status: 'Failed' }
                });
            }
        }

        // Mark the overall campaign status
        await prisma.emailCampaign.update({
            where: { id: campaign.id },
            data: {
                status: isScheduled ? 'Scheduled' : 'Sent',
                sent_at: isScheduled ? null : new Date()
            }
        });

        if (successCount === 0 && tokens.length > 0 && !isScheduled) {
            return NextResponse.json({
                error: lastError || 'Failed to send emails. Check your Resend configuration.',
                details: 'If you are in Sandbox mode, you can only send to your own verified email.'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            count: successCount,
            status: isScheduled ? 'Scheduled' : 'Sent'
        });

    } catch (error: any) {
        console.error('FATAL Error sending campaign:', error);
        if (error instanceof Error) {
            console.error('Stack Trace:', error.stack);
        }
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
