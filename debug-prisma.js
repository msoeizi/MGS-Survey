const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

const dbUrl = 'file:./dev.db';
const client = createClient({ url: dbUrl });
const adapter = new PrismaLibSql(client);
const prisma = new PrismaClient({ adapter });

async function debug() {
    try {
        console.log('Testing LibSql Client directly...');
        const rawResult = await client.execute('SELECT name, status FROM EmailCampaign ORDER BY updatedAt DESC LIMIT 3');
        console.log('Raw Campaigns:', JSON.stringify(rawResult.rows, null, 2));

        console.log('Fetching latest campaigns via Prisma...');
        const campaigns = await prisma.emailCampaign.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 3
        });
        console.log('Prisma Campaigns:', JSON.stringify(campaigns, null, 2));

    } catch (e) {
        console.error('Debug Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
