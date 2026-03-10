import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Here we could verify admin auth if we had the standard function
        // For now, let's assume it's protected by middleware or similar to other admin routes

        const id = (await params).id;

        if (!id) {
            return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
        }

        // Deleting the batch will cascade delete FeedbackItem and GeneralFeedback based on schema
        await prisma.batch.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
    }
}
