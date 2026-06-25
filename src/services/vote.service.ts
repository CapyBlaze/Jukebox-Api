import type { User } from "@prisma/client";

import { prisma } from "../prisma.js";

export async function create(
    groupId: string,
    user: User,
    title: string,
    url: string,
    timeoutSec: number = 3 * 60
) {
    return await prisma.vote.create({
        data: {
            title,
            url,
            userId: user.id,
            groupId,
            endDate: new Date(Date.now() + timeoutSec * 1000),
        },
    });
}

export async function deleteVote(groupId: string, voteId: number) {
    return await prisma.vote.delete({
        where: {
            id: voteId,
            groupId,
        },
    });
}

export async function vote(groupId: string, voteId: number, userId: number, isUpvote: boolean) {
    return await prisma.vote.update({
        where: {
            id: voteId,
            groupId,
        },
        data: {
            userId,
            upVote: isUpvote ? { increment: 1 } : undefined,
            downVote: !isUpvote ? { increment: 1 } : undefined,
        },
    });
}

export async function get(groupId: string, voteId: number) {
    return await prisma.vote.findUnique({
        where: {
            id: voteId,
            groupId,
        },
    });
}
