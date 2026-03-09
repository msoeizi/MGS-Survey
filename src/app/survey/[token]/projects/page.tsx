import { validateSurveyToken } from '@/lib/survey-auth';
import prisma from '@/lib/prisma';
import ProjectSelectionClient from './ProjectSelectionClient';

export default async function ProjectSelectionPage(props: {
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
            contactId: tokenRecord.contactId as string, // Filter by the specific estimator
            batchId: batchId,
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
        }
    });

    if (feedbackItems.length === 0) {
        return (
            <div className="glass-panel p-8 text-center text-secondary">
                No projects found for your company in this campaign.
            </div>
        );
    }
    const initialSelection = feedbackItems
        .filter((f: any) => f.status !== 'Draft')
        .map((f: any) => f.projectId);

    return (
        <ProjectSelectionClient
            items={feedbackItems}
            initialSelection={initialSelection}
            token={params.token}
            batchId={batchId}
            currentContactId={tokenRecord.contactId as string}
        />
    );
}
