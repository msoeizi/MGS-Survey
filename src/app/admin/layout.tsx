import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 glass-card border-none rounded-none border-r fixed h-full flex flex-col justify-between hidden md:flex">
                <div>
                    <div className="p-6 mb-4 mt-2 flex flex-col items-center justify-center border-b border-surface-border mx-4 pb-6">
                        <img src="/Images/Logo.png" alt="MGS Logo" className="w-24 mb-2 opacity-90" />
                        <h2 className="text-sm font-bold tracking-widest uppercase text-secondary">
                            Tender Surveys
                        </h2>
                    </div>

                    <nav className="flex flex-col gap-2 px-4">
                        <Link href="/admin" className="px-4 py-3 rounded-md text-sm font-medium hover:bg-surface-border transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/admin/batches" className="px-4 py-3 rounded-md text-sm font-medium hover:bg-surface-border transition-colors">
                            Batches & Links
                        </Link>
                        <Link href="/admin/companies" className="px-4 py-3 rounded-md text-sm font-medium hover:bg-surface-border transition-colors">
                            Companies
                        </Link>
                        <Link href="/admin/projects" className="px-4 py-3 rounded-md text-sm font-medium hover:bg-surface-border transition-colors">
                            Projects
                        </Link>
                        <Link href="/admin/import" className="px-4 py-3 rounded-md text-sm font-medium hover:bg-surface-border transition-colors text-accent">
                            Import Data
                        </Link>
                    </nav>
                </div>

                <div className="p-4 mb-4">
                    {/* Replace with API call to logout in the corresponding component or client wrapper */}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
