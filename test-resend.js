const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config();

async function testResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY not found in .env');
        return;
    }

    const resend = new Resend(apiKey);
    
    console.log('Testing with onboarding@resend.dev...');
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'mike@moderngrains.com',
            subject: 'Resend Test - Onboarding',
            html: '<p>This is a test from onboarding@resend.dev</p>'
        });
        if (error) {
            console.error('Onboarding Test Failed:', error);
        } else {
            console.log('Onboarding Test Success:', data);
        }
    } catch (e) {
        console.error('Onboarding Test Exception:', e);
    }

    console.log('\nTesting with info@moderngrains.com...');
    try {
        const { data: data2, error: error2 } = await resend.emails.send({
            from: 'info@moderngrains.com',
            to: 'mike@moderngrains.com',
            subject: 'Resend Test - Custom Domain',
            html: '<p>This is a test from info@moderngrains.com</p>'
        });
        if (error2) {
            console.error('Custom Domain Test Failed:', error2);
        } else {
            console.log('Custom Domain Test Success:', data2);
        }
    } catch (e) {
        console.error('Custom Domain Test Exception:', e);
    }
}

testResend();
