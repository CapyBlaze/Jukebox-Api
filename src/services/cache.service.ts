import { config } from "../config/config.js";
import { prisma } from "../prisma.js";

export async function cleanupSearchCache() {
    while (true) {
        const size = await prisma.searchCache.count();
        if (size <= config.data.maxCacheLine.search) break;

        const oldest = await prisma.searchCache.findFirst({
            orderBy: { createdAt: "asc" },
            select: {
                provider: true,
                query: true,
            },
        });

        if (!oldest) break;

        await prisma.searchCache.delete({
            where: {
                provider_query: {
                    provider: oldest.provider,
                    query: oldest.query,
                },
            },
        });
    }
}

export async function cleanupMetadataCache() {
    while (true) {
        const size = await prisma.metadataCache.count();
        if (size <= config.data.maxCacheLine.metadata) break;

        const oldest = await prisma.metadataCache.findFirst({
            orderBy: { fetchedAt: "asc" },
            select: {
                provider: true,
                providerKey: true,
            },
        });

        if (!oldest) break;

        await prisma.metadataCache.delete({
            where: {
                provider_providerKey: {
                    provider: oldest.provider,
                    providerKey: oldest.providerKey,
                },
            },
        });
    }
}
