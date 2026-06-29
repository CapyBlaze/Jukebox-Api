import { z } from "zod";

import { config } from "../config/config.js";
import { prisma } from "../prisma.js";
import { parseIsoDuration } from "../utils/parseIsoDuration.js";
import * as CacheService from "./cache.service.js";

const API_KEY = process.env.YOUTUBE_API_KEY;

const YouTubeSearchResultSchema = z.object({
    kind: z.string().nullable().default(null),
    etag: z.string().nullable().default(null),
    id: z
        .object({
            kind: z.string().nullable().default(null),
            videoId: z.string().nullable().default(null),
            channelId: z.string().optional().nullable().default(null),
            playlistId: z.string().optional().nullable().default(null),
        })
        .nullable()
        .default(null),
    snippet: z
        .object({
            publishedAt: z.string().nullable().default(null),
            channelId: z.string().nullable().default(null),
            title: z.string().nullable().default(null),
            description: z.string().nullable().default(null),
            thumbnails: z
                .object({
                    default: z
                        .object({
                            url: z.string().nullable().default(null),
                            width: z.number().nullable().default(null),
                            height: z.number().nullable().default(null),
                        })
                        .nullable()
                        .default(null),
                    medium: z
                        .object({
                            url: z.string().nullable().default(null),
                            width: z.number().nullable().default(null),
                            height: z.number().nullable().default(null),
                        })
                        .nullable()
                        .default(null),
                    high: z
                        .object({
                            url: z.string().nullable().default(null),
                            width: z.number().nullable().default(null),
                            height: z.number().nullable().default(null),
                        })
                        .nullable()
                        .default(null),
                })
                .nullable()
                .default(null),
            channelTitle: z.string().nullable().default(null),
            liveBroadcastContent: z.string().nullable().default(null),
        })
        .nullable()
        .default(null),
});

const YouTubeSearchResultArraySchema = z.array(YouTubeSearchResultSchema);
export type YouTubeSearchResult = z.infer<typeof YouTubeSearchResultSchema>;

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
    const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setUTCHours(23, 59, 59, 999));

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
                startDate: todayStart,
                endDate: todayEnd,
            },
        },
    });

    if (usage && usage.used >= config.data.apiLimitDay.youtube) {
        throw new Error("YouTube API usage limit reached for today");
    }

    if (!API_KEY) {
        throw new Error("YouTube API key is not set");
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
    const validatedItems = YouTubeSearchResultArraySchema.parse(data.items);

    await prisma.apiUsage.upsert({
        where: {
            provider_startDate_endDate: {
                provider: "youtube",
                startDate: todayStart,
                endDate: todayEnd,
            },
        },
        update: {
            used: { increment: 100 },
        },
        create: {
            provider: "youtube",
            startDate: todayStart,
            endDate: todayEnd,
            used: 100,
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
            results: validatedItems,
        },
        create: {
            provider: "youtube",
            query,
            results: validatedItems,
        },
    });

    await CacheService.cleanupSearchCache();

    return validatedItems;
}

export async function durationYoutube(videoId: string): Promise<number | null> {
    const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setUTCHours(23, 59, 59, 999));

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
                startDate: todayStart,
                endDate: todayEnd,
            },
        },
    });

    if (usage && usage.used >= config.data.apiLimitDay.youtube) {
        throw new Error("YouTube API usage limit reached for today");
    }

    if (!API_KEY) {
        throw new Error("YouTube API key is not set");
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
                startDate: todayStart,
                endDate: todayEnd,
            },
        },
        update: {
            used: { increment: 1 },
        },
        create: {
            provider: "youtube",
            startDate: todayStart,
            endDate: todayEnd,
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

    await CacheService.cleanupMetadataCache();

    return durationSec;
}
