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
            <div className="glass-panel p-8 md:p-14 text-left shadow-xl max-w-2xl mx-auto mt-12 flex flex-col items-center">
                <h1 className="text-4xl font-bold tracking-tight mb-10 text-center">Hello, {contactName}</h1>
                <p className="text-xl text-secondary mb-10 leading-relaxed w-full">
                    We truly appreciate you taking the time to provide feedback on your experience with {company?.name}.
                </p>

                <div className="space-y-8 text-secondary leading-relaxed w-full">
                    <p className="text-lg">
                        Thank you for taking the time to provide feedback on our recent project tenders. Your insights are incredibly valuable to us as we strive to better serve your team and improve our partnership.
                    </p>
                    <p>
                        We’ve listed a few projects where we recently submitted pricing. For each one, we would greatly appreciate your professional perspective on:
                    </p>
                    <ul className="list-disc pl-8 space-y-4 text-sm">
                        <li>Whether the project has been awarded and if our pricing was competitive.</li>
                        <li>Any specific areas where we could have improved our proposal to better align with your needs.</li>
                        <li>General feedback on how we can make our working relationship even stronger.</li>
                    </ul>
                    <p className="font-medium text-primary italic text-center pt-6 max-w-lg mx-auto">
                        Your honest feedback is the most important tool we have for growth. Thank you for your continued partnership.
                    </p>
                </div>

                <div className="mt-12 w-full flex justify-center">
                    <Link
                        href={`/survey/${params.token}/projects?batch=${batchId}`}
                        className="btn btn-primary px-10 py-4 text-lg !rounded-full shadow-lg shadow-primary/30 hover:bg-primary-hover hover:text-white transform transition-all hover:-translate-y-1 active:scale-95 whitespace-nowrap"
                    >
                        View Tendered Projects
                    </Link>
                </div>
            </div>
        </div>
    );
}
