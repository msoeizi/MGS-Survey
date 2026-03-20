const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'file:dev.db',
});

async function check() {
  try {
    const rs = await client.execute("SELECT status, sent_at FROM EmailDelivery");
    console.log(rs.rows);
  } catch (e) {
    console.error(e);
  }
}

check();
