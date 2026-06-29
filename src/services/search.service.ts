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

const YouTubePlaylistItemSchema = z.object({
    kind: z.string().nullable().default(null),
    etag: z.string().nullable().default(null),
    id: z.string().nullable().default(null),
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
            videoOwnerChannelTitle: z.string().nullable().default(null),
            videoOwnerChannelId: z.string().nullable().default(null),
            playlistId: z.string().nullable().default(null),
            position: z.number().nullable().default(null),
            resourceId: z
                .object({
                    kind: z.string().nullable().default(null),
                    videoId: z.string().nullable().default(null),
                })
                .nullable()
                .default(null),
        })
        .nullable()
        .default(null),
    contentDetails: z
        .object({
            videoId: z.string().nullable().default(null),
            startAt: z.string().nullable().default(null),
            endAt: z.string().nullable().default(null),
            note: z.string().nullable().default(null),
            videoPublishedAt: z.string().nullable().default(null),
        })
        .nullable()
        .default(null),
    status: z
        .object({
            privacyStatus: z.string().nullable().default(null),
        })
        .nullable()
        .default(null),
});
const YouTubePlaylistItemArraySchema = z.array(YouTubePlaylistItemSchema);
export type YouTubePlaylistItem = z.infer<typeof YouTubePlaylistItemArraySchema>;

export async function searchYouTube(
    query: string,
    maxResults?: number,
    pageToken?: string,
    type?: "video" | "playlist"
): Promise<{
    items: YouTubeSearchResult[];
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    nextPageToken: string;
    prevPageToken: string;
}> {
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
        return {
            items: YouTubeSearchResultArraySchema.parse(cache.results),
            pageInfo: {
                totalResults: 0,
                resultsPerPage: 0,
            },
            nextPageToken: "",
            prevPageToken: "",
        };
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
        type: type || "video",
        maxResults: (maxResults || 50).toString(),
    });

    if (pageToken) {
        params.append("pageToken", pageToken);
    }

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

    return {
        items: validatedItems,
        pageInfo: {
            totalResults: data.pageInfo?.totalResults || 0,
            resultsPerPage: data.pageInfo?.resultsPerPage || 0,
        },
        nextPageToken: data.nextPageToken || "",
        prevPageToken: data.prevPageToken || "",
    };
}

function chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

export async function durationYoutube(videoId: string): Promise<number | null>;
export async function durationYoutube(videoId: string[]): Promise<number[]>;
export async function durationYoutube(
    videoId: string | string[]
): Promise<number | number[] | null> {
    if (Array.isArray(videoId)) {
        return durationYoutubeMany(videoId);
    }
    return durationYoutubeOne(videoId);
}

async function durationYoutubeOne(videoId: string): Promise<number | null> {
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

    const fetched = await fetchAndCacheDurations([videoId]);
    return fetched.get(videoId) ?? null;
}

async function durationYoutubeMany(videoIds: string[]): Promise<number[]> {
    if (videoIds.length === 0) return [];

    const cached = await prisma.metadataCache.findMany({
        where: {
            provider: "youtube",
            providerKey: { in: videoIds },
        },
    });

    const durationMap = new Map<string, number>();
    for (const entry of cached) {
        durationMap.set(entry.providerKey, entry.durationSec);
    }

    const missingIds = videoIds.filter((id) => !durationMap.has(id));

    if (missingIds.length > 0) {
        const fetched = await fetchAndCacheDurations(missingIds);
        for (const [id, duration] of fetched) {
            durationMap.set(id, duration);
        }
    }

    return videoIds.map((id) => durationMap.get(id) ?? 0);
}

async function fetchAndCacheDurations(videoIds: string[]): Promise<Map<string, number>> {
    if (!API_KEY) {
        throw new Error("YouTube API key is not set");
    }

    const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setUTCHours(23, 59, 59, 999));

    const result = new Map<string, number>();
    const batches = chunk(videoIds, 50);

    for (const batch of batches) {
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

        const params = new URLSearchParams({
            key: API_KEY,
            part: "contentDetails",
            id: batch.join(","),
        });

        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
        if (!response.ok) continue;

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
        const items = data.items ?? [];

        for (const item of items) {
            const iso = item.contentDetails?.duration;
            if (!iso) continue;

            const durationSec = parseIsoDuration(iso);
            result.set(item.id, durationSec);

            await prisma.metadataCache.upsert({
                where: {
                    provider_providerKey: {
                        provider: "youtube",
                        providerKey: item.id,
                    },
                },
                update: {
                    durationSec,
                },
                create: {
                    provider: "youtube",
                    providerKey: item.id,
                    durationSec,
                },
            });
        }
    }

    await CacheService.cleanupMetadataCache();

    return result;
}

export async function playlistYoutube(playlistId: string) {
    const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setUTCHours(23, 59, 59, 999));

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
        playlistId: playlistId,
        maxResults: "50",
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const validatedItems = YouTubePlaylistItemArraySchema.parse(data.items);

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

    return validatedItems;
}
