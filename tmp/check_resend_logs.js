
const https = require('https');

function checkLogs() {
    const apiKey = 're_CJbBGdGK_cCi1GL5KT97smtzmz5MsELj3';
    const options = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (!data.data) {
                    console.log('No data returned:', data);
                    return;
                }

                console.log(`Found ${data.data.length} recent emails.`);
                
                const stats = {};
                data.data.forEach(email => {
                    stats[email.last_event] = (stats[email.last_event] || 0) + 1;
                });

                console.log('\nSummary Groups:');
                console.log(JSON.stringify(stats, null, 2));

                console.log('\nLatest 40 emails:');
                data.data.slice(0, 40).forEach(email => {
                    console.log(`[${email.created_at}] To: ${email.to} | Status: ${email.last_event} | Id: ${email.id}`);
                });

            } catch (e) {
                console.error('Error parsing response:', e);
                console.log('Raw body:', body);
            }
        });
    });

    req.on('error', (e) => {
        console.error('Request error:', e);
    });

    req.end();
}

checkLogs();
