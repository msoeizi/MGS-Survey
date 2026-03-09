import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const batchId = params.id;
        const batch = await prisma.batch.findUnique({ where: { id: batchId } });
        if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

        const feedbackItems = await prisma.feedbackItem.findMany({
            where: { batchId },
            select: {
                companyId: true,
                contactId: true,
                company: { select: { name: true } },
                contact: { select: { name: true, email: true } }
            },
        });

        // Ensure we only generate one link per unique Contact per Batch, 
        // regardless of how many FeedbackItems (projects) they are reviewing.
        const uniqueContactsMap = new Map();
        for (const item of feedbackItems) {
            const key = `${item.companyId}-${item.contactId}`;
            if (!uniqueContactsMap.has(key)) {
                uniqueContactsMap.set(key, {
                    companyId: item.companyId,
                    contactId: item.contactId,
                    companyName: item.company?.name || 'Unknown',
                    contactName: item.contact?.name || 'N/A',
                    contactEmail: item.contact?.email || 'N/A'
                });
            }
        }

        const uniqueContacts = Array.from(uniqueContactsMap.values());
        console.log(`[ExportLinks] Batch ${batchId}: Found ${feedbackItems.length} feedback items, ${uniqueContacts.length} unique contacts`);
        const exportData: any[] = [];
        const tokenCreations: {
            token: string;
            token_type: string;
            companyId: string;
            contactId: string | null;
            batchId: string;
        }[] = [];

        for (const profile of uniqueContacts) {
            const rawToken = nanoid(32);
            tokenCreations.push({
                token: rawToken,
                token_type: profile.contactId ? 'Contact' : 'Company',
                companyId: profile.companyId,
                contactId: profile.contactId,
                batchId
            });

            exportData.push({
                CompanyName: profile.companyName,
                ContactName: profile.contactName,
                ContactEmail: profile.contactEmail,
                SurveyLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/survey/${rawToken}?batch=${batchId}`
            });
        }

        // Use a transaction to ensure either both happen or neither
        await prisma.$transaction(async (tx: any) => {
            // Revoke old tokens
            await tx.accessToken.updateMany({
                where: { batchId, revoked_at: null },
                data: { revoked_at: new Date() }
            });

            // Create new ones
            if (tokenCreations.length > 0) {
                console.log(`[ExportLinks] Batch ${batchId}: Creating ${tokenCreations.length} tokens`);
                await tx.accessToken.createMany({
                    data: tokenCreations
                });
            }
        });

        return NextResponse.json(exportData);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to export links' }, { status: 500 });
    }
}
