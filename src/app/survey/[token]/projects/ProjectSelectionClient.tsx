"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Square, ArrowRight } from 'lucide-react';

export default function ProjectSelectionClient({
    items,
    initialSelection,
    token,
    batchId,
    currentContactId
}: {
    items: any[],
    initialSelection: string[],
    token: string,
    batchId: string,
    currentContactId: string
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection));
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const toggleSelection = (projectId: string) => {
        const next = new Set(selected);
        if (next.has(projectId)) next.delete(projectId);
        else next.add(projectId);
        setSelected(next);
    };

    const handleContinue = async () => {
        if (selected.size === 0) return alert('Please select at least one project.');
        setLoading(true);

        try {
            // Send selected project IDs to API to mark them as 'InProgress' if currently 'Draft'
            const res = await fetch(`/api/survey/select-projects?token=${token}&batch=${batchId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectIds: Array.from(selected) })
            });
            if (res.ok) {
                router.push(`/survey/${token}/feedback?batch=${batchId}`);
            } else {
                alert('Error storing selection');
                setLoading(false);
            }
        } catch {
            alert('Network error');
            setLoading(false);
        }
    };

    const myProjects = items.filter(item => {
        const invite = item.company?.projectInvites?.find((i: any) => i.projectId === item.projectId);
        return invite?.contactId === currentContactId;
    });

    const othersProjects = items.filter(item => {
        const invite = item.company?.projectInvites?.find((i: any) => i.projectId === item.projectId);
        return invite?.contactId !== currentContactId;
    });

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Project Selection</h1>
                <p className="text-secondary text-lg">Please select the projects for which you would like to provide your professional feedback.</p>
            </div>

            <div className="glass-panel overflow-hidden mb-8">
                <div className="divide-y divide-surface-border">
                    {/* Partition: Your Projects */}
                    <div className="bg-surface/30 p-4 border-b border-surface-border">
                        <h2 className="text-xl font-bold text-primary">Projects Invited by You</h2>
                    </div>
                    {myProjects.length === 0 && <div className="p-4 text-secondary italic">No projects invited by you.</div>}
                    {myProjects.map((item, idx) => {
                        const isSelected = selected.has(item.projectId);
                        const invite = item.company?.projectInvites?.find((i: any) => i.projectId === item.projectId);
                        const inviterName = invite?.contact?.name || 'Unknown';

                        return (
                            <div
                                key={item.projectId}
                                onClick={() => toggleSelection(item.projectId)}
                                className={`p-4 flex items-center gap-4 cursor-pointer transition-all animate-slide-up stagger-${(idx % 4) + 1} ${isSelected ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-surface/50 border-l-4 border-transparent'}`}
                            >
                                <div className={`text-${isSelected ? 'primary' : 'secondary'}`}>
                                    {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h1 className="font-bold text-xl">{item.project.project_name}</h1>
                                    <p className="text-base text-secondary mt-1">
                                        Invited by {inviterName} on {
                                            (() => {
                                                if (invite && invite.invited_date) {
                                                    return new Date(invite.invited_date).toLocaleDateString();
                                                }
                                                return item.project.invited_date ? new Date(item.project.invited_date).toLocaleDateString() : 'Unknown Date';
                                            })()
                                        }
                                    </p>
                                </div>
                                <div className="ml-auto text-sm">
                                    {item.status === 'Submitted' && <span className="text-success font-semibold">Submitted</span>}
                                    {item.status === 'InProgress' && <span className="text-accent font-semibold flex items-center">In Progress</span>}
                                </div>
                            </div>
                        );
                    })}

                    {/* Partition: Others Projects */}
                    {othersProjects.length > 0 && (
                        <>
                            <div className="bg-surface/30 p-4 border-b border-t border-surface-border mt-8">
                                <h2 className="text-xl font-bold text-secondary">Other Projects from Your Company</h2>
                            </div>
                            {othersProjects.map((item, idx) => {
                                const isSelected = selected.has(item.projectId);
                                const invite = item.company?.projectInvites?.find((i: any) => i.projectId === item.projectId);
                                const inviterName = invite?.contact?.name || 'Unknown';

                                return (
                                    <div
                                        key={item.projectId}
                                        onClick={() => toggleSelection(item.projectId)}
                                        className={`p-4 flex items-center gap-4 cursor-pointer transition-all animate-slide-up stagger-${(idx % 4) + 1} ${isSelected ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-surface/50 border-l-4 border-transparent'}`}
                                    >
                                        <div className={`text-${isSelected ? 'primary' : 'secondary'}`}>
                                            {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h1 className="font-bold text-xl text-secondary">{item.project.project_name}</h1>
                                            <p className="text-base text-secondary/70 mt-1">
                                                Invited by {inviterName} on {
                                                    (() => {
                                                        if (invite && invite.invited_date) {
                                                            return new Date(invite.invited_date).toLocaleDateString();
                                                        }
                                                        return item.project.invited_date ? new Date(item.project.invited_date).toLocaleDateString() : 'Unknown Date';
                                                    })()
                                                }
                                            </p>
                                        </div>
                                        <div className="ml-auto text-sm">
                                            {item.status === 'Submitted' && <span className="text-success font-semibold">Submitted</span>}
                                            {item.status === 'InProgress' && <span className="text-accent font-semibold flex items-center">In Progress</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            <div
                className="flex flex-col md:flex-row md:justify-between items-center bg-surface p-4 rounded-lg md:rounded-lg border border-surface-border sticky z-50 transition-all shadow-lg backdrop-blur-md bottom-4 mx-0 md:mx-4 mb-4"
            >
                <div className="text-secondary font-medium mb-3 md:mb-0 text-center md:text-left w-full md:w-auto">
                    {selected.size} of {items.length} selected
                </div>
                <div className="w-full md:w-auto flex justify-center md:justify-end">
                    <button
                        onClick={handleContinue}
                        disabled={selected.size === 0 || loading}
                        className="btn btn-primary gap-2 w-full md:w-auto"
                    >
                        {loading ? 'Processing...' : 'Continue to Feedback'} <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
