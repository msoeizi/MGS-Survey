import prisma from '@/lib/prisma';
import { Resend } from 'resend';

export async function processCampaignDispatch(campaignId: string, tokenIds: string[]) {
    if (!process.env.RESEND_API_KEY) {
        console.error('[Mailer] RESEND_API_KEY is not set!');
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
        throw new Error('No contacts selected for dispatch.');
    }

    const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: { batch: true }
    });

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status === 'Sent') throw new Error('Campaign was already sent');

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let successCount = 0;
    let skippedCount = 0;
    const skippedEmails: string[] = [];
    let lastError = null;

    const now = new Date();
    // If the scheduled date is securely in the future, it is a delayed send.
    // If it is in the past, or null, it's an immediate dispatch.
    const isScheduled = campaign.scheduled_for && new Date(campaign.scheduled_for) > now;

    for (const t of tokens) {
        if (!t.contact || !t.contact.email) {
            console.log(`[Mailer] Skipping token ${t.id} - Missing contact/email.`);
            skippedCount++;
            skippedEmails.push(t.contact?.name || t.id);
            continue;
        }

        const companyName = t.company?.name || 'Your Company';
        const contactName = t.contact.name || 'Estimator';
        const surveyLink = `${appUrl}/survey/${t.token}?batch=${campaign.batchId}`;

        let delivery;
        try {
            delivery = await prisma.emailDelivery.upsert({
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
        } catch (err: any) {
            console.error('[Mailer] Upsert failed:', err);
            throw new Error(`Database Upsert Failed: ${err.message || err}`);
        }

        if (isScheduled) {
            // Skip the actual API dispatch if this is firmly scheduled for later
            successCount++;
            continue;
        }

        const parsedSubject = campaign.subject
            .replace(/{{CompanyName}}/g, companyName)
            .replace(/{{ContactName}}/g, contactName);

        const trackingPixelHtml = `<img src="${appUrl}/api/tracking/open?deliveryId=${delivery.id}" width="1" height="1" alt="" style="display:none;" />`;

        const parsedBody = campaign.htmlBody
            .replace(/{{CompanyName}}/g, companyName)
            .replace(/{{ContactName}}/g, contactName)
            .replace(/{{SurveyLink}}/g, surveyLink);

        const finalHtml = parsedBody + trackingPixelHtml;

        try {
            console.log(`[Mailer] Dispatching to ${t.contact.email}...`);
            const fromAddress = process.env.RESEND_FROM_EMAIL || 'MGS Survey <info@moderngrains.com>';
            const { data, error } = await resend.emails.send({
                from: fromAddress,
                to: t.contact.email,
                subject: parsedSubject,
                html: finalHtml,
            });

            if (error) {
                console.error(`[Mailer] Resend Error for ${t.contact.email}:`, error);
                lastError = error.message;
                await prisma.emailDelivery.update({
                    where: { id: delivery.id },
                    data: { status: 'Failed' }
                });
            } else {
                successCount++;
                const sentDate = new Date();
                await prisma.emailDelivery.update({
                    where: { id: delivery.id },
                    data: { status: 'Sent', sent_at: sentDate }
                });

                await prisma.accessToken.update({
                    where: { id: t.id },
                    data: { email_sent_at: sentDate }
                });
            }
        } catch (resendError: any) {
            console.error(`[Mailer] Resend Exception for ${t.contact.email}:`, resendError);
            lastError = resendError.message;
            await prisma.emailDelivery.update({
                where: { id: delivery.id },
                data: { status: 'Failed' }
            });
        }
    }

    await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
            status: isScheduled ? 'Scheduled' : 'Sent',
            sent_at: isScheduled ? null : new Date()
        }
    });

    return {
        successCount,
        skippedCount,
        skippedEmails,
        lastError,
        isScheduled,
        tokensProcessed: tokens.length
    };
}
