import type { Music } from "@prisma/client";

import { prisma } from "../prisma.js";
import * as SearchService from "./search.service.js";

export async function getQueue(groupId: string): Promise<Music[]> {
    const queue = await prisma.music.findMany({
        where: {
            groupId,
        },
        orderBy: {
            id: "asc",
        },
    });

    return queue;
}

export async function addToQueue(
    groupId: string,
    userId: number,
    title: string,
    provider: string,
    providerKey: string,
    durationSec: number | null
): Promise<Music> {
    const addedMusic = await prisma.music.create({
        data: {
            groupId,
            title,
            provider,
            providerKey,
            durationSec,
            userId,
        },
    });

    return addedMusic;
}

export async function addPlaylistToQueue(
    groupId: string,
    userId: number,
    provider: string,
    playlistKey: string
): Promise<Music[]> {
    const playlistItems = await SearchService.playlistYoutube(playlistKey);

    const videos = playlistItems
        .map((item) => ({
            videoId: item.contentDetails?.videoId,
            title: item.snippet?.title ?? "Unknown Title",
        }))
        .filter((video): video is { videoId: string; title: string } => Boolean(video.videoId));

    const videoIds = videos.map((v) => v.videoId);
    const durations = await SearchService.durationYoutube(videoIds);

    const resultsAdded = await prisma.$transaction(
        videos.map((video, i) =>
            prisma.music.create({
                data: {
                    groupId,
                    title: video.title,
                    provider,
                    providerKey: video.videoId,
                    durationSec: durations[i],
                    userId,
                },
            })
        )
    );

    return resultsAdded;
}

export async function deleteFromQueue(groupId: string, musicId: number): Promise<Music> {
    const deletedMusic = await prisma.music.delete({
        where: {
            id: musicId,
            groupId,
        },
    });

    return deletedMusic;
}

export async function getCurrent(
    groupId: string
): Promise<(Music & { startedAt: Date | null; isPlaying: boolean }) | null> {
    const group = await prisma.group.findUnique({
        where: { code: groupId },
    });

    if (!group || !group.currentTrackId) return null;

    const currentTrack = await prisma.music.findUnique({
        where: {
            id: group.currentTrackId,
        },
    });

    if (!currentTrack) return null;

    return {
        ...currentTrack,
        startedAt: group.playbackStartedAt,
        isPlaying: group.isPlaying,
    };
}

export async function play(groupId: string): Promise<Music | null> {
    const result = await prisma.$transaction(async (tx) => {
        const group = await tx.group.findUnique({
            where: { code: groupId },
        });

        if (!group) return null;

        if (group.currentTrackId && !group.isPlaying) {
            const resumeFrom = group.pausedAtSec ?? 0;

            await tx.group.update({
                where: {
                    code: groupId,
                },
                data: {
                    isPlaying: true,
                    playbackStartedAt: new Date(Date.now() - resumeFrom * 1000),
                    pausedAtSec: null,
                },
            });
            return tx.music.findUnique({
                where: {
                    id: group.currentTrackId,
                },
            });
        }

        const queue = await tx.music.findMany({
            where: {
                groupId,
            },
            orderBy: {
                addedAt: "asc",
            },
        });

        if (queue.length === 0) return null;

        const currentTrackIndex = queue.findIndex((music) => music.id === group.currentTrackId);
        const nextIndex = currentTrackIndex === -1 ? 0 : (currentTrackIndex + 1) % queue.length;

        await tx.group.update({
            where: {
                code: groupId,
            },
            data: {
                currentTrackId: queue[nextIndex]?.id || null,
                playbackStartedAt: new Date(),
                isPlaying: true,
            },
        });

        return queue[nextIndex] || null;
    });

    return result;
}

export async function pause(groupId: string): Promise<void> {
    const group = await prisma.group.findUnique({
        where: {
            code: groupId,
        },
    });

    if (!group || !group.playbackStartedAt) return;

    const elapsedTimeSec = Math.floor((Date.now() - group.playbackStartedAt.getTime()) / 1000);

    await prisma.group.update({
        where: {
            code: groupId,
        },
        data: {
            isPlaying: false,
            pausedAtSec: elapsedTimeSec,
        },
    });
}

export async function skip(groupId: string): Promise<Music | null> {
    const result = await prisma.$transaction(async (tx) => {
        const group = await tx.group.findUnique({
            where: { code: groupId },
        });

        if (!group) return null;

        const queue = await tx.music.findMany({
            where: {
                groupId,
            },
            orderBy: {
                addedAt: "asc",
            },
        });

        if (queue.length === 0) return null;

        const currentTrackIndex = queue.findIndex((music) => music.id === group?.currentTrackId);
        const nextIndex = currentTrackIndex === -1 ? 0 : (currentTrackIndex + 1) % queue.length;

        await tx.group.update({
            where: {
                code: groupId,
            },
            data: {
                playbackStartedAt: group.isPlaying ? new Date() : null,
                currentTrackId: queue[nextIndex]?.id || null,
            },
        });

        return queue[nextIndex] || null;
    });

    return result;
}
