"use client"
import { useEffect, useState } from 'react';
import { Layers, Plus, Calendar } from 'lucide-react';

type Batch = {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { feedbackItems: number };
};

export default function BatchesPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newBatchName, setNewBatchName] = useState('');

    const loadBatches = () => {
        fetch('/api/admin/batches')
            .then(res => res.json())
            .then(data => {
                setBatches(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadBatches();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBatchName) return;
        setCreating(true);

        await fetch('/api/admin/batches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newBatchName })
        });

        setNewBatchName('');
        setCreating(false);
        setLoading(true);
        loadBatches();
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Layers className="text-success w-8 h-8" />
                        Survey Campaigns (Batches)
                    </h1>
                    <p className="text-secondary mt-1">Manage feedback campaigns and distribute links.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="md:col-span-1 glass-card border-t-4 border-t-primary">
                    <h3 className="text-lg font-bold mb-4">Create New Campaign</h3>
                    <form onSubmit={handleCreate} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Batch Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Q1 2026 Feedback"
                                value={newBatchName}
                                onChange={e => setNewBatchName(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary flex items-center justify-center gap-2" disabled={creating}>
                            <Plus className="w-4 h-4" /> {creating ? 'Generating...' : 'Create & Generate Drafts'}
                        </button>
                        <p className="text-xs text-secondary mt-2">
                            Creating a batch will automatically snapshot all current project invites and generate draft Feedback Items.
                        </p>
                    </form>
                </div>

                <div className="md:col-span-2 glass-panel p-6">
                    <h3 className="text-lg font-bold mb-4">Existing Campaigns</h3>

                    {loading ? (
                        <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-24 bg-surface rounded w-full"></div></div></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-surface-border">
                                        <th className="py-3 px-4 font-semibold text-secondary">Campaign Name</th>
                                        <th className="py-3 px-4 font-semibold text-secondary">Status</th>
                                        <th className="py-3 px-4 font-semibold text-secondary">Feedback Items</th>
                                        <th className="py-3 px-4 font-semibold text-secondary">Created Date</th>
                                        <th className="py-3 px-4 font-semibold text-secondary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batches.map(batch => (
                                        <tr key={batch.id} className="border-b border-surface-border hover:bg-surface/50 transition-colors">
                                            <td className="py-4 px-4 font-medium text-lg">{batch.name}</td>
                                            <td className="py-4 px-4">
                                                <span className="bg-success/20 text-success px-2 py-1 rounded text-sm font-semibold">{batch.status}</span>
                                            </td>
                                            <td className="py-4 px-4">{batch._count.feedbackItems}</td>
                                            <td className="py-4 px-4 text-secondary text-sm flex items-center gap-1 mt-1">
                                                <Calendar className="w-4 h-4" /> {new Date(batch.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-4">
                                                <a href={`/admin/batches/${batch.id}`} className="text-sm text-primary hover:underline font-medium">Manage Links & Data</a>
                                            </td>
                                        </tr>
                                    ))}
                                    {batches.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-secondary">No campaigns created yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
