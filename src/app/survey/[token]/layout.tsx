import { Suspense } from 'react';
import SurveyNavbar from '@/components/SurveyNavbar';
import Footer from '@/components/Footer';

export default function SurveyLayout(props: {
    children: React.ReactNode;
    params: Promise<{ token: string }>;
}) {
    return (
        <div className="survey-layout-container">
            <SurveyNavbar />

            <main className="content-container flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-4xl mx-auto">
                    <Suspense fallback={<div className="p-8 text-center text-secondary">Loading survey...</div>}>
                        {props.children}
                    </Suspense>
                </div>
            </main>

            <Footer />
        </div>
    );
}
