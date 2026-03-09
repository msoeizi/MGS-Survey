import { validateSurveyToken } from '@/lib/survey-auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function SurveyLandingPage(props: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const batchId = searchParams.batch as string;
    const tokenRecord = await validateSurveyToken(params.token, batchId);
    if (!tokenRecord) return null; // handled by layout

    const company = await prisma.company.findUnique({
        where: { id: tokenRecord.companyId },
        include: { _count: { select: { projectInvites: true } } }
    });

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });

    let contactName = 'our team';
    if (tokenRecord.contactId) {
        const contact = await prisma.contact.findUnique({ where: { id: tokenRecord.contactId } });
        if (contact) contactName = contact.name;
    }

    return (
        <div className="animate-slide-down">
            <div className="glass-panel p-8 md:p-12 text-center shadow-xl max-w-2xl mx-auto mt-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Hello, {contactName}</h1>
                <p className="text-xl text-secondary mb-8 leading-relaxed">
                    Welcome to the feedback portal for <strong className="text-primary">{company?.name}</strong>.
                </p>

                <div className="bg-surface p-6 rounded-lg text-left mb-8 border border-surface-border inline-block w-full">
                    <h3 className="font-semibold text-lg text-primary mb-2">Campaign: {batch?.name}</h3>
                    <p className="text-secondary mb-4">
                        You have been invited to provide feedback on your recent tendered projects.
                        This information helps us understand the market and improve future collaborations.
                    </p>
                    <ul className="list-disc pl-5 text-sm text-secondary space-y-2">
                        <li>Please review your invited projects and select the ones you want to provide feedback on.</li>
                        <li>You can save your progress and return later using the same link.</li>
                        <li>Once submitted, your responses will be sent directly to our team.</li>
                    </ul>
                </div>

                <Link
                    href={`/survey/${params.token}/projects?batch=${batchId}`}
                    className="btn btn-primary w-full md:w-auto px-12 py-4 text-lg !rounded-full shadow-lg shadow-primary/30 hover:scale-105 transform transition-transform"
                >
                    View My Projects
                </Link>
            </div>
        </div>
    );
}
