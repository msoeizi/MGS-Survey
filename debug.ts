import prisma from './src/lib/prisma';

async function check() {
    console.log("Fetching Contacts...");
    const contacts = await prisma.contact.findMany({
        include: { company: true }
    });
    console.log(`Total contacts: ${contacts.length}`);

    // Check for duplicates
    const nameMap = new Map();
    for (const c of contacts) {
        const key = `${c.companyId}-${c.name}`;
        if (!nameMap.has(key)) nameMap.set(key, []);
        nameMap.get(key).push(c.email);
    }

    let dups = 0;
    for (const [key, emails] of nameMap.entries()) {
        if (emails.length > 1) {
            console.log(`Duplicate contact name: ${key.split('-')[1]}, Emails: ${emails.join(', ')}`);
            dups++;
        }
    }
    console.log(`Found ${dups} estimators with duplicate records (differing by email)`);

    // Check feedback items
    const fb = await prisma.feedbackItem.count();
    console.log(`Total feedback items: ${fb}`);

    // Check invites
    const invites = await prisma.companyProjectInvite.count();
    console.log(`Total CompanyProjectInvites: ${invites}`);

    // Check tokens
    const tokens = await prisma.accessToken.findMany({
        include: { contact: true, company: true }
    });
    console.log(`Total tokens: ${tokens.length}`);

    const tokenMap = new Map();
    for (const t of tokens) {
        if (!t.contact) continue;
        const key = `${t.batchId}-${t.contactId}`;
        if (!tokenMap.has(key)) tokenMap.set(key, 0);
        tokenMap.set(key, tokenMap.get(key) + 1);
    }

    let dupTokens = 0;
    for (const [key, count] of tokenMap.entries()) {
        if (count > 1) {
            console.log(`Duplicate token for contactId: ${key.split('-')[1]}, Count: ${count}`);
            dupTokens++;
        }
    }
    console.log(`Found ${dupTokens} contacts with duplicate tokens in the same batch`);

    // Let's also check if any company has the same project invite multiple times, which shouldn't be possible because it's a unique constraint, but we can verify.
}

check().catch(console.error).finally(() => prisma.$disconnect());
