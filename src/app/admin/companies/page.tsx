"use client"
import { useEffect, useState } from 'react';
import { Building2, Search } from 'lucide-react';

type Company = {
    id: string;
    name: string;
    normalized_name: string;
    domain: string | null;
    createdAt: string;
    _count: { contacts: number; projectInvites: number };
};

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/admin/companies')
            .then(res => res.json())
            .then(data => {
                setCompanies(data);
                setLoading(false);
            });
    }, []);

    const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Building2 className="text-primary w-8 h-8" />
                        Companies Directory
                    </h1>
                    <p className="text-secondary mt-1">Manage invited companies and external participants.</p>
                </div>
            </div>

            <div className="glass-panel p-6">
                <div className="flex justify-between mb-6">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                        <input
                            type="text"
                            placeholder="Search companies by name..."
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
                                    <th className="py-3 px-4 font-semibold text-secondary">Company Name</th>
                                    <th className="py-3 px-4 font-semibold text-secondary">Domain</th>
                                    <th className="py-3 px-4 font-semibold text-secondary">Contacts</th>
                                    <th className="py-3 px-4 font-semibold text-secondary">Project Invites</th>
                                    <th className="py-3 px-4 font-semibold text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(company => (
                                    <tr key={company.id} className="border-b border-surface-border hover:bg-surface/50 transition-colors">
                                        <td className="py-4 px-4 font-medium">{company.name}</td>
                                        <td className="py-4 px-4 text-xs bg-surface-border text-primary font-mono rounded px-2 m-4 inline-block">{company.domain || 'N/A'}</td>
                                        <td className="py-4 px-4">
                                            <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm font-semibold">{company._count.contacts}</span>
                                        </td>
                                        <td className="py-4 px-4 text-secondary">{company._count.projectInvites}</td>
                                        <td className="py-4 px-4">
                                            <button className="text-sm text-accent hover:underline">View details</button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-secondary">No companies matching your search.</td>
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
