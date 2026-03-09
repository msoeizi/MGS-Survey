import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateSurveyToken } from '@/lib/survey-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        const batchId = url.searchParams.get('batch');

        if (!token || !batchId) return NextResponse.json({ error: 'Missing token/batch' }, { status: 400 });

        const tokenRecord = await validateSurveyToken(token, batchId);
        if (!tokenRecord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { projectIds } = await request.json();

        // Set these specific FeedbackItems to 'InProgress' if they were 'Draft'.
        // Keep 'Submitted' intact.
        await prisma.feedbackItem.updateMany({
            where: {
                batchId,
                contactId: tokenRecord.contactId as string,
                projectId: { in: projectIds },
                status: 'Draft'
            },
            data: { status: 'InProgress', contactId: tokenRecord.contactId as string }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
