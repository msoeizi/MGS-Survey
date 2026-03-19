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
        <div className="animate-fade-in flex items-center justify-center pt-24 pb-12 px-4">
            <div className="glass-panel text-center p-8 md:p-14 max-w-xl shadow-2xl w-full border-t-8 border-success">
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center animate-bounce-subtle">
                        <CheckCircle className="w-14 h-14" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold mb-6 tracking-tight">Thank You!</h1>
                <p className="text-lg text-secondary leading-relaxed mb-10">
                    We truly appreciate you sharing your insights with us. Your professional perspective is invaluable for our growth and directly helps us refine our service and partnership with your team.
                </p>
                <div className="bg-success/5 border border-success/20 rounded-xl p-6 mb-10 text-base text-success font-medium">
                    Your feedback has been securely received and recorded for our team to review.
                </div>
                
                <div className="flex flex-col gap-4">
                    <a 
                        href="https://www.moderngrains.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary py-4 px-8 text-lg shadow-lg shadow-primary/20 hover:scale-105 transform transition-all"
                    >
                        Visit Modern Grains Website
                    </a>
                    <p className="text-xs text-secondary/60 mt-4">
                        You can safely close this window.
                    </p>
                </div>
            </div>
        </div>
    );
}
