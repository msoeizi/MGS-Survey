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
                <h1 className="text-3xl font-bold mb-4">Thank You for Your Feedback</h1>
                <p className="text-secondary leading-relaxed mb-8">
                    We truly appreciate you sharing your insights with us. Your professional perspective is invaluable for our growth and helps us refine our partnership with your team.
                </p>
                <div className="bg-success/5 border border-success/20 rounded-lg p-4 mb-8 text-sm text-success">
                    Your responses have been securely received and recorded.
                </div>
                <button className="btn btn-secondary w-full cursor-not-allowed opacity-50" disabled>
                    Form Locked
                </button>
            </div>
        </div>
    );
}
