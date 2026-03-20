
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const tokens = await prisma.accessToken.findMany({
            include: {
                contact: true
            }
        });

        console.log(`Total Tokens: ${tokens.length}`);
        
        const noContact = tokens.filter(t => !t.contact);
        const noEmail = tokens.filter(t => t.contact && !t.contact.email);
        const emptyEmail = tokens.filter(t => t.contact && t.contact.email === '');

        console.log(`- Tokens without contact: ${noContact.length}`);
        console.log(`- Tokens with contact but no email field: ${noEmail.length}`);
        console.log(`- Tokens with empty email string: ${emptyEmail.length}`);

        if (noContact.length > 0) {
            console.log('\nSample No Contact IDs:', noContact.slice(0, 5).map(t => t.id));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
