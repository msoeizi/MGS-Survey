const { createClient } = require('@libsql/client');

async function main() {
    const client = createClient({ url: 'file:./dev.db' });

    try {
        const query = `
            SELECT 
                ec.id as campaign_id,
                ec.name as campaign_name,
                ec.batchId as campaign_batch_id,
                at.id as token_id,
                at.batchId as token_batch_id,
                ed.status
            FROM EmailDelivery ed
            JOIN EmailCampaign ec ON ed.campaignId = ec.id
            JOIN AccessToken at ON ed.tokenId = at.id
            WHERE ed.status = 'Failed'
            LIMIT 20
        `;
        const result = await client.execute(query);
        console.log('Failing Campaign Token Mappings:');
        result.rows.forEach(row => {
            console.log(`Campaign: ${row.campaign_name}, CampaignBatch: ${row.campaign_batch_id}, Token: ${row.token_id}, TokenBatch: ${row.token_batch_id}`);
            if (row.campaign_batch_id !== row.token_batch_id) {
                console.log('  ⚠️ WARNING: Batch ID mismatch!');
            }
        });
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
