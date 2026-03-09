import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const importRowSchema = z.object({
    CompanyName: z.string().min(1, "Company Name required"),
    ContactName: z.string().optional().or(z.literal('')),
    ContactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
    ProjectID: z.string().min(1, "Project ID required"),
    ProjectName: z.string().min(1, "Project Name required"),
    InvitedDate: z.string().optional().or(z.literal('')),
    // Coerce to number if present, otherwise ignore empty string
    SubmittedPrice: z.union([z.coerce.number(), z.literal('')]).optional().transform(val => val === '' ? undefined : val),
});

export async function POST(request: Request) {
    try {
        const { data } = await request.json();

        if (!Array.isArray(data)) {
            return NextResponse.json({ error: 'Invalid payload format. Expected array of records.' }, { status: 400 });
        }

        let successCount = 0;
        let errors: string[] = [];

        // Process chunk sequentially to avoid race conditions on upsert creation, or use transactions
        // Since prisma upsert is safe but we want to relate things carefully
        for (const [index, rawRow] of data.entries()) {
            try {
                // Map common column name variations
                const row = { ...rawRow };
                const companyName = row.CompanyName || row['Company Name'] || row['GC Name'] || row.Company || '';
                const projectName = row.ProjectName || row['Project Name'] || row.Project || '';
                const projectID = row.ProjectID || row['Project ID'] || (projectName ? projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') : '');
                const contactName = row.ContactName || row['Contact Name'] || row['Contact Person'] || row.Contact || row['Invited By'] || row['invited by'] || '';
                const contactEmail = row.ContactEmail || row['Contact Email'] || row['contact email'] || row.Email || '';

                let invitedDate = row.InvitedDate || row['Invited Date'] || row.date || row.Date || row['invited date'] || '';
                if (typeof invitedDate === 'string' && invitedDate.match(/^\d{4}-[a-zA-Z]+$/)) {
                    const [year, monthStr] = invitedDate.split('-');
                    const objDate = new Date(`${monthStr} 1, 2000`);
                    if (!isNaN(objDate.getTime())) {
                        const monthIndex = objDate.getMonth() + 1;
                        invitedDate = `${year}-${monthIndex.toString().padStart(2, '0')}-01`;
                    }
                }

                let submittedPrice = row.SubmittedPrice || row['Submitted Price'] || row['Price Submitted'] || row['Price submited'] || row.Price || row.price || row['price submitted'] || '';
                if (typeof submittedPrice === 'string') {
                    submittedPrice = submittedPrice.replace(/[^0-9.-]+/g, ""); // remove $ and commas
                }

                const mappedData = {
                    CompanyName: companyName,
                    ProjectName: projectName,
                    ProjectID: projectID,
                    ContactName: contactName,
                    ContactEmail: contactEmail,
                    InvitedDate: invitedDate,
                    SubmittedPrice: submittedPrice
                };

                const parsed = importRowSchema.parse(mappedData);

                // Safe date parsing to avoid Prisma crashing on Invalid Date
                let validInvitedDate = null;
                if (parsed.InvitedDate) {
                    const d = new Date(parsed.InvitedDate);
                    if (!isNaN(d.getTime())) validInvitedDate = d;
                }

                // Normalize company name (lowercase, strip special chars)
                const normalizedName = parsed.CompanyName.toLowerCase().replace(/[^a-z0-9]/g, '');

                // 1. Upsert Company
                const company = await prisma.company.upsert({
                    where: { normalized_name: normalizedName },
                    update: { name: parsed.CompanyName }, // update exact casing if changed
                    create: {
                        name: parsed.CompanyName,
                        normalized_name: normalizedName,
                    }
                });

                // 2. Upsert Contact (always create at least one to satisfy FeedbackItem constraints)
                let contactId = null;
                const safeContactName = parsed.ContactName ? parsed.ContactName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'estimator';
                const emailToUse = parsed.ContactEmail ? parsed.ContactEmail.toLowerCase() : `${safeContactName}-${company.id}@example.com`;
                const contact = await prisma.contact.upsert({
                    where: { email: emailToUse },
                    update: {
                        name: parsed.ContactName || 'Estimator',
                        companyId: company.id
                    },
                    create: {
                        email: emailToUse,
                        name: parsed.ContactName || 'Estimator',
                        companyId: company.id
                    }
                });
                contactId = contact.id;

                // 3. Upsert Project
                const project = await prisma.project.upsert({
                    where: { project_unique_id: parsed.ProjectID },
                    update: { project_name: parsed.ProjectName },
                    create: {
                        project_unique_id: parsed.ProjectID,
                        project_name: parsed.ProjectName,
                    }
                });

                // 4. Create or Update CompanyProjectInvite
                await prisma.companyProjectInvite.upsert({
                    where: {
                        companyId_projectId: {
                            companyId: company.id,
                            projectId: project.id
                        }
                    },
                    update: {
                        contactId: contactId, // Update the contact relationship
                        invited_date: validInvitedDate,
                        submitted_price: parsed.SubmittedPrice || null,
                    },
                    create: {
                        companyId: company.id,
                        projectId: project.id,
                        contactId: contactId, // Insert the contact relationship
                        invited_date: validInvitedDate,
                        submitted_price: parsed.SubmittedPrice || null,
                    }
                });

                successCount++;
            } catch (err: any) {
                errors.push(`Row ${index + 1}: ${err.message || 'Validation/DB error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: successCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
