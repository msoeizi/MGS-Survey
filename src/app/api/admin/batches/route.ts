import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const batches = await prisma.batch.findMany({
            include: {
                _count: {
                    select: { feedbackItems: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(batches);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

const createBatchSchema = z.object({
    name: z.string().min(1),
    open_at: z.string().optional(),
    close_at: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const parsed = createBatchSchema.parse(data);

        // 1. Create the Batch
        const batch = await prisma.batch.create({
            data: {
                name: parsed.name,
                open_at: parsed.open_at ? new Date(parsed.open_at) : null,
                close_at: parsed.close_at ? new Date(parsed.close_at) : null,
                status: 'Open'
            }
        });

        // 2. Fetch all CompanyProjectInvites and their associated contacts
        const invites = await prisma.companyProjectInvite.findMany({
            include: { company: { include: { contacts: true } } }
        });

        // 3. For every invite, create a FeedbackItem Draft for every contact in that company
        const feedbackItemsData: any[] = [];

        for (const inv of invites) {
            if (!inv.company) {
                console.warn(`[CreateBatch] Skipping ProjectInvite ${inv.id} - Company not found.`);
                continue;
            }
            const contacts = inv.company.contacts;

            if (contacts.length > 0) {
                for (const contact of contacts) {
                    feedbackItemsData.push({
                        batchId: batch.id,
                        companyId: inv.companyId,
                        projectId: inv.projectId,
                        contactId: contact.id,
                        status: 'Draft'
                    });
                }
            } else {
                console.warn(`[CreateBatch] Skipping ProjectInvite ${inv.id} - Company ${inv.companyId} has no contacts.`);
            }
        }

        // 4. Generate AccessTokens for each unique company
        const uniqueCompanyIds = [...new Set(invites.map((i: any) => i.companyId))];
        console.log(`[CreateBatch] Batch ${batch.id}: Found ${invites.length} invites, ${uniqueCompanyIds.length} unique companies`);

        const companiesWithContacts = await prisma.company.findMany({
            where: { id: { in: uniqueCompanyIds } },
            include: { contacts: true }
        });

        const tokenCreations: any[] = [];
        for (const company of companiesWithContacts) {
            if (company.contacts.length > 0) {
                for (const contact of company.contacts) {
                    tokenCreations.push({
                        token: nanoid(32),
                        token_type: 'Contact',
                        companyId: company.id,
                        contactId: contact.id,
                        batchId: batch.id
                    });
                }
            } else {
                tokenCreations.push({
                    token: nanoid(32),
                    token_type: 'Company',
                    companyId: company.id,
                    batchId: batch.id
                });
            }
        }

        console.log(`[CreateBatch] Batch ${batch.id}: Items to create: ${feedbackItemsData.length}, Tokens to create: ${tokenCreations.length}`);

        // Use a transaction for atomic batch setup
        try {
            await prisma.$transaction(async (tx: any) => {
                if (feedbackItemsData.length > 0) {
                    const fi = await tx.feedbackItem.createMany({
                        data: feedbackItemsData
                    });
                    console.log(`[CreateBatch] Transaction: Created ${fi.count} feedback items`);
                }

                if (tokenCreations.length > 0) {
                    const tk = await tx.accessToken.createMany({
                        data: tokenCreations
                    });
                    console.log(`[CreateBatch] Transaction: Created ${tk.count} tokens`);
                }
            });
            console.log(`[CreateBatch] Batch ${batch.id}: Transaction committed successfully`);
        } catch (txError) {
            console.error(`[CreateBatch] Transaction FAILED for Batch ${batch.id}:`, txError);
            throw txError; // Re-throw to hit the main catch block
        }

        return NextResponse.json({ success: true, batchId: batch.id });
    } catch (error: any) {
        console.error('[CreateBatch] Outer Catch:', error);
        try {
            // Write to local file so Antigravity can read it
            require('fs').appendFileSync('batch_error_log.txt', new Date().toISOString() + ' - ERROR: ' + (error.stack || error.message || String(error)) + '\n');
        } catch (e) { }
        return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
    }
}
