const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.count();
    const invites = await prisma.companyProjectInvite.count();
    const batches = await prisma.batch.findMany({
        include: {
            _count: {
                select: { feedbackItems: true }
            }
        }
    });

    console.log('Companies:', companies);
    console.log('Invites:', invites);
    console.log('Batches:', JSON.stringify(batches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
