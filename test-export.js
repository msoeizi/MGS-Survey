const { createClient } = require('@libsql/client');

async function testExportLinks() {
    const client = createClient({ url: 'file:./dev.db' });

    try {
        console.log('--- Simulating Link Export ---');

        const batchId = 'TX0DlJoOwxUJnv9KBTlAk';

        const feedbackItemsResult = await client.execute({
            sql: 'SELECT companyId FROM FeedbackItem WHERE batchId = ?',
            args: [batchId]
        });

        const companyIdsRaw = feedbackItemsResult.rows.map(r => r.companyId);
        const uniqueCompanyIds = [...new Set(companyIdsRaw)];

        console.log(`Found ${uniqueCompanyIds.length} unique companies tied to Batch ${batchId}`);

        if (uniqueCompanyIds.length > 0) {
            console.log('SUCCESS: The export script will find companies and generate links.');
        } else {
            console.log('FAIL: Export script would still generate an empty CSV.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

testExportLinks();
