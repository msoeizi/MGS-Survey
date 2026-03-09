import prisma from './src/lib/prisma';

async function resetDB() {
    console.log("Wiping all dynamic data to test distinct estimator linking...");
    await prisma.accessToken.deleteMany();
    await prisma.generalFeedback.deleteMany();
    await prisma.feedbackItem.deleteMany();
    await prisma.companyProjectInvite.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.project.deleteMany();
    await prisma.company.deleteMany();
    console.log("Database wiped perfectly.");
}

resetDB().catch(console.error).finally(() => prisma.$disconnect());
