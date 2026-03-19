import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const batchId = params.id;

        // Fetch feedback items that have been actioned
        const feedback = await prisma.feedbackItem.findMany({
            where: {
                batchId,
            },
            include: {
                company: { select: { name: true } },
                contact: { select: { name: true, email: true } },
                project: { select: { project_name: true } }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Fetch general feedback for this batch
        const generalFeedback = await prisma.generalFeedback.findMany({
            where: { batchId },
            include: {
                company: { select: { name: true } },
                contact: { select: { name: true, email: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const projectFeedback = feedback.map((f: any) => ({
            id: f.id,
            companyName: f.company?.name || 'Unknown',
            contactName: f.contact?.name || 'Unknown',
            projectName: f.project?.project_name || 'Unknown',
            status: f.status,
            awarded: f.awarded,
            reason_not_carried: f.reason_not_carried,
            carried_price: f.carried_price,
            awarded_price: f.awarded_price,
            how_to_improve: f.how_to_improve,
            quote_reasonableness: f.quote_reasonableness,
            comments: f.comments,
            submitted_at: f.submitted_at
        }));

        return NextResponse.json({
            projectFeedback,
            generalFeedback: generalFeedback.map(g => ({
                id: g.id,
                companyName: g.company?.name || 'Unknown',
                contactName: g.contact?.name || 'Unknown',
                relationship_feedback: g.relationship_feedback,
                follow_up_impact: g.follow_up_impact,
                updatedAt: g.updatedAt
            }))
        });
    } catch (error) {
        console.error("Results Preview Error: ", error);
        return NextResponse.json({ error: 'Failed to load preview results' }, { status: 500 });
    }
}
