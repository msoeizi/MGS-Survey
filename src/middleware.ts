import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from './lib/auth';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Protect Admin UI Routes
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const token = request.cookies.get('admin_token')?.value;
        if (!token || !(await verifyAdminToken(token))) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin/login';
            return NextResponse.redirect(url);
        }
    }

    // Protect Admin API Routes (exclude login and system/server-to-server routes)
    if (pathname.startsWith('/api/admin') 
        && pathname !== '/api/admin/login'
        && !pathname.startsWith('/api/admin/system')) {
        const token = request.cookies.get('admin_token')?.value;
        if (!token || !(await verifyAdminToken(token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
