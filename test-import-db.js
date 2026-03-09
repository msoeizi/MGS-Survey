const Papa = require('papaparse');
const fs = require('fs');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const importRowSchema = z.object({
    CompanyName: z.string().min(1, "Company Name required"),
    ContactName: z.string().optional().or(z.literal('')),
    ContactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
    ProjectID: z.string().min(1, "Project ID required"),
    ProjectName: z.string().min(1, "Project Name required"),
    InvitedDate: z.string().optional().or(z.literal('')),
    SubmittedPrice: z.union([z.coerce.number(), z.literal('')]).optional().transform(val => val === '' ? undefined : val),
});

const file = fs.readFileSync('C:/Users/User/Downloads/MGS survey - Sheet1.csv', 'utf8');

Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
        let successCount = 0;
        let errors = [];

        for (const [index, rawRow] of results.data.entries()) {
            try {
                const row = { ...rawRow };
                const companyName = row.CompanyName || row['GC Name'] || row.Company || '';
                const projectName = row.ProjectName || row['Project Name'] || row.Project || '';
                const projectID = row.ProjectID || row['Project ID'] || (projectName ? projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') : '');
                const contactName = row.ContactName || row['Contact Person'] || row.Contact || '';
                const contactEmail = row.ContactEmail || row['contact email'] || row.Email || '';

                let invitedDate = row.InvitedDate || row.date || row.Date || '';
                if (typeof invitedDate === 'string' && invitedDate.match(/^\d{4}-[a-zA-Z]+$/)) {
                    const [year, monthStr] = invitedDate.split('-');
                    const objDate = new Date(`${monthStr} 1, 2000`);
                    if (!isNaN(objDate.getTime())) {
                        const monthIndex = objDate.getMonth() + 1;
                        invitedDate = `${year}-${monthIndex.toString().padStart(2, '0')}-01`;
                    }
                }

                let submittedPrice = row.SubmittedPrice || row.Price || row.price || '';
                if (typeof submittedPrice === 'string') {
                    submittedPrice = submittedPrice.replace(/[^0-9.-]+/g, "");
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

                let validInvitedDate = null;
                if (parsed.InvitedDate) {
                    const d = new Date(parsed.InvitedDate);
                    if (!isNaN(d.getTime())) validInvitedDate = d;
                }

                const normalizedName = parsed.CompanyName.toLowerCase().replace(/[^a-z0-9]/g, '');

                const company = await prisma.company.upsert({
                    where: { normalized_name: normalizedName },
                    update: { name: parsed.CompanyName },
                    create: {
                        name: parsed.CompanyName,
                        normalized_name: normalizedName,
                    }
                });

                if (parsed.ContactEmail) {
                    await prisma.contact.upsert({
                        where: { email: parsed.ContactEmail.toLowerCase() },
                        update: {
                            name: parsed.ContactName || 'Unknown',
                            companyId: company.id
                        },
                        create: {
                            email: parsed.ContactEmail.toLowerCase(),
                            name: parsed.ContactName || 'Unknown',
                            companyId: company.id
                        }
                    });
                }

                const project = await prisma.project.upsert({
                    where: { project_unique_id: parsed.ProjectID },
                    update: { project_name: parsed.ProjectName },
                    create: {
                        project_unique_id: parsed.ProjectID,
                        project_name: parsed.ProjectName,
                    }
                });

                await prisma.companyProjectInvite.upsert({
                    where: {
                        companyId_projectId: {
                            companyId: company.id,
                            projectId: project.id
                        }
                    },
                    update: {
                        invited_date: validInvitedDate,
                        submitted_price: parsed.SubmittedPrice || null,
                    },
                    create: {
                        companyId: company.id,
                        projectId: project.id,
                        invited_date: validInvitedDate,
                        submitted_price: parsed.SubmittedPrice || null,
                    }
                });

                successCount++;
            } catch (err) {
                errors.push(`Row ${index + 1}: ${err.message || err}`);
            }
        }

        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errors.length}`);
        if (errors.length > 0) console.log(errors[0]);
        await prisma.$disconnect();
    }
});
