const { createClient } = require('@libsql/client');

async function main() {
    const client = createClient({ url: 'file:./dev.db' });

    try {
        const query = `
            SELECT 
                ed.campaignId, 
                ed.status, 
                ed.sent_at, 
                ec.name as campaign_name,
                ec.subject,
                c.email as contact_email
            FROM EmailDelivery ed
            JOIN EmailCampaign ec ON ed.campaignId = ec.id
            JOIN AccessToken at ON ed.tokenId = at.id
            JOIN Contact c ON at.contactId = c.id
            ORDER BY ed.sent_at DESC
            LIMIT 20
        `;
        const result = await client.execute(query);
        console.log('Detailed Email Deliveries:');
        result.rows.forEach(row => {
            console.log(`Campaign: ${row.campaign_name}, Status: ${row.status}, SentAt: ${row.sent_at}, Email: ${row.contact_email}`);
        });
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
