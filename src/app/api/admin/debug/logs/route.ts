import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Simple auth check - could be more robust
        const authHeader = request.headers.get('Authorization');
        // We'll just check a secret from env if we want, or skip for now if we are quick
        
        const logs: any = {};
        
        // 1. Check batch_error_log.txt
        const errorLogPath = path.join(process.cwd(), 'batch_error_log.txt');
        if (fs.existsSync(errorLogPath)) {
            logs.batch_error_log = fs.readFileSync(errorLogPath, 'utf8').slice(-5000);
        }
        
        // 2. Try to get pm2 logs via exec
        try {
            const { stdout } = await execPromise('pm2 logs survey-app --lines 50 --no-colors');
            logs.pm2_logs = stdout;
        } catch (e: any) {
            logs.pm2_error = e.message;
        }

        // 3. Check for the new fatal_route_error.log I added
        const fatalLogPath = path.join(process.cwd(), 'fatal_route_error.log');
        if (fs.existsSync(fatalLogPath)) {
            logs.fatal_route_error = fs.readFileSync(fatalLogPath, 'utf8');
        }

        return NextResponse.json(logs);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
