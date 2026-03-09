import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        // In a real app, hash and check against a DB. For this demo, check against ENV.
        if (password === (process.env.ADMIN_PASSWORD || 'admin123')) {
            const token = await signAdminToken();

            const response = NextResponse.json({ success: true });
            response.cookies.set({
                name: 'admin_token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
