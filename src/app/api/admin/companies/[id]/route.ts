import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        if (!id) {
            return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
        }

        // We must manually delete FeedbackItem and GeneralFeedback records that reference this company.
        // The schema uses `onDelete: NoAction` for these relations to prevent accidental cascade loops.
        await prisma.$transaction([
            prisma.feedbackItem.deleteMany({
                where: { companyId: id }
            }),
            prisma.generalFeedback.deleteMany({
                where: { companyId: id }
            }),
            // After manual cleanup, we can safely delete the company.
            // Prisma will automatically cascade-delete Contacts and CompanyProjectInvites.
            prisma.company.delete({
                where: { id }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }
}
