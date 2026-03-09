"use client"
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DownloadCloud, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import Papa from 'papaparse';

type Batch = {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { feedbackItems: number };
};

export default function BatchDetailsPage() {
    const params = useParams();
    const [batch, setBatch] = useState<Batch | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // New state to hold explicit loaded links and feedback tracking
    const [links, setLinks] = useState<any[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(false);

    // New state for live results preview directly on page
    const [results, setResults] = useState<any[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);

    // Sorting states
    const [sortField, setSortField] = useState<string>('companyName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedLinks = [...links].sort((a, b) => {
        const valA = String(a[sortField] || '').toLowerCase();
        const valB = String(b[sortField] || '').toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const sortedResults = [...results].sort((a, b) => {
        const valA = String(a[sortField] || '').toLowerCase();
        const valB = String(b[sortField] || '').toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const loadLinks = async () => {
        setLoadingLinks(true);
        try {
            const res = await fetch(`/api/admin/batches/${params.id}/links-preview`);
            if (res.ok) {
                const data = await res.json();
                setLinks(data);
            }
        } catch (e) {
            console.error("Failed to load links preview");
        } finally {
            setLoadingLinks(false);
        }
    };

    const loadResults = async () => {
        setLoadingResults(true);
        try {
            const res = await fetch(`/api/admin/batches/${params.id}/results-preview`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (e) {
            console.error("Failed to load results preview");
        } finally {
            setLoadingResults(false);
        }
    };

    useEffect(() => {
        fetch('/api/admin/batches')
            .then(res => res.json())
            .then(data => {
                const found = data.find((b: Batch) => b.id === params.id);
                setBatch(found || null);
                setLoading(false);
                if (found) {
                    loadLinks();
                    loadResults();
                }
            });
    }, [params.id]);

    const handleExportLinks = async () => {
        if (!confirm('Warning: Generating new links will revoke any previously exported links for this campaign. Continue?')) return;

        setExporting(true);
        try {
            const res = await fetch(`/api/admin/batches/${params.id}/export-links`, {
                method: 'POST'
            });
            const data = await res.json();

            if (res.ok) {
                const csv = Papa.unparse(data);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Survey_Links_${batch?.name?.replace(/\s+/g, '_') || 'Export'}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Refresh link table after generating new tokens
                loadLinks();
            } else {
                alert('Export failed: ' + data.error);
            }
        } catch (err: any) {
            console.error(err);
            alert(`Network error exporting links: ${err.message || 'Unknown'}`);
        } finally {
            setExporting(false);
        }
    };

    const handleExportResults = () => {
        // We'll implement the results export endpoint later
        window.location.href = `/api/admin/batches/${params.id}/export-results`;
    };

    if (loading) return <div className="p-8 animate-pulse text-secondary">Loading batch details...</div>;
    if (!batch) return <div className="p-8 text-danger font-bold">Batch not found.</div>;

    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <a href="/admin/batches" className="text-secondary hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4" /> Back to Campaigns
                </a>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {batch.name}
                    </h1>
                    <p className="text-secondary mt-1">Manage links and export feedback data.</p>
                </div>
                <div className="flex gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center bg-surface-border text-primary`}>
                        Status: {batch.status}
                    </span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="glass-panel p-6 border-l-4 border-l-accent">
                    <h3 className="text-lg font-bold mb-2">Survey Links Distribution</h3>
                    <p className="text-sm text-secondary mb-6">
                        Generate and download the unique, secure access links to send to your invited contacts.
                    </p>
                    <button
                        onClick={handleExportLinks}
                        disabled={exporting}
                        className="btn w-full justify-center gap-2 bg-accent hover:opacity-90 text-white shadow-md border-none"
                    >
                        {exporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
                        {exporting ? 'Generating...' : 'Export Links to CSV'}
                    </button>
                </div>

                <div className="glass-panel p-6 border-l-4 border-l-success">
                    <h3 className="text-lg font-bold mb-2">Feedback Results</h3>
                    <p className="text-sm text-secondary mb-6">
                        Download the collected feedback data from this campaign. Only visible to internal admins.
                    </p>
                    <button
                        onClick={handleExportResults}
                        className="btn btn-primary w-full justify-center gap-2"
                    >
                        <FileText className="w-5 h-5" /> Export Results to CSV
                    </button>
                </div>
            </div>

            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold">Survey Links & Status</h3>
                        <p className="text-secondary text-sm">Feedback Items tracked: {batch._count.feedbackItems}</p>
                    </div>
                    {loadingLinks && <RefreshCw className="w-5 h-5 text-secondary animate-spin" />}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-surface-border">
                                <th className="py-3 px-4 font-semibold text-secondary cursor-pointer hover:text-primary" onClick={() => handleSort('companyName')}>
                                    Company {sortField === 'companyName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-4 font-semibold text-secondary cursor-pointer hover:text-primary" onClick={() => handleSort('contactName')}>
                                    Estimator {sortField === 'contactName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-4 font-semibold text-secondary">Token</th>
                                <th className="py-3 px-4 font-semibold text-secondary cursor-pointer hover:text-primary" onClick={() => handleSort('created_at')}>
                                    Created {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedLinks.map((link, i) => (
                                <tr key={i} className="border-b border-surface-border/50 hover:bg-surface/50 transition-colors">
                                    <td className="py-4 px-4 font-medium">{link.companyName}</td>
                                    <td className="py-4 px-4 text-secondary">{link.contactName} ({link.contactEmail})</td>
                                    <td className="py-4 px-4">
                                        <a href={`/survey/${link.token}?batch=${batch.id}`} target="_blank" className="text-primary hover:underline font-mono text-xs">
                                            {link.token.substring(0, 12)}...
                                        </a>
                                    </td>
                                    <td className="py-4 px-4 text-secondary text-xs">{new Date(link.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {links.length === 0 && !loadingLinks && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-secondary">
                                        No active links found. Click "Export Links to CSV" to generate them.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="glass-panel p-6 mt-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold">Feedback Item Tracking</h3>
                        <p className="text-secondary text-sm">Review incoming survey data directly from the dashboard.</p>
                    </div>
                    {loadingResults && <RefreshCw className="w-5 h-5 text-secondary animate-spin" />}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-surface-border">
                                <th className="py-3 px-4 font-semibold text-secondary cursor-pointer hover:text-primary" onClick={() => handleSort('companyName')}>
                                    Company {sortField === 'companyName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-4 font-semibold text-secondary cursor-pointer hover:text-primary" onClick={() => handleSort('projectName')}>
                                    Project {sortField === 'projectName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-4 font-semibold text-secondary cursor-pointer hover:text-primary" onClick={() => handleSort('status')}>
                                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-4 font-semibold text-secondary cursor-pointer hover:text-primary" onClick={() => handleSort('awarded')}>
                                    Awarded {sortField === 'awarded' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-4 font-semibold text-secondary cursor-pointer hover:text-primary" onClick={() => handleSort('submitted_at')}>
                                    Last Update {sortField === 'submitted_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedResults.map((res, i) => (
                                <tr key={i} className="border-b border-surface-border/50 hover:bg-surface/50 transition-colors">
                                    <td className="py-4 px-4 font-medium">{res.companyName}</td>
                                    <td className="py-4 px-4 text-secondary">{res.projectName}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${res.status === 'Draft' ? 'bg-surface-border text-secondary' :
                                            res.status === 'InProgress' ? 'bg-accent/20 text-accent' :
                                                'bg-success/20 text-success'
                                            }`}>
                                            {res.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-secondary">
                                        {res.awarded === 'Yes' ? '✅' : res.awarded === 'No' ? '❌' : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-secondary text-xs">
                                        {res.submitted_at
                                            ? new Date(res.submitted_at).toLocaleDateString()
                                            : 'Not submitted'}
                                    </td>
                                </tr>
                            ))}
                            {results.length === 0 && !loadingResults && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-secondary">
                                        No tracking data established.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
