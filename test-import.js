const Papa = require('papaparse');
const fs = require('fs');
const { z } = require('zod');

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
    complete: (results) => {
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
            } catch (err) {
                errors.push(`Row ${index + 1}: ${err.message}`);
                // console.log(err);
            }
        }
        console.log(`Errors: ${errors.length}`);
        if (errors.length > 0) console.log(errors[0]);
    }
});
