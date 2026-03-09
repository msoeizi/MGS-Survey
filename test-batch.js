const http = require('http');

const data = JSON.stringify({
    name: 'Verification Batch',
    open_at: new Date().toISOString()
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/batches',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
