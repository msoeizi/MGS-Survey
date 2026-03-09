import prisma from './src/lib/prisma';

async function dump() {
    const tokens = await prisma.accessToken.findMany({
        include: { contact: true, company: true }
    });

    const tokenMap = new Map();
    for (const t of tokens) {
        if (!t.contact) continue;
        const key = `${t.batchId}-${t.contactId}`;
        if (!tokenMap.has(key)) tokenMap.set(key, []);
        tokenMap.get(key).push(t);
    }

    let found = false;
    for (const [key, tarr] of tokenMap.entries()) {
        if (tarr.length > 1) {
            console.log(`\nDuplicate tokens for contact ${key} (${tarr[0].contact?.name}):`);
            tarr.forEach((t: any) => {
                console.log(` - Token ID: ${t.id}, Created: ${t.created_at}, Hash: ${t.tokenHash.substring(0, 15)}...`);
            });
            found = true;
            break; // just show one example
        }
    }

    if (!found) console.log("No exact duplicates found.");
}

dump().catch(console.error).finally(() => prisma.$disconnect());
