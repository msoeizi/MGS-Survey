"use client"
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, CheckCircle, AlertCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';

// Debounce hook
function useDebounceCallback<Args extends any[]>(
    callback: (...args: Args) => void,
    delay: number
) {
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    return useCallback(
        (...args: Args) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    );
}

export default function FeedbackFormClient({
    items,
    initialGeneral,
    token,
    batchId,
    currentContactId
}: {
    items: any[],
    initialGeneral?: any,
    token: string,
    batchId: string,
    currentContactId: string
}) {
    // Project-specific feedback data
    const [formData, setFormData] = useState<Record<string, any>>(
        items.reduce((acc, item) => ({
            ...acc,
            [item.id]: {
                awarded: item.awarded || '',
                reason: item.reason_not_carried || '',
                carried_price: item.carried_price ? parseFloat(item.carried_price) : '',
                how_to_improve: item.how_to_improve || '',
                quote_reasonableness: item.quote_reasonableness || '',
                price: item.awarded_price ? parseFloat(item.awarded_price) : '', // keep for schema backwards compat if needed
                comments: item.comments || '',
                status: item.status
            }
        }), {})
    );

    // General feedback data
    const [generalData, setGeneralData] = useState({
        relationship_feedback: initialGeneral?.relationship_feedback || '',
        follow_up_impact: initialGeneral?.follow_up_impact || ''
    });

    const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [locked, setLocked] = useState(items.every(i => i.status === 'Submitted'));
    const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
    const router = useRouter();

    const triggerAutosave = useDebounceCallback(async (updatedProjectData, updatedGeneralData) => {
        if (locked) return;
        setSavingState('saving');
        try {
            const res = await fetch(`/api/survey/feedback?token=${token}&batch=${batchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: updatedProjectData, general: updatedGeneralData })
            });
            if (res.ok) {
                setSavingState('saved');
                setTimeout(() => setSavingState('idle'), 2000);
            } else {
                setSavingState('error');
            }
        } catch {
            setSavingState('error');
        }
    }, 1500);

    const handleChange = (id: string, field: string, value: any) => {
        if (locked) return;
        const newData = {
            ...formData,
            [id]: { ...formData[id], [field]: value }
        };
        setFormData(newData);
        triggerAutosave(newData, generalData);
    };

    const handleGeneralChange = (field: string, value: any) => {
        if (locked) return;
        const newGeneral = {
            ...generalData,
            [field]: value
        };
        setGeneralData(newGeneral);
        triggerAutosave(formData, newGeneral);
    };

    const toggleDetails = (projectId: string) => {
        setExpandedDetails(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const handleSubmit = async () => {
        if (!confirm('Are you sure you want to submit? This will lock your responses and you will not be able to edit them further.')) return;

        setSavingState('saving');
        try {
            const res = await fetch(`/api/survey/submit?token=${token}&batch=${batchId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: formData, general: generalData })
            });
            if (res.ok) {
                setLocked(true);
                router.push(`/survey/${token}/success?batch=${batchId}`);
            } else {
                setSavingState('error');
                alert('Failed to submit. Please try again.');
            }
        } catch {
            setSavingState('error');
            alert('Network error while submitting.');
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
        <div className="animate-fade-in relative pb-32">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Project Feedback</h1>
                    <p className="text-secondary">Please provide your feedback for the selected projects below.</p>
                </div>
            </div>

            {/* Sticky Save Indicator */}
            <div className="sticky top-20 z-40 bg-background/80 backdrop-blur pb-4 pt-2 -mx-4 px-4 mb-4 flex justify-end">
                {savingState === 'saving' && <span className="text-secondary text-sm flex items-center gap-2"><Save className="w-4 h-4 animate-pulse" /> Autosaving...</span>}
                {savingState === 'saved' && <span className="text-success text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> All changes saved</span>}
                {savingState === 'error' && <span className="text-danger text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Save failed</span>}
            </div>

            <div className="space-y-12">
                {/* Partition: Your Projects */}
                <div className="bg-surface/30 p-4 border-b border-surface-border">
                    <h2 className="text-xl font-bold text-primary italic border-b border-primary/20 pb-1">Projects selected for feedback:</h2>
                </div>
                {myProjects.length === 0 && <div className="p-4 text-secondary italic">No projects invited by you.</div>}
                {myProjects.map((item, idx) => {
                    const data = formData[item.id];
                    const isExpanded = !!expandedDetails[item.id];

                    const invite = item.company?.projectInvites?.find((i: any) => i.projectId === item.projectId);

                    // Format Invited By / Date / Quoted Price
                    const contactName = invite?.contact?.name || 'Unknown';
                    let invitedDate = 'Unknown Date';
                    let submittedPrice = 'N/A';

                    if (invite) {
                        if (invite.invited_date) invitedDate = new Date(invite.invited_date).toLocaleDateString();
                        if (invite.submitted_price) submittedPrice = `$${Number(invite.submitted_price).toLocaleString()}`;
                    } else if (item.project?.invited_date) {
                        invitedDate = new Date(item.project.invited_date).toLocaleDateString();
                        if (item.project.submitted_price) submittedPrice = `$${Number(item.project.submitted_price).toLocaleString()}`;
                    }

                    return (
                        <div key={item.id} className={`glass-panel p-6 md:p-8 animate-slide-up stagger-${(idx % 4) + 1}`}>
                            <div className="border-b border-surface-border pb-4 mb-6 relative">
                                <h1 className="text-3xl font-bold">{item.project.project_name}</h1>

                                {/* Details Expander */}
                                <div className="mt-4">
                                    <button
                                        onClick={() => toggleDetails(item.id)}
                                        className="text-primary hover:text-primary-hover flex items-center gap-1 font-semibold transition-colors bg-transparent border-none p-0 shadow-none outline-none focus:outline-none"
                                    >
                                        Details {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="mt-3 p-4 bg-surface rounded-md border border-surface-border text-sm text-secondary animate-slide-down shadow-inner">
                                            <p className="mb-1"><span className="font-semibold text-foreground">Invited by:</span> {contactName}</p>
                                            <p className="mb-1"><span className="font-semibold text-foreground">Invited on:</span> {invitedDate}</p>
                                            <p><span className="font-semibold text-foreground">We quoted:</span> {submittedPrice}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium mb-3">Was your company awarded this project?</label>
                                    <div className="flex flex-col md:flex-row gap-4 max-w-md mt-2">
                                        {['Yes', 'No'].map((opt) => (
                                            <label key={opt} className={`radio-card ${data.awarded === opt ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name={`awarded-${item.id}`}
                                                    value={opt}
                                                    checked={data.awarded === opt}
                                                    onChange={() => handleChange(item.id, 'awarded', opt)}
                                                    disabled={locked}
                                                    className="hidden"
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {data.awarded === 'Yes' && (
                                    <div className="col-span-1 md:col-span-2 grid md:grid-cols-2 gap-8 animate-slide-down">
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium mb-2">
                                                What was the millwork quote price you carried?
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="pl-8"
                                                    value={data.carried_price}
                                                    onChange={(e) => handleChange(item.id, 'carried_price', e.target.value)}
                                                    disabled={locked}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-medium mb-2">What was main reason we were not the first choice?</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                                {['Price', 'Client\'s Decision', 'We had a preferred MW company', 'Other'].map(reasonOpt => (
                                                    <label key={reasonOpt} className={`radio-option ${data.reason === reasonOpt ? 'selected' : ''}`}>
                                                        <input
                                                            type="radio"
                                                            name={`reason-${item.id}`}
                                                            value={reasonOpt}
                                                            checked={data.reason === reasonOpt}
                                                            onChange={(e) => handleChange(item.id, 'reason', e.target.value)}
                                                            disabled={locked}
                                                        />
                                                        <span className="leading-snug mt-0.5">{reasonOpt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-medium mb-2">What could have we done to win this project?</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Help us improve our service..."
                                                value={data.how_to_improve}
                                                onChange={(e) => handleChange(item.id, 'how_to_improve', e.target.value)}
                                                disabled={locked}
                                                className="resize-y"
                                            />
                                        </div>
                                    </div>
                                )}

                                {data.awarded === 'No' && (
                                    <div className="col-span-1 md:col-span-2 animate-slide-down">
                                        <label className="block text-sm font-medium mb-3">How reasonable was our {submittedPrice} quote?</label>
                                        <div className="flex flex-col md:flex-row gap-4 max-w-2xl mt-2">
                                            {['It was fair', 'Too high', 'Too low'].map((opt) => (
                                                <label key={opt} className={`radio-card ${data.quote_reasonableness === opt ? 'selected' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name={`reasonableness-${item.id}`}
                                                        value={opt}
                                                        checked={data.quote_reasonableness === opt}
                                                        onChange={() => handleChange(item.id, 'quote_reasonableness', opt)}
                                                        disabled={locked}
                                                        className="hidden"
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Partition: Others Projects */}
                {othersProjects.length > 0 && (
                    <>
                        <div className="bg-surface/30 p-4 border-b border-t border-surface-border mt-12">
                            <h2 className="text-xl font-bold text-secondary italic border-b border-secondary/20 pb-1">Projects invited by others:</h2>
                        </div>
                        {othersProjects.map((item, idx) => {
                            const data = formData[item.id];
                            const isExpanded = !!expandedDetails[item.id];

                            const invite = item.company?.projectInvites?.find((i: any) => i.projectId === item.projectId);

                            // Format Invited By / Date / Quoted Price
                            const contactName = invite?.contact?.name || 'Unknown';
                            let invitedDate = 'Unknown Date';
                            let submittedPrice = 'N/A';

                            if (invite) {
                                if (invite.invited_date) invitedDate = new Date(invite.invited_date).toLocaleDateString();
                                if (invite.submitted_price) submittedPrice = `$${Number(invite.submitted_price).toLocaleString()}`;
                            } else if (item.project?.invited_date) {
                                invitedDate = new Date(item.project.invited_date).toLocaleDateString();
                                if (item.project.submitted_price) submittedPrice = `$${Number(item.project.submitted_price).toLocaleString()}`;
                            }

                            return (
                                <div key={item.id} className={`glass-panel p-6 md:p-8 animate-slide-up stagger-${(idx % 4) + 1}`}>
                                    <div className="border-b border-surface-border pb-4 mb-6 relative">
                                        <h1 className="text-3xl font-bold text-secondary">{item.project.project_name}</h1>

                                        {/* Details Expander */}
                                        <div className="mt-4">
                                            <button
                                                onClick={() => toggleDetails(item.id)}
                                                className="text-secondary hover:text-foreground flex items-center gap-1 font-semibold transition-colors bg-transparent border-none p-0 shadow-none outline-none focus:outline-none"
                                            >
                                                Details {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-3 p-4 bg-surface rounded-md border border-surface-border text-sm text-secondary animate-slide-down shadow-inner">
                                                    <p className="mb-1"><span className="font-semibold text-foreground">Invited by:</span> {contactName}</p>
                                                    <p className="mb-1"><span className="font-semibold text-foreground">Invited on:</span> {invitedDate}</p>
                                                    <p><span className="font-semibold text-foreground">We quoted:</span> {submittedPrice}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-medium mb-3">Project Award Status</label>
                                            <div className="flex flex-col md:flex-row gap-4 max-w-md mt-2">
                                                {['Yes', 'No'].map((opt) => (
                                                    <label key={opt} className={`radio-card ${data.awarded === opt ? 'selected' : ''}`}>
                                                        <input
                                                            type="radio"
                                                            name={`awarded-${item.id}`}
                                                            value={opt}
                                                            checked={data.awarded === opt}
                                                            onChange={() => handleChange(item.id, 'awarded', opt)}
                                                            disabled={locked}
                                                            className="hidden"
                                                        />
                                                        {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {data.awarded === 'Yes' && (
                                            <div className="col-span-1 md:col-span-2 grid md:grid-cols-2 gap-8 animate-slide-down">
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium mb-2">
                                                        To help us calibrate our future pricing, could you share the millwork value you carried in your bid?
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">$</span>
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="pl-8"
                                                            value={data.carried_price}
                                                            onChange={(e) => handleChange(item.id, 'carried_price', e.target.value)}
                                                            disabled={locked}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-span-1 md:col-span-2">
                                                    <label className="block text-sm font-medium mb-2">If MGS was not the selected partner for this project, we would appreciate knowing the primary reason:</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                                        {['Price', 'Client\'s Decision', 'We had a preferred MW company', 'Other'].map(reasonOpt => (
                                                            <label key={reasonOpt} className={`radio-option ${data.reason === reasonOpt ? 'selected' : ''}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`reason-${item.id}`}
                                                                    value={reasonOpt}
                                                                    checked={data.reason === reasonOpt}
                                                                    onChange={(e) => handleChange(item.id, 'reason', e.target.value)}
                                                                    disabled={locked}
                                                                />
                                                                <span className="leading-snug mt-0.5">{reasonOpt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="col-span-1 md:col-span-2">
                                                    <label className="block text-sm font-medium mb-2">Do you have any suggestions on how we could have improved our proposal to better meet your requirements?</label>
                                                    <textarea
                                                        rows={3}
                                                        placeholder="Help us improve our service..."
                                                        value={data.how_to_improve}
                                                        onChange={(e) => handleChange(item.id, 'how_to_improve', e.target.value)}
                                                        disabled={locked}
                                                        className="resize-y"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {data.awarded === 'No' && (
                                            <div className="col-span-1 md:col-span-2 animate-slide-down">
                                                <label className="block text-sm font-medium mb-3">In your professional opinion, how did our {submittedPrice} proposal compare to the market?</label>
                                                <div className="flex flex-col md:flex-row gap-4 max-w-2xl mt-2">
                                                    {['It was fair', 'Too high', 'Too low'].map((opt) => (
                                                        <label key={opt} className={`radio-card ${data.quote_reasonableness === opt ? 'selected' : ''}`}>
                                                            <input
                                                                type="radio"
                                                                name={`reasonableness-${item.id}`}
                                                                value={opt}
                                                                checked={data.quote_reasonableness === opt}
                                                                onChange={() => handleChange(item.id, 'quote_reasonableness', opt)}
                                                                disabled={locked}
                                                                className="hidden"
                                                            />
                                                            {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}


                {/* General Comments Section */}
                {items.length > 0 && (
                    <div className="glass-panel p-6 md:p-8 border-t-4 border-primary mt-12 mb-24 animate-slide-up stagger-4">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            General Comments
                        </h2>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Overall feedback on what we can do to improve our relationships with your company, further break down the quotes in line items?
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Your thoughts..."
                                    value={generalData.relationship_feedback}
                                    onChange={(e) => handleGeneralChange('relationship_feedback', e.target.value)}
                                    disabled={locked}
                                    className="resize-y w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    One last question, how much impact does a follow up call have on awarding contracts to trades?
                                </label>
                                <div className="flex flex-col gap-3 mt-2">
                                    {['It does not matter, we go based on price and qualifications', 'It matters a lot', 'It helps but it is not primary decision factor.'].map(impactOpt => (
                                        <label key={impactOpt} className={`radio-option ${generalData.follow_up_impact === impactOpt ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="follow_up_impact"
                                                value={impactOpt}
                                                checked={generalData.follow_up_impact === impactOpt}
                                                onChange={(e) => handleGeneralChange('follow_up_impact', e.target.value)}
                                                disabled={locked}
                                            />
                                            <span className="leading-snug mt-0.5">{impactOpt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Submit Bar */}
            {!locked && (
                <div
                    className="flex flex-col md:flex-row md:justify-between items-center bg-surface p-4 rounded-lg border border-surface-border sticky z-50 transition-all shadow-lg backdrop-blur-md"
                    style={{ bottom: '15px', margin: '0 15px 15px 15px' }}
                >
                    <div className="text-secondary text-sm mb-3 md:mb-0 text-center md:text-left hidden md:block w-full md:w-auto">
                        You can safely close this page and return later. Your progress is autosaved.
                    </div>
                    <div className="w-full md:w-auto flex justify-center md:justify-end md:ml-auto">
                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary shadow-lg shadow-primary/20 px-10 py-4 flex items-center justify-center gap-2 font-bold text-xl w-full md:w-auto transition-all hover:scale-105"
                        >
                            Submit Feedback <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
