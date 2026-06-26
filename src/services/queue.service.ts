import type { Music } from "@prisma/client";

import { prisma } from "../prisma.js";

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
    url: string
): Promise<Music> {
    const addedMusic = await prisma.music.create({
        data: {
            groupId,
            title,
            url,
            userId,
        },
    });

    return addedMusic;
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

export async function getCurrent(groupId: string): Promise<Music | null> {
    const group = await prisma.group.findUnique({
        where: { code: groupId },
    });

    if (!group || !group.currentTrackId) return null;

    const currentTrack = await prisma.music.findUnique({
        where: {
            id: group.currentTrackId,
        },
    });

    return currentTrack;
}

export async function play(groupId: string): Promise<Music | null> {
    const group = await prisma.group.findUnique({
        where: { code: groupId },
    });

    if (!group) return null;

    const queue = await prisma.music.findMany({
        where: {
            groupId,
        },
        orderBy: {
            addedAt: "asc",
        },
    });

    if (queue.length === 0) return null;

    const currentTrackIndex = queue.findIndex((music) => music.id === group?.currentTrackId);

    if (currentTrackIndex !== -1 && currentTrackIndex === queue.length - 1) {
        return queue[0] || null;
    }

    await prisma.group.update({
        where: {
            code: groupId,
        },
        data: {
            currentTrackId: queue[currentTrackIndex + 1]?.id || null,
            isPlaying: true,
        },
    });

    return queue[currentTrackIndex + 1] || null;
}

export async function pause(groupId: string): Promise<void> {
    await prisma.group.update({
        where: {
            code: groupId,
        },
        data: {
            isPlaying: false,
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

        if (currentTrackIndex !== -1 && currentTrackIndex === queue.length - 1) {
            return queue[0] || null;
        }

        await prisma.group.update({
            where: {
                code: groupId,
            },
            data: {
                currentTrackId: queue[currentTrackIndex + 1]?.id || null,
            },
        });

        return queue[currentTrackIndex + 1] || null;
    });

    return result;
}
