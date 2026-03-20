const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function debug() {
    const campaign = await prisma.emailCampaign.findFirst({
        orderBy: { sent_at: 'desc' },
        include: { 
            batch: true,
            deliveries: { include: { token: { include: { contact: true } } } }
        }
    });

    if (!campaign) {
        fs.writeFileSync('diagnostic_results.json', JSON.stringify({ error: "No campaign found" }));
        return;
    }

    const allTokens = await prisma.accessToken.findMany({
        where: { batchId: campaign.batchId },
        include: { contact: true, company: true }
    });

    const tokensWithoutDelivery = allTokens.filter(t => !campaign.deliveries.some(d => d.tokenId === t.id));
    
    const results = {
        campaignId: campaign.id,
        sentCount: campaign.deliveries.length,
        totalExpected: allTokens.length,
        skippedCount: tokensWithoutDelivery.length,
        skipped: tokensWithoutDelivery.map(t => ({
            company: t.company?.name || 'Unknown',
            contact: t.contact?.name || 'Unknown',
            email: t.contact?.email || 'MISSING'
        }))
    };

    fs.writeFileSync('diagnostic_results.json', JSON.stringify(results, null, 2));
    console.log("Diagnostic complete. Results written to diagnostic_results.json");
}

debug().finally(() => prisma.$disconnect());
