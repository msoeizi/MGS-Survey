const { createClient } = require('@libsql/client');

async function main() {
    const client = createClient({ url: 'file:./dev.db' });

    try {
        const result = await client.execute('SELECT COUNT(*) as count FROM CompanyProjectInvite');
        console.log('CompanyProjectInvite count:', result.rows[0].count);

        const companies = await client.execute('SELECT COUNT(*) as count FROM Company');
        console.log('Company count:', companies.rows[0].count);

        const projects = await client.execute('SELECT COUNT(*) as count FROM Project');
        console.log('Project count:', projects.rows[0].count);

        const batches = await client.execute('SELECT COUNT(*) as count FROM Batch');
        console.log('Batch count:', batches.rows[0].count);

        const feedbackItems = await client.execute('SELECT COUNT(*) as count FROM FeedbackItem');
        console.log('FeedbackItem count:', feedbackItems.rows[0].count);
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
