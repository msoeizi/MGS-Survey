import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateSurveyToken } from '@/lib/survey-auth';
import { parsePrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        const batchId = url.searchParams.get('batch');

        if (!token || !batchId) return NextResponse.json({ error: 'Missing auth data' }, { status: 400 });

        const tokenRecord = await validateSurveyToken(token, batchId);
        if (!tokenRecord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { items, general } = await request.json();

        // Iterate through items data and update them in the DB
        // We only update if it belongs to this company and batch and is NOT locked

        const dbItems = await prisma.feedbackItem.findMany({
            where: {
                batchId,
                contactId: tokenRecord.contactId as string,
                id: { in: Object.keys(items) }
            }
        });

        // In a production app, use prisma transaction for batch upserts
        await prisma.$transaction(
            dbItems.map((dbItem: any) => {
                if (dbItem.status === 'Locked' || dbItem.status === 'Submitted') {
                    // Returning empty update if already submitted/locked to prevent bypass
                    return prisma.feedbackItem.update({ where: { id: dbItem.id }, data: {} });
                }

                const data = items[dbItem.id];
                return prisma.feedbackItem.update({
                    where: { id: dbItem.id },
                    data: {
                        awarded: data.awarded,
                        reason_not_carried: data.reason,
                        carried_price: parsePrice(data.carried_price),
                        how_to_improve: data.how_to_improve,
                        quote_reasonableness: data.quote_reasonableness,
                        awarded_price: parsePrice(data.price),
                        comments: data.comments,
                        status: 'InProgress'
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
