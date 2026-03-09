"use client"
import { useEffect, useState } from 'react';
import { FolderKanban, Search } from 'lucide-react';

type Project = {
    id: string;
    project_unique_id: string;
    project_name: string;
    invited_date: string | null;
    createdAt: string;
    _count: { companyInvites: number };
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/admin/projects')
            .then(res => res.json())
            .then(data => {
                setProjects(data);
                setLoading(false);
            });
    }, []);

    const filtered = projects.filter(p => p.project_name.toLowerCase().includes(search.toLowerCase()) || p.project_unique_id.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FolderKanban className="text-secondary w-8 h-8" />
                        Projects Directory
                    </h1>
                    <p className="text-secondary mt-1">Manage tendered projects and tracking IDs.</p>
                </div>
            </div>

            <div className="glass-panel p-6">
                <div className="flex justify-between mb-6">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                        <input
                            type="text"
                            placeholder="Search by project name or ID..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-24 bg-surface rounded w-full"></div></div></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-surface-border">
                                    <th className="py-3 px-4 font-semibold text-secondary">Project Name</th>
                                    <th className="py-3 px-4 font-semibold text-secondary">Unique ID</th>
                                    <th className="py-3 px-4 font-semibold text-secondary">Companies Invited</th>
                                    <th className="py-3 px-4 font-semibold text-secondary">Created At</th>
                                    <th className="py-3 px-4 font-semibold text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(proj => (
                                    <tr key={proj.id} className="border-b border-surface-border hover:bg-surface/50 transition-colors">
                                        <td className="py-4 px-4 font-medium">{proj.project_name}</td>
                                        <td className="py-4 px-4 text-xs bg-surface-border text-primary font-mono rounded px-2 m-4 inline-block">{proj.project_unique_id}</td>
                                        <td className="py-4 px-4">
                                            <span className="bg-secondary/30 text-secondary px-2 py-1 rounded text-sm font-semibold">{proj._count.companyInvites}</span>
                                        </td>
                                        <td className="py-4 px-4 text-secondary text-sm">{new Date(proj.createdAt).toLocaleDateString()}</td>
                                        <td className="py-4 px-4">
                                            <button className="text-sm text-accent hover:underline">View details</button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-secondary">No projects matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
