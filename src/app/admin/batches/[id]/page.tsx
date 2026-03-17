"use client"
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DownloadCloud, ArrowLeft, RefreshCw, FileText, Mail, CheckCircle2, Circle, Plus, Edit2, Copy, Send, Trash2, Calendar, Eye, Save } from 'lucide-react';
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

    // Tabs
    const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'feedback'>('campaigns');

    // Email Campaign State
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);

    // Active Composer State
    const [activeCampaign, setActiveCampaign] = useState<any | null>(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [emailName, setEmailName] = useState('');
    const [scheduledFor, setScheduledFor] = useState('');
    const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
    const [sendingEmails, setSendingEmails] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Sorting states
    const [sortField, setSortField] = useState<string>('companyName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getFilteredLinks = () => {
        const filtered = links.filter(link => {
            const search = searchTerm.toLowerCase();
            return (
                (link.companyName || '').toLowerCase().includes(search) ||
                (link.contactName || '').toLowerCase().includes(search) ||
                (link.contactEmail || '').toLowerCase().includes(search)
            );
        });

        return filtered.sort((a, b) => {
            const valA = String(a[sortField] || '').toLowerCase();
            const valB = String(b[sortField] || '').toLowerCase();
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedLinks = getFilteredLinks();

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

    const loadCampaigns = async () => {
        setLoadingCampaigns(true);
        try {
            const res = await fetch(`/api/admin/batches/${params.id}/campaigns`);
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
            }
        } catch (e) {
            console.error("Failed to load campaigns");
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const loadActiveCampaignDeliveries = async (campaignId: string) => {
        try {
            const res = await fetch(`/api/admin/campaigns/${campaignId}`);
            if (res.ok) {
                const data = await res.json();
                // We map deliveries out to the `links` state so the contact table can consume it
                // We'll merge the base `links` with this delivery data
                return data.deliveries;
            }
        } catch (e) {
            console.error(e);
        }
        return [];
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
                    loadCampaigns();
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

    const toggleTokenSelection = (id: string) => {
        if (selectedTokenIds.includes(id)) {
            setSelectedTokenIds(selectedTokenIds.filter(t => t !== id));
        } else {
            setSelectedTokenIds([...selectedTokenIds, id]);
        }
    };

    const selectAllContacts = () => {
        setSelectedTokenIds(links.map(l => l.id));
    };

    const selectNonOpeners = () => {
        const nonOpeners = links.filter(l => l.email_sent_at && !l.email_opened_at).map(l => l.id);
        setSelectedTokenIds(nonOpeners);
    };

    const selectUnsent = () => {
        const unsent = links.filter(l => !l.email_sent_at).map(l => l.id);
        setSelectedTokenIds(unsent);
    };

    const insertMergeTag = (tag: string) => {
        setEmailBody(prev => prev + `{{${tag}}}`);
    };

    const createNewDraft = async () => {
        try {
            const res = await fetch(`/api/admin/batches/${params.id}/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `New Draft - ${new Date().toLocaleDateString()}` })
            });
            const data = await res.json();
            if (res.ok) {
                setCampaigns([data, ...campaigns]);
                openComposer(data);
            } else {
                const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Unknown error');
                alert(`Failed to create campaign: ${errorMsg}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error creating campaign.");
        }
    };

    const openComposer = (campaign: any) => {
        setActiveCampaign(campaign);
        setEmailName(campaign.name || '');
        setEmailSubject(campaign.subject || '');
        setEmailBody(campaign.htmlBody || '');
        setScheduledFor(campaign.scheduled_for ? new Date(campaign.scheduled_for).toISOString().slice(0, 16) : '');
        setPreviewMode(false);

        if (campaign.status === 'Sent') {
            loadActiveCampaignDeliveries(campaign.id).then(deliveries => {
                const updatedLinks = links.map(l => {
                    const delivery = (deliveries || []).find((d: any) => d.tokenId === l.id);
                    return {
                        ...l,
                        deliveryStatus: !!delivery,
                        email_sent_at: delivery?.sent_at,
                        opened_at: delivery?.opened_at
                    };
                });
                setLinks(updatedLinks);
            });
        } else {
            setSelectedTokenIds([]);
        }
    };

    const deleteCampaign = async (id: string, status: string) => {
        if (status === 'Sent') return alert("Cannot delete a sent campaign.");
        if (!confirm("Are you sure you want to delete this draft?")) return;

        try {
            const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCampaigns(campaigns.filter(c => c.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const duplicateCampaign = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/batches/${params.id}/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duplicateFromId: id })
            });
            if (res.ok) {
                const newCampaign = await res.json();
                setCampaigns([newCampaign, ...campaigns]);
                alert("Campaign duplicated as draft!");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveDraft = async () => {
        if (!activeCampaign) return;
        setSavingDraft(true);
        try {
            const res = await fetch(`/api/admin/campaigns/${activeCampaign.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: emailName,
                    subject: emailSubject,
                    htmlBody: emailBody,
                    scheduled_for: scheduledFor || null
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setCampaigns(campaigns.map(c => c.id === updated.id ? updated : c));
                setActiveCampaign(updated);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSavingDraft(false);
        }
    };

    const handleSendEmails = async () => {
        if (!activeCampaign) return;
        if (selectedTokenIds.length === 0) return alert("Please select at least one contact.");

        // Auto-save draft before sending if there are changes
        await saveDraft();

        if (!confirm(`Are you sure you want to dispatch this campaign to ${selectedTokenIds.length} contacts?`)) return;

        setSendingEmails(true);
        try {
            const res = await fetch(`/api/admin/campaigns/${activeCampaign.id}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenIds: selectedTokenIds
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`Successfully dispatched ${data.count} emails!`);
                setSelectedTokenIds([]);
                loadCampaigns(); // Refresh list to show "Sent" status
                setActiveCampaign(null); // Return to list
            } else {
                const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Unknown error');
                alert(`Failed: ${errorMsg}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error sending emails.");
        } finally {
            setSendingEmails(false);
        }
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

            {/* Nav Tabs */}
            <div className="flex border-b border-surface-border mb-8 overflow-x-auto scroller-hidden">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-foreground'}`}
                >
                    Overview & Export
                </button>
                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`px-6 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'campaigns' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-foreground'}`}
                >
                    Email Campaigns
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px-6 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'feedback' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-foreground'}`}
                >
                    Feedback Tracking
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-8 mb-8 animate-fade-in-up">
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
            )}

            {activeTab === 'campaigns' && !activeCampaign && (
                <div className="glass-panel p-6 mb-8 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 border-b border-surface-border pb-4">
                        <div className="flex items-center gap-2">
                            <Mail className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-bold">Email Campaigns</h3>
                        </div>
                        <button onClick={createNewDraft} className="btn btn-primary btn-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Campaign
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-surface-border text-secondary">
                                    <th className="py-3 px-4 font-semibold">Campaign Name</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold">Deliveries</th>
                                    <th className="py-3 px-4 font-semibold">Last Updated</th>
                                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c) => (
                                    <tr key={c.id} className="border-b border-surface-border/50 hover:bg-surface/50 transition-colors group">
                                        <td className="py-4 px-4 font-medium text-primary cursor-pointer hover:underline" onClick={() => openComposer(c)}>
                                            {c.name}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${c.status === 'Draft' ? 'bg-surface-border text-secondary' : c.status === 'Sent' ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-secondary">{c._count?.deliveries || 0} recipients</td>
                                        <td className="py-4 px-4 text-secondary text-xs">{new Date(c.updatedAt).toLocaleDateString()}</td>
                                        <td className="py-4 px-4 text-right space-x-2">
                                            {c.status === 'Draft' && (
                                                <>
                                                    <button onClick={() => openComposer(c)} className="text-secondary hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteCampaign(c.id, c.status)} className="text-danger hover:text-danger/80"><Trash2 className="w-4 h-4" /></button>
                                                </>
                                            )}
                                            {c.status === 'Sent' && (
                                                <button onClick={() => openComposer(c)} className="text-secondary hover:text-primary"><Eye className="w-4 h-4" /></button>
                                            )}
                                            <button onClick={() => duplicateCampaign(c.id)} className="text-secondary hover:text-primary" title="Duplicate"><Copy className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                                {campaigns.length === 0 && !loadingCampaigns && (
                                    <tr><td colSpan={5} className="py-8 text-center text-secondary">No campaigns created yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'campaigns' && activeCampaign && (
                <div className="glass-panel p-6 mb-8 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-6 border-b border-surface-border pb-4">
                        <button onClick={() => setActiveCampaign(null)} className="flex items-center gap-2 text-sm text-secondary hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" /> Back to List
                        </button>
                        <div className="flex gap-2">
                            {activeCampaign.status === 'Draft' ? (
                                <>
                                    <button onClick={saveDraft} className="btn bg-surface-border text-foreground hover:bg-surface btn-sm flex items-center gap-2">
                                        {savingDraft ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
                                    </button>
                                    <button onClick={handleSendEmails} disabled={sendingEmails} className="btn btn-primary shadow-glow btn-sm flex items-center gap-2">
                                        {sendingEmails ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                                            scheduledFor ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />
                                        )}
                                        {scheduledFor ? `Schedule for ${new Date(scheduledFor).toLocaleDateString()}` : 'Dispatch Immediately'}
                                    </button>
                                </>
                            ) : (
                                <span className="bg-success/20 text-success px-3 py-1 rounded font-bold text-sm">Campaign Locked (Sent)</span>
                            )}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Left Side: Composer */}
                        <div className="flex flex-col gap-4 border-r border-surface-border pr-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-secondary">Email Composer</h4>
                                <div className="flex rounded overflow-hidden">
                                    <button onClick={() => setPreviewMode(false)} className={`px-3 py-1 text-xs font-semibold ${!previewMode ? 'bg-primary text-white' : 'bg-surface-border text-secondary'}`}>Write</button>
                                    <button onClick={() => setPreviewMode(true)} className={`px-3 py-1 text-xs font-semibold ${previewMode ? 'bg-primary text-white' : 'bg-surface-border text-secondary'}`}>Preview</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-secondary">Campaign Internal Name</label>
                                <input type="text" className="w-full" value={emailName} onChange={(e) => setEmailName(e.target.value)} disabled={activeCampaign.status !== 'Draft'} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-secondary">Subject Line</label>
                                <input type="text" className="w-full font-bold" placeholder="Feedback Request: {{CompanyName}}" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} disabled={activeCampaign.status !== 'Draft'} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-secondary flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Schedule Auto-Send (Optional)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="datetime-local"
                                        className="w-full text-xs py-1.5"
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                        disabled={activeCampaign.status !== 'Draft'}
                                    />
                                    {scheduledFor && (
                                        <button
                                            onClick={() => setScheduledFor('')}
                                            className="text-xs text-danger hover:underline px-2"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-secondary mt-1 italic">
                                    {scheduledFor ? 'Campaign will be scheduled instead of sent immediately.' : 'Leave blank to send now.'}
                                </p>
                            </div>

                            <div className="flex-1 mt-2">
                                {activeCampaign.status === 'Draft' && !previewMode && (
                                    <div className="flex space-x-2 text-[10px] mb-2">
                                        <button onClick={() => insertMergeTag('CompanyName')} className="text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded">CompanyName</button>
                                        <button onClick={() => insertMergeTag('ContactName')} className="text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded">ContactName</button>
                                        <button onClick={() => insertMergeTag('SurveyLink')} className="text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded">SurveyLink</button>
                                    </div>
                                )}

                                {previewMode ? (
                                    <div className="bg-white text-black p-4 rounded-md border border-surface-border min-h-[300px] text-sm overflow-y-auto" dangerouslySetInnerHTML={{
                                        __html:
                                            emailBody
                                                .replace(/{{CompanyName}}/g, '<span class="bg-yellow-200">Acme Builders</span>')
                                                .replace(/{{ContactName}}/g, '<span class="bg-yellow-200">John Doe</span>')
                                                .replace(/{{SurveyLink}}/g, '<a href="#" class="text-blue-600 underline">https://portal.mgssurvey.com/survey/demo-link</a>')
                                    }}></div>
                                ) : (
                                    <textarea
                                        className="w-full font-mono text-sm h-[300px] bg-black/50"
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        disabled={activeCampaign.status !== 'Draft'}
                                        placeholder="Write your HTML email here..."
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right Side: Contact Selection / Delivery Stats */}
                        <div className="flex flex-col h-[650px]">
                            <div className="flex flex-col gap-3 mb-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-secondary flex items-center gap-2">
                                        {activeCampaign.status === 'Draft' ? 'Select Recipients' : 'Delivery Report'}
                                        {loadingLinks && <RefreshCw className="w-4 h-4 text-secondary animate-spin" />}
                                    </h4>
                                    {activeCampaign.status === 'Draft' && (
                                        <div className="flex gap-2 text-[10px]">
                                            <button onClick={selectAllContacts} className="bg-surface-border hover:bg-surface px-2 py-1 rounded transition-colors">Select All</button>
                                            <button onClick={selectUnsent} className="bg-surface-border hover:bg-surface px-2 py-1 rounded transition-colors">Unsent Only</button>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        className="w-full text-xs py-2 pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary opacity-50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </span>
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground">×</button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-y-auto border border-surface-border rounded flex-1 bg-surface/30">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="sticky top-0 bg-surface z-10 shadow-sm">
                                        <tr>
                                            {activeCampaign.status === 'Draft' && <th className="py-2 px-3 w-10"></th>}
                                            <th className="py-2 px-3 font-semibold text-secondary">Contact</th>
                                            <th className="py-2 px-3 font-semibold text-secondary w-20 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedLinks.map((link, i) => {
                                            const isSentCampaign = activeCampaign.status === 'Sent';
                                            // For sent campaigns, only show contacts that actually received this delivery
                                            if (isSentCampaign && !link.deliveryStatus) return null;

                                            return (
                                                <tr key={i} className={`border-b border-surface-border/50 transition-colors ${!isSentCampaign ? 'cursor-pointer hover:bg-surface/80' : ''} ${selectedTokenIds.includes(link.id) ? 'bg-primary/10' : ''}`} onClick={() => !isSentCampaign && toggleTokenSelection(link.id)}>
                                                    {!isSentCampaign && (
                                                        <td className="py-3 px-3 text-center">
                                                            {selectedTokenIds.includes(link.id) ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-surface-border hover:text-secondary" />}
                                                        </td>
                                                    )}
                                                    <td className="py-3 px-3">
                                                        <div className="font-medium text-xs break-all">{link.contactEmail}</div>
                                                        <div className="text-xs text-secondary">{link.contactName} ({link.companyName})</div>
                                                    </td>
                                                    <td className="py-3 px-3 text-center text-xs font-mono">
                                                        {isSentCampaign ? (
                                                            link.opened_at ? <span className="text-success font-bold" title={new Date(link.opened_at).toLocaleString()}>Opened</span> : <span className="text-secondary" title={new Date(link.email_sent_at).toLocaleString()}>Sent</span>
                                                        ) : (
                                                            <span className="text-surface-border">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {links.length === 0 && !loadingLinks && (
                                            <tr><td colSpan={3} className="py-8 text-center text-secondary">No contacts available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 text-xs text-secondary text-right">
                                {activeCampaign.status === 'Draft' ? `${selectedTokenIds.length} / ${links.length} selected` : 'Showing all recipients for this campaign'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'feedback' && (
                <div className="glass-panel p-6 mt-8 animate-fade-in-up">
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
            )}

        </div>
    );
}
