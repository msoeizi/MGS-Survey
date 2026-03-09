const Papa = require('papaparse');
const fs = require('fs');

const file = fs.readFileSync('C:/Users/User/Downloads/MGS survey - Sheet1.csv', 'utf8');

Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
        try {
            // First login to get the cookie
            const loginRes = await fetch('http://localhost:3000/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: 'admin123' })
            });
            let loginCookies = loginRes.headers.get('set-cookie');
            // Next.js might return multiple cookies separated by comma, but fetch combines them.
            console.log('Login status:', loginRes.status);

            // Now import
            console.log('Attempting import to localhost:3000...');
            let res = await fetch('http://localhost:3000/api/admin/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': loginCookies || ''
                },
                body: JSON.stringify({ data: results.data })
            });

            if (res.status !== 200) {
                console.log('Failed on 3000. Trying 3000...');
                const loginRes2 = await fetch('http://localhost:3000/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: 'admin123' })
                });
                loginCookies = loginRes2.headers.get('set-cookie');
                res = await fetch('http://localhost:3000/api/admin/import', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': loginCookies || ''
                    },
                    body: JSON.stringify({ data: results.data })
                });
            }

            const data = await res.json();
            console.log('Final Status:', res.status);
            console.log('Response:', data);
        } catch (e) {
            console.error('Fetch failed:', e.message);
        }
    }
});
