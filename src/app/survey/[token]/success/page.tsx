import { validateSurveyToken } from '@/lib/survey-auth';
import { CheckCircle } from 'lucide-react';

export default async function SuccessPage(props: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const batchId = searchParams.batch as string;
    const tokenRecord = await validateSurveyToken(params.token, batchId);
    if (!tokenRecord) return null;

    return (
        <div className="animate-fade-in flex items-center justify-center pt-24">
            <div className="glass-card text-center p-12 max-w-xl shadow-xl w-full">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center animate-slide-down">
                        <CheckCircle className="w-12 h-12" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-4">Feedback Submitted Successfully</h1>
                <p className="text-secondary leading-relaxed mb-8">
                    Thank you for providing your feedback. Your responses have been securely transmitted to our team and locked.
                </p>
                <button className="btn btn-secondary w-full cursor-not-allowed opacity-50" disabled>
                    Form Locked
                </button>
            </div>
        </div>
    );
}
