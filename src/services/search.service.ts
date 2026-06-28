import { z } from "zod";

import { prisma } from "../prisma.js";
import { parseIsoDuration } from "../utils/parseIsoDuration.js";

const API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeSearchResult {
    kind: string;
    etag: string;
    id: {
        kind: string;
        videoId: string;
    };
    snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
            default: {
                url: string;
            };
            medium: {
                url: string;
            };
            high: {
                url: string;
            };
        };
        channelTitle: string;
        liveBroadcastContent: string;
        publishTime: string;
    };
}

const YouTubeSearchResultSchema = z.object({
    kind: z.string(),
    etag: z.string(),
    id: z.object({
        kind: z.string(),
        videoId: z.string(),
    }),
    snippet: z.object({
        publishedAt: z.string(),
        channelId: z.string(),
        title: z.string(),
        description: z.string(),
        thumbnails: z.object({
            default: z.object({ url: z.string() }),
            medium: z.object({ url: z.string() }),
            high: z.object({ url: z.string() }),
        }),
        channelTitle: z.string(),
        liveBroadcastContent: z.string(),
        publishTime: z.string(),
    }),
});

const YouTubeSearchResultArraySchema = z.array(YouTubeSearchResultSchema);

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
    const cache = await prisma.searchCache.findUnique({
        where: {
            provider_query: {
                provider: "youtube",
                query,
            },
        },
    });

    if (cache) {
        return YouTubeSearchResultArraySchema.parse(cache.results);
    }

    const usage = await prisma.apiUsage.findUnique({
        where: {
            provider_startDate_endDate: {
                provider: "youtube",
                startDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
                endDate: new Date(new Date().setUTCHours(23, 59, 59, 999)),
            },
        },
    });

    if (usage && usage.used >= 10000) {
        throw new Error("YouTube API usage limit reached for today");
    }

    const params = new URLSearchParams({
        key: API_KEY!,
        part: "snippet",
        q: query,
        type: "video",
        maxResults: "50",
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    await prisma.apiUsage.upsert({
        where: {
            provider_startDate_endDate: {
                provider: "youtube",
                startDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
                endDate: new Date(new Date().setUTCHours(23, 59, 59, 999)),
            },
        },
        update: {
            used: { increment: 100 },
        },
        create: {
            provider: "youtube",
            startDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
            endDate: new Date(new Date().setUTCHours(23, 59, 59, 999)),
            used: 1,
        },
    });

    await prisma.searchCache.upsert({
        where: {
            provider_query: {
                provider: "youtube",
                query,
            },
        },
        update: {
            results: data.items,
        },
        create: {
            provider: "youtube",
            query,
            results: data.items,
        },
    });

    return data.items;
}

export async function durationYoutube(videoId: string): Promise<number | null> {
    const cache = await prisma.metadataCache.findUnique({
        where: {
            provider_providerKey: {
                provider: "youtube",
                providerKey: videoId,
            },
        },
    });

    if (cache) {
        return cache.durationSec;
    }

    const usage = await prisma.apiUsage.findUnique({
        where: {
            provider_startDate_endDate: {
                provider: "youtube",
                startDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
                endDate: new Date(new Date().setUTCHours(23, 59, 59, 999)),
            },
        },
    });

    if (usage && usage.used >= 10000) {
        throw new Error("YouTube API usage limit reached for today");
    }

    const params = new URLSearchParams({
        key: API_KEY!,
        part: "contentDetails",
        id: videoId,
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    if (!response.ok) return null;

    await prisma.apiUsage.upsert({
        where: {
            provider_startDate_endDate: {
                provider: "youtube",
                startDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
                endDate: new Date(new Date().setUTCHours(23, 59, 59, 999)),
            },
        },
        update: {
            used: { increment: 1 },
        },
        create: {
            provider: "youtube",
            startDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
            endDate: new Date(new Date().setUTCHours(23, 59, 59, 999)),
            used: 1,
        },
    });

    const data = await response.json();
    const iso = data.items?.[0]?.contentDetails?.duration;
    if (!iso) return null;

    const durationSec = parseIsoDuration(iso);

    await prisma.metadataCache.upsert({
        where: {
            provider_providerKey: {
                provider: "youtube",
                providerKey: videoId,
            },
        },
        update: {
            durationSec,
        },
        create: {
            provider: "youtube",
            providerKey: videoId,
            durationSec,
        },
    });

    return durationSec;
}
