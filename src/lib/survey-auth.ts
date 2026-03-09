import prisma from './prisma';

export async function validateSurveyToken(rawToken: string, batchId: string) {
    if (!rawToken || !batchId) return null;

    // We must find the correct token by checking all active tokens for this batch
    // Bcrypt verify is slow (~100ms per check), so we fetch all valid tokens for the batch
    // and check until one matches. This is standard for hashed tokens unless we prefix them.
    // In a real high-throughput scenario, strongly typed encrypted strings are better than bcrypt hashes for URLs.

    // With raw token storage, we can perform a direct indexed database lookup
    const tokenRecord = await prisma.accessToken.findFirst({
        where: { batchId, token: rawToken, revoked_at: null }
    });

    if (tokenRecord) {
        // Update last used at
        await prisma.accessToken.update({
            where: { id: tokenRecord.id },
            data: { last_used_at: new Date() }
        });
        return tokenRecord;
    }

    return null;
}
