import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const campaignId = (await params).id;

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id: campaignId },
            include: {
                deliveries: {
                    include: {
                        token: {
                            include: {
                                company: true,
                                contact: true
                            }
                        }
                    }
                }
            }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Flatten the delivery data for the UI
        const flattenedDeliveries = campaign.deliveries.map(d => ({
            deliveryId: d.id,
            tokenId: d.tokenId,
            companyName: d.token.company?.name || 'Unknown',
            contactName: d.token.contact?.name || 'Company-Wide Link',
            contactEmail: d.token.contact?.email || 'N/A',
            status: d.status,
            sent_at: d.sent_at,
            opened_at: d.opened_at,
        }));

        return NextResponse.json({
            ...campaign,
            deliveries: flattenedDeliveries
        });

    } catch (error) {
        console.error('Error fetching campaign details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const campaignId = (await params).id;
        const data = await request.json();

        // Cannot edit a sent campaign
        const existing = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (existing.status === 'Sent') return NextResponse.json({ error: 'Cannot edit a sent campaign' }, { status: 400 });

        const updated = await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: {
                name: data.name,
                subject: data.subject,
                htmlBody: data.htmlBody,
                scheduled_for: data.scheduled_for ? new Date(data.scheduled_for) : null,
                status: data.status || existing.status, // might switch Draft -> Scheduled
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const campaignId = (await params).id;

        const existing = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (existing.status === 'Sent') return NextResponse.json({ error: 'Cannot delete a sent campaign' }, { status: 400 });

        await prisma.emailCampaign.delete({
            where: { id: campaignId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
