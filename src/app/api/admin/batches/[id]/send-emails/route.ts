import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const batchId = (await params).id;
        const { tokenIds, subject, htmlBody } = await request.json();

        if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
            return NextResponse.json({ error: 'No contacts selected.' }, { status: 400 });
        }

        // Fetch the selected tokens to parse merge tags
        const tokens = await prisma.accessToken.findMany({
            where: {
                batchId: batchId,
                id: { in: tokenIds }
            },
            include: {
                company: true,
                contact: true
            }
        });

        const updateIds: string[] = [];
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        for (const t of tokens) {
            if (!t.contact) continue; // Only process Contact-level tokens for these emails

            const companyName = t.company?.name || 'Your Company';
            const contactName = t.contact.name || 'Estimator';

            const parsedSubject = subject
                .replace(/{{CompanyName}}/g, companyName)
                .replace(/{{ContactName}}/g, contactName);

            const surveyLink = `${appUrl}/survey/${t.token}?batch=${batchId}`;
            const trackingPixelHtml = `<img src="${appUrl}/api/tracking/open?tid=${t.id}" width="1" height="1" alt="" style="display:none;" />`;

            const parsedBody = htmlBody
                .replace(/{{CompanyName}}/g, companyName)
                .replace(/{{ContactName}}/g, contactName)
                .replace(/{{SurveyLink}}/g, `<a href="${surveyLink}">${surveyLink}</a>`);

            const finalHtml = parsedBody + trackingPixelHtml;

            // TODO: Actually send the email using Resend, Sendgrid, etc.
            console.log(`[Email Stub] Sending email to ${t.contact.email} (${contactName})`);
            console.log(`[Email Stub] Subject: ${parsedSubject}`);

            updateIds.push(t.id);
        }

        // Mark as sent in the database
        await prisma.accessToken.updateMany({
            where: { id: { in: updateIds } },
            data: { email_sent_at: new Date() }
        });

        return NextResponse.json({ success: true, count: updateIds.length });
    } catch (error) {
        console.error('Error sending emails:', error);
        return NextResponse.json({ error: 'Failed to process email campaign' }, { status: 500 });
    }
}
