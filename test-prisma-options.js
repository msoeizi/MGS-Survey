const { PrismaClient } = require('@prisma/client');
try {
    const p1 = new PrismaClient({ datasourceUrl: 'file:./dev.db' });
    console.log("datasourceUrl works");
} catch (e) {
    console.log("datasourceUrl error:", e.message);
}
try {
    const p2 = new PrismaClient({ url: 'file:./dev.db' });
    console.log("url works");
} catch (e) {
    console.log("url error:", e.message);
}
