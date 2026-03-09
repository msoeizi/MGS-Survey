const { createClient } = require('@libsql/client');

try {
    console.log("Testing file:./dev.db");
    const c1 = createClient({ url: 'file:./dev.db' });
    console.log("Success 1");
} catch (e) {
    console.error("Fail 1:", e.message);
}

try {
    console.log("Testing file:dev.db");
    const c2 = createClient({ url: 'file:dev.db' });
    console.log("Success 2");
} catch (e) {
    console.error("Fail 2:", e.message);
}
