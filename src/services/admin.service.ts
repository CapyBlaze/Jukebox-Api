import type { ApiUsage, Group, IpBan, User } from "@prisma/client";

import { HttpError } from "../middlewares/error.middleware.js";
import { prisma } from "../prisma.js";

export const adminSessions = new Map<
    string,
    {
        createdAt: Date;
        expiresAt: Date;
    }
>();

type token = `${string}-${string}-${string}-${string}-${string}`;

export async function login(username: string, password: string): Promise<token> {
    const usernameEnv = process.env.ADMIN_USERNAME || "admin";
    const passwordEnv = process.env.ADMIN_PASSWORD || crypto.randomUUID();

    if (username !== usernameEnv || password !== passwordEnv) {
        throw new HttpError(401, "Invalid Credentials", "Invalid username or password");
    }

    let token = crypto.randomUUID();

    adminSessions.set(token, {
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000), // 24h
    });

    return token;
}

export async function deleteGroup(groupId: string): Promise<Group | null> {
    const groupExists = await prisma.group.findUnique({
        where: {
            code: groupId,
        },
    });

    if (!groupExists) return null;

    return await prisma.$transaction(async (tx) => {
        await tx.vote.deleteMany({
            where: {
                groupId: groupId,
            },
        });

        await tx.music.deleteMany({
            where: {
                groupId: groupId,
            },
        });

        await tx.group.update({
            where: { code: groupId },
            data: { adminId: null },
        });

        await tx.user.deleteMany({
            where: {
                groupId: groupId,
            },
        });

        return await tx.group.delete({
            where: {
                code: groupId,
            },
        });
    });
}

export async function deleteUser(userId: number): Promise<User | null> {
    const userExists = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!userExists) return null;

    return await prisma.$transaction(async (tx) => {
        await tx.vote.deleteMany({
            where: {
                userId: userId,
            },
        });

        await tx.music.deleteMany({
            where: {
                userId: userId,
            },
        });

        return await tx.user.delete({
            where: {
                id: userId,
            },
        });
    });
}

export async function ipBanned(ipAddress: string): Promise<IpBan> {
    return await prisma.ipBan.create({
        data: {
            ipAddress,
        },
    });
}

export async function ipUnbanned(ipAddress: string): Promise<IpBan> {
    return await prisma.ipBan.delete({
        where: {
            ipAddress,
        },
    });
}

export async function getBannedIps(): Promise<IpBan[]> {
    return await prisma.ipBan.findMany({
        select: {
            id: true,
            ipAddress: true,
            bannedAt: true,
        },
    });
}

export async function countGroups(): Promise<number> {
    return await prisma.group.count();
}

export async function countUsers(): Promise<number> {
    return await prisma.user.count();
}

export async function clearCache(): Promise<void> {
    await prisma.searchCache.deleteMany({});
    await prisma.metadataCache.deleteMany({});
}

export async function getYoutubeApiUsage(): Promise<ApiUsage[]> {
    return await prisma.apiUsage.findMany({
        where: {
            startDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
            endDate: new Date(new Date().setUTCHours(23, 59, 59, 999)),
        },
    });
}
