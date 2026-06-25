import type { Queue } from "@prisma/client";

import { prisma } from "../prisma.js";

export async function getQueue(groupId: string): Promise<Queue[]> {
    const queue = await prisma.queue.findMany({
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
): Promise<Queue> {
    const addedMusic = await prisma.queue.create({
        data: {
            groupId,
            title,
            url,
            userId,
        },
    });

    return addedMusic;
}

export async function deleteFromQueue(groupId: string, musicId: number): Promise<Queue> {
    const deletedMusic = await prisma.queue.delete({
        where: {
            id: musicId,
            groupId,
        },
    });

    return deletedMusic;
}
