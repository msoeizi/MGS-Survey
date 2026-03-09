"use client"
import { useEffect, useState } from 'react';
import { Users, Building2, FolderKanban, Layers, FileText } from 'lucide-react';

type Stats = {
    companies: number;
    projects: number;
    contacts: number;
    batches: number;
    feedback: number;
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-surface rounded w-3/4"></div></div></div>;

    const statCards = [
        { title: 'Total Companies', value: stats?.companies || 0, icon: <Building2 className="text-primary w-8 h-8" /> },
        { title: 'Total Projects', value: stats?.projects || 0, icon: <FolderKanban className="text-secondary w-8 h-8" /> },
        { title: 'Total Contacts', value: stats?.contacts || 0, icon: <Users className="text-accent w-8 h-8" /> },
        { title: 'Survey Batches', value: stats?.batches || 0, icon: <Layers className="text-success w-8 h-8" /> },
        { title: 'Feedback Items', value: stats?.feedback || 0, icon: <FileText className="text-danger w-8 h-8" /> },
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="text-4xl font-bold mb-2">Dashboard overview</h1>
            <p className="text-secondary mb-8">Welcome to the Tendered Projects Feedback Survey admin portal.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, idx) => (
                    <div key={idx} className="glass-card flex items-center justify-between hover:shadow-glow transition-all">
                        <div>
                            <p className="text-secondary font-medium text-sm mb-1">{card.title}</p>
                            <h2 className="text-3xl font-bold">{card.value}</h2>
                        </div>
                        <div className="p-3 bg-surface rounded-full shadow-inner">
                            {card.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 glass-panel p-6">
                <h3 className="text-xl font-semibold mb-4 border-b border-surface-border pb-2">Quick Actions</h3>
                <div className="flex gap-4">
                    <a href="/admin/import" className="btn btn-primary flex items-center gap-2">
                        <FolderKanban className="w-5 h-5" /> Import Data
                    </a>
                    <a href="/admin/batches" className="btn btn-secondary flex items-center gap-2">
                        <Layers className="w-5 h-5" /> Manage Batches
                    </a>
                </div>
            </div>
        </div>
    );
}
