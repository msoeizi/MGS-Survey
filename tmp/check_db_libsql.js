const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'file:dev.db',
});

async function check() {
  try {
    const rs = await client.execute("SELECT c.email, a.id, a.batchId FROM AccessToken a LEFT JOIN Contact c ON a.contactId = c.id");
    let missing = 0;
    let total = rs.rows.length;
    let missingByBatch = {};

    for (const row of rs.rows) {
      if (!row.email) {
        missing++;
        missingByBatch[row.batchId] = (missingByBatch[row.batchId] || 0) + 1;
      }
    }
    console.log(`Total tokens across all batches: ${total}`);
    console.log(`Total tokens missing email: ${missing}`);
    console.log(`Missing by batch:`, missingByBatch);
  } catch (e) {
    console.error(e);
  }
}

check();
