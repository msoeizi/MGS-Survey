const { createClient } = require('@libsql/client');

async function simulateBatchCreation() {
    const client = createClient({ url: 'file:./dev.db' });

    try {
        console.log('--- Simulating Batch Creation ---');

        // Use nanoid which is installed since it's used in the route
        const { nanoid } = await import('nanoid');

        // 1. Create a Batch
        const batchId = nanoid();
        console.log(`1. Creating Batch with ID: ${batchId}`);
        await client.execute({
            sql: 'INSERT INTO Batch (id, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
            args: [batchId, 'Test Simulation Batch 2', 'Open', new Date().toISOString(), new Date().toISOString()]
        });

        // 2. Fetch all CompanyProjectInvites
        console.log('2. Fetching CompanyProjectInvites...');
        const invitesResult = await client.execute('SELECT * FROM CompanyProjectInvite');
        const invites = invitesResult.rows;
        console.log(`-> Found ${invites.length} invites.`);

        // 3. Create FeedbackItem Drafts
        console.log('3. Attempting to create FeedbackItem Drafts...');

        let successCount = 0;
        let failCount = 0;

        for (const inv of invites) {
            try {
                const fid = nanoid();
                await client.execute({
                    sql: 'INSERT INTO FeedbackItem (id, batchId, companyId, projectId, status, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
                    args: [fid, batchId, inv.companyId, inv.projectId, 'Draft', new Date().toISOString()]
                });
                successCount++;
            } catch (err) {
                if (failCount === 0) console.error('First insertion failure reason:', err.message);
                failCount++;
            }
        }

        console.log(`-> FeedbackItems created: ${successCount} Success, ${failCount} Failed.`);

    } catch (e) {
        console.error('Fatal Error:', e);
    }
}

simulateBatchCreation();
