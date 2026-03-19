const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./dev.db' });

async function testWrite() {
    try {
        console.log('Testing write to EmailDelivery...');
        // Just a dummy query to see if we can execute anything
        const result = await client.execute('SELECT count(*) as count FROM EmailDelivery');
        console.log('Current count:', result.rows[0].count);
        
        console.log('Attempting to read last 5 entries...');
        const deliveries = await client.execute('SELECT * FROM EmailDelivery ORDER BY id DESC LIMIT 5');
        console.log('Last 5 deliveries:', JSON.stringify(deliveries.rows, null, 2));
    } catch (e) {
        console.error('Database Error:', e);
    }
}

testWrite();
