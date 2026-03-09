import { validateSurveyToken } from '@/lib/survey-auth';
import prisma from '@/lib/prisma';
import FeedbackFormClient from './FeedbackFormClient';
import { redirect } from 'next/navigation';

export default async function FeedbackPage(props: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const batchId = searchParams.batch as string;
    const tokenRecord = await validateSurveyToken(params.token, batchId);
    if (!tokenRecord) return null;

    const feedbackItems = await prisma.feedbackItem.findMany({
        where: {
            contactId: tokenRecord.contactId as string,
            batchId: batchId,
            status: { in: ['InProgress', 'Submitted'] }
        },
        include: {
            project: true,
            contact: true,
            company: {
                include: {
                    projectInvites: {
                        include: {
                            contact: true
                        }
                    }
                }
            }
        },
        orderBy: { project: { project_name: 'asc' } }
    });

    if (feedbackItems.length === 0) {
        redirect(`/survey/${params.token}/projects?batch=${batchId}`);
    }

    return (
        <FeedbackFormClient
            items={feedbackItems}
            token={params.token}
            batchId={batchId}
            currentContactId={tokenRecord.contactId as string}
        />
    );
}
