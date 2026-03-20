const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'file:dev.db',
});

async function check() {
  try {
    const rs = await client.execute("SELECT status, count(*) FROM EmailDelivery GROUP BY status");
    console.log(`Deliveries by status:`);
    for (const row of rs.rows) {
      console.log(`${row.status}: ${row['count(*)']}`);
    }
  } catch (e) {
    console.error(e);
  }
}

check();
