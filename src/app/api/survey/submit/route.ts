import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateSurveyToken } from '@/lib/survey-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        const batchId = url.searchParams.get('batch');

        if (!token || !batchId) return NextResponse.json({ error: 'Missing auth data' }, { status: 400 });

        const tokenRecord = await validateSurveyToken(token, batchId);
        if (!tokenRecord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { items, general } = await request.json();

        const dbItems = await prisma.feedbackItem.findMany({
            where: {
                batchId,
                contactId: tokenRecord.contactId as string,
                id: { in: Object.keys(items) }
            }
        });

        await prisma.$transaction(
            dbItems.map((dbItem: any) => {
                // Do not allow re-submitting locked ones
                if (dbItem.status === 'Locked' || dbItem.status === 'Submitted') {
                    return prisma.feedbackItem.update({ where: { id: dbItem.id }, data: {} });
                }

                const data = items[dbItem.id];
                return prisma.feedbackItem.update({
                    where: { id: dbItem.id },
                    data: {
                        awarded: data.awarded,
                        reason_not_carried: data.reason,
                        carried_price: data.carried_price ? parseFloat(data.carried_price) : null,
                        how_to_improve: data.how_to_improve,
                        quote_reasonableness: data.quote_reasonableness,
                        awarded_price: data.price ? parseFloat(data.price) : null,
                        comments: data.comments,
                        status: 'Submitted', // Lock it
                        submitted_at: new Date()
                    }
                });
            })
        );

        if (general && tokenRecord.contactId) {
            await prisma.generalFeedback.upsert({
                where: {
                    batchId_companyId_contactId: {
                        batchId: batchId,
                        companyId: tokenRecord.companyId,
                        contactId: tokenRecord.contactId
                    }
                },
                update: {
                    relationship_feedback: general.relationship_feedback,
                    follow_up_impact: general.follow_up_impact
                },
                create: {
                    batchId: batchId,
                    companyId: tokenRecord.companyId,
                    contactId: tokenRecord.contactId,
                    relationship_feedback: general.relationship_feedback,
                    follow_up_impact: general.follow_up_impact
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
