import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Authenticate (Basic safety check)
        const authHeader = request.headers.get('authorization');
        if (process.env.AUTH_SECRET && authHeader !== `Bearer ${process.env.AUTH_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch latest failed email deliveries
        const failedDeliveries = await prisma.emailDelivery.findMany({
            where: { status: 'Failed' },
            orderBy: { id: 'desc' },
            take: 10,
            include: { campaign: true, token: { include: { contact: true } } }
        });

        const scheduledCampaigns = await prisma.emailCampaign.findMany({
            where: { status: 'Scheduled' }
        });

        // 2. Try to read pm2 logs if accessible
        let pm2Logs = 'Not accessible';
        try {
            const possiblePm2Path = '/root/.pm2/logs/survey-cron-out.log';
            if (fs.existsSync(possiblePm2Path)) {
                const logs = fs.readFileSync(possiblePm2Path, 'utf8');
                pm2Logs = logs.split('\n').slice(-50).join('\n'); // last 50 lines
            } else {
                pm2Logs = 'File not found at ' + possiblePm2Path;
                // Try fetching user home dir
                const homeDir = process.env.HOME || process.env.USERPROFILE || '';
                const altPath = path.join(homeDir, '.pm2/logs/survey-cron-out.log');
                if (fs.existsSync(altPath)) {
                    pm2Logs = fs.readFileSync(altPath, 'utf8').split('\n').slice(-50).join('\n');
                } else if (fs.existsSync(path.join(homeDir, '.pm2/logs/survey-cron-error.log'))) {
                    pm2Logs += '\nError Log exist: ' + fs.readFileSync(path.join(homeDir, '.pm2/logs/survey-cron-error.log'), 'utf8').split('\n').slice(-20).join('\n');
                }
            }
        } catch (e: any) {
            pm2Logs = e.message;
        }

        // 3. Count total unique contacts and how many were sent
        const tokens = await prisma.accessToken.findMany({
            include: { deliveries: true }
        });
        
        let totalContacts = tokens.length;
        let contactsReceivedEmail = 0;
        let contactsPending = 0;
        
        tokens.forEach(t => {
            const hasSent = t.email_sent_at !== null || t.deliveries.some(d => d.status === 'Sent' || d.status === 'Delivered');
            if (hasSent) contactsReceivedEmail++;
            else contactsPending++;
        });

        return NextResponse.json({
            deliveryVerification: {
                totalContacts,
                contactsReceivedEmail,
                contactsPending,
                successRate: totalContacts > 0 ? (contactsReceivedEmail / totalContacts) * 100 : 0
            },
            failures: failedDeliveries.map((d: any) => ({
                id: d.id,
                contact: d.token.contact?.email,
                campaign: d.campaign?.name,
                campaignStatus: d.campaign?.status
            })),
            scheduledCampaigns,
            pm2Logs,
            time: new Date().toISOString()
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
