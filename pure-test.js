const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('@prisma/client');

async function test() {
    try {
        const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
        const prisma = new PrismaClient({ adapter });
        const count = await prisma.company.count();
        console.log("SUCCESS OVERRIDE, company count:", count);
    } catch (e) {
        console.error("ERROR CAUGHT NATIVE:");
        console.error(e);
    }
}
test();
