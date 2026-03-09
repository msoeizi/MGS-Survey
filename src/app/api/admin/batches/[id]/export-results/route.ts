import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const batchId = params.id;
        const batch = await prisma.batch.findUnique({ where: { id: batchId } });
        if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

        const feedbackItems = await prisma.feedbackItem.findMany({
            where: { batchId },
            include: {
                company: true,
                project: true,
                contact: true
            },
            orderBy: [
                { company: { name: 'asc' } },
                { project: { project_name: 'asc' } }
            ]
        });

        const exportData = feedbackItems.map((item: any) => ({
            Campaign: batch.name,
            CompanyName: item.company.name,
            ContactName: item.contact?.name || 'Unknown',
            ContactEmail: item.contact?.email || 'N/A',
            ProjectName: item.project.project_name,
            ProjectID: item.project.project_unique_id,
            Status: item.status,
            Awarded: item.awarded || '',
            ReasonNotCarried: item.reason_not_carried || '',
            AwardedPrice: item.awarded_price ? item.awarded_price.toString() : '',
            Comments: item.comments || '',
            SubmittedAt: item.submitted_at ? new Date(item.submitted_at).toISOString() : ''
        }));

        const csv = Papa.unparse(exportData);

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="Feedback_Results_${batch.name.replace(/\s+/g, '_')}.csv"`,
            },
            status: 200,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to export results' }, { status: 500 });
    }
}
