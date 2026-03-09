"use client"
import { useState } from 'react';
import { UploadCloud, FileType, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ processed: number, errors?: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const processImport = () => {
        if (!file) return;
        setUploading(true);
        setResult(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async function (results) {
                try {
                    const res = await fetch('/api/admin/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: results.data })
                    });

                    const data = await res.json();
                    if (res.ok) {
                        setResult({ processed: data.processed, errors: data.errors });
                    } else {
                        setResult({ processed: 0, errors: [data.error || 'Server error'] });
                    }
                } catch (err) {
                    setResult({ processed: 0, errors: ['Network error occurred.'] });
                } finally {
                    setUploading(false);
                }
            },
            error: function (err) {
                setResult({ processed: 0, errors: [err.message] });
                setUploading(false);
            }
        });
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                    <UploadCloud className="text-accent w-8 h-8" />
                    Data Import
                </h1>
                <p className="text-secondary">Upload a CSV file to instantiate or update Companies, Contacts, and Projects.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-panel p-8 text-center flex flex-col items-center justify-center border-dashed border-2">
                    <FileType className="w-16 h-16 text-secondary mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select CSV File</h3>
                    <p className="text-sm text-secondary mb-6">File must contain required headers.</p>

                    <label className="btn btn-secondary cursor-pointer relative overflow-hidden">
                        <span>Browse Files</span>
                        <input
                            type="file"
                            accept=".csv"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            onChange={handleFileChange}
                        />
                    </label>

                    {file && (
                        <div className="mt-4 p-3 bg-surface rounded flex items-center gap-2 text-sm text-primary">
                            <CheckCircle className="w-4 h-4" /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                    )}

                    <button
                        className="btn btn-primary w-full mt-6"
                        disabled={!file || uploading}
                        onClick={processImport}
                    >
                        {uploading ? 'Processing Data...' : 'Import Data'}
                    </button>
                </div>

                <div className="glass-card flex flex-col justify-center">
                    <h3 className="text-lg font-bold mb-4 border-b border-surface-border pb-2">Required CSV Columns</h3>
                    <ul className="space-y-3 text-sm text-secondary">
                        <li><strong className="text-foreground">CompanyName</strong> <span className="text-danger">*</span></li>
                        <li><strong className="text-foreground">ProjectID</strong> <span className="text-danger">*</span> (Unique tracker)</li>
                        <li><strong className="text-foreground">ProjectName</strong> <span className="text-danger">*</span></li>
                        <li><strong className="text-foreground">ContactName</strong></li>
                        <li><strong className="text-foreground">ContactEmail</strong></li>
                        <li><strong className="text-foreground">InvitedDate</strong> (YYYY-MM-DD format)</li>
                        <li><strong className="text-foreground">SubmittedPrice</strong> (Numeric, no currency symbols)</li>
                    </ul>
                </div>
            </div>

            {result && (
                <div className="mt-8">
                    {result.processed > 0 && (
                        <div className="p-4 bg-success/10 border border-success/30 rounded-md text-success flex items-center gap-3 mb-4">
                            <CheckCircle className="w-5 h-5" />
                            Successfully processed {result.processed} records!
                        </div>
                    )}

                    {result.errors && result.errors.length > 0 && (
                        <div className="p-4 bg-danger/10 border border-danger/30 rounded-md">
                            <div className="flex items-center gap-2 text-danger mb-2 font-bold">
                                <AlertCircle className="w-5 h-5" />
                                Encountered {result.errors.length} errors:
                            </div>
                            <ul className="list-disc pl-5 text-sm text-danger/80 max-h-40 overflow-y-auto">
                                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
