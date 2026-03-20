import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const batchId = (await params).id;

        // 1. Funnel Data
        const invited = await prisma.accessToken.count({ where: { batchId } });
        const sent = await prisma.accessToken.count({ where: { batchId, email_sent_at: { not: null } } });
        const opened = await prisma.accessToken.count({ where: { batchId, email_opened_at: { not: null } } });

        const feedbackStats = await prisma.feedbackItem.groupBy({
            by: ['status'],
            where: { batchId },
            _count: true
        });

        const funnel = {
            invited,
            sent,
            opened,
            started: feedbackStats.find(s => s.status === 'InProgress')?._count || 0,
            submitted: feedbackStats.find(s => s.status === 'Submitted')?._count || 0,
        };

        // 2. Win/Loss Data
        const winLossStats = await prisma.feedbackItem.groupBy({
            by: ['awarded'],
            where: { batchId, status: 'Submitted' },
            _count: true
        });

        const winLoss = {
            won: winLossStats.find(s => s.awarded === 'Yes')?._count || 0,
            lost: winLossStats.find(s => s.awarded === 'No')?._count || 0,
            unknown: winLossStats.find(s => s.awarded === 'Unknown')?._count || 0,
        };

        // 3. Reasons for Loss (Top 5)
        const reasonStats = await prisma.feedbackItem.groupBy({
            by: ['reason_not_carried'],
            where: { batchId, status: 'Submitted', awarded: 'No', NOT: { reason_not_carried: null } },
            _count: { reason_not_carried: true },
            orderBy: { _count: { reason_not_carried: 'desc' } },
            take: 5
        });

        // 4. Quote Reasonableness Stats
        const quoteStats = await prisma.feedbackItem.groupBy({
            by: ['quote_reasonableness'],
            where: { batchId, status: 'Submitted', NOT: { quote_reasonableness: null } },
            _count: true
        });

        // 5. Follow-up Impact Stats (from GeneralFeedback)
        const impactStats = await prisma.generalFeedback.groupBy({
            by: ['follow_up_impact'],
            where: { batchId, NOT: { follow_up_impact: null } },
            _count: true
        });

        // 6. Recent Activity (Latest 5 submissions)
        const recentActivity = await prisma.feedbackItem.findMany({
            where: { batchId, status: 'Submitted' },
            orderBy: { submitted_at: 'desc' },
            take: 5,
            include: {
                company: { select: { name: true } },
                project: { select: { project_name: true } },
                contact: { select: { name: true } }
            }
        });

        return NextResponse.json({
            funnel,
            winLoss,
            reasons: reasonStats.map(r => ({
                reason: r.reason_not_carried,
                count: r._count.reason_not_carried
            })),
            sentiment: quoteStats.map(q => ({
                label: q.quote_reasonableness,
                count: q._count
            })),
            impact: impactStats.map(i => ({
                label: i.follow_up_impact,
                count: i._count
            })),
            recentActivity: recentActivity.map(a => ({
                id: a.id,
                company: a.company.name,
                project: a.project.project_name,
                contact: a.contact?.name || 'Unknown',
                date: a.submitted_at
            }))
        });

    } catch (error: any) {
        console.error('[AnalysisAPI] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch analysis', details: error.message }, { status: 500 });
    }
}
