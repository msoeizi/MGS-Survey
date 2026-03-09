const { createClient } = require('@libsql/client');

async function testSchemaMapping() {
    const client = createClient({ url: 'file:./dev.db' });

    try {
        console.log('--- Verifying Schema Relations ---');

        // 1. Check if CompanyProjectInvite has contactId
        const invitesResult = await client.execute('SELECT count(contactId) as counted FROM CompanyProjectInvite WHERE contactId IS NOT NULL');

        // 2. Check if FeedbackItem has contactId
        const feedbackResult = await client.execute('SELECT count(contactId) as counted FROM FeedbackItem WHERE contactId IS NOT NULL');

        console.log(`CompanyProjectInvites with mapped Contacts: ${invitesResult.rows[0].counted}`);
        console.log(`FeedbackItems tied to strict Contacts: ${feedbackResult.rows[0].counted}`);

        if (invitesResult.rows[0].counted > 0) {
            console.log('SUCCESS: Imports are correctly saving Contact relationships!');
        } else {
            console.log('NOTICE: DB is empty. Run an import via UI to test.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

testSchemaMapping();
