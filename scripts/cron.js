require('dotenv').config({ path: '.env' });
const http = require('http');
const https = require('https');

// Get configuration from environment or defaults
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'http:' : 'http:'; // Typically Next.js runs behind an Nginx proxy, so local PM2 hits http://127.0.0.1:3000
const API_PATH = '/api/admin/system/cron';
const AUTH_SECRET = process.env.AUTH_SECRET || '';

const CRON_URL = `${PROTOCOL}//${HOST}:${PORT}${API_PATH}`;

console.log(`[Survey-Cron] Worker started. Monitoring scheduled campaigns...`);
console.log(`[Survey-Cron] Endpoint: ${CRON_URL}`);

let isRunning = false;

function triggerCron() {
    if (isRunning) {
        console.log(`[Survey-Cron] Previous tick still running. Skipping this cycle.`);
        return;
    }

    isRunning = true;
    console.log(`[Survey-Cron] [${new Date().toISOString()}] Ticking cron endpoint...`);

    const reqOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_SECRET}`
        }
    };

    const client = CRON_URL.startsWith('https') ? https : http;

    const req = client.request(CRON_URL, reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            isRunning = false;
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const json = JSON.parse(data);
                    if (json.message && json.message !== 'No campaigns due for dispatch.') {
                        console.log(`[Survey-Cron] Success:`, json.message);
                    }
                } catch (e) {
                    console.log(`[Survey-Cron] Success (${res.statusCode}) but unparseable response.`);
                }
            } else {
                console.error(`[Survey-Cron] Error: Server returned status ${res.statusCode}. Output: ${data}`);
            }
        });
    });

    req.on('error', (e) => {
        isRunning = false;
        console.error(`[Survey-Cron] Network Error: ${e.message}`);
    });

    req.end();
}

// Run immediately on boot
triggerCron();

// Then run every 60 seconds
setInterval(triggerCron, 60000);
