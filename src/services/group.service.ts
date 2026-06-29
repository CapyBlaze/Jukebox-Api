import { prisma } from "../prisma.js";
import { generateGroupCode } from "../utils/generatedCode.js";

type token = `${string}-${string}-${string}-${string}-${string}`;

export async function create(): Promise<{
    code: string;
    maxUsers: number;
    adminToken: string;
}> {
    let code = "";
    let groupExists = true;

    while (groupExists) {
        code = generateGroupCode();
        const existing = await prisma.group.findUnique({
            where: { code },
        });
        if (!existing) groupExists = false;
    }

    const adminToken = crypto.randomUUID();

    return await prisma.$transaction(async (tx) => {
        const newGroup = await tx.group.create({
            data: { code },
        });

        const adminUser = await tx.user.create({
            data: {
                pseudo: "Host",
                token: adminToken,
                groupId: newGroup.code,
            },
        });

        await tx.group.update({
            where: { code },
            data: {
                adminId: adminUser.id,
                members: {
                    connect: {
                        id: adminUser.id,
                    },
                },
            },
        });

        return {
            code: newGroup.code,
            maxUsers: newGroup.maxUsers,
            adminToken: adminToken,
        };
    });
}

export async function join(groupId: string, pseudo: string): Promise<token> {
    const group = await prisma.group.findUnique({
        where: { code: groupId },
        include: {
            members: true,
        },
    });

    if (!group) throw new Error("Group not found");

    const user = group.members.find((user) => user.pseudo === pseudo);
    if (user) throw new Error("Pseudo already taken");
    if (group.members.length >= group.maxUsers) throw new Error("Group is full");

    const token = crypto.randomUUID();
    await prisma.group.update({
        where: { code: groupId },
        data: {
            members: {
                create: {
                    pseudo,
                    token,
                },
            },
        },
    });

    return token;
}

export async function info(groupId: string): Promise<{
    code: string;
    numberOfUsers: number;
    maxUsers: number;
    members: { pseudo: string }[];
}> {
    const group = await prisma.group.findUnique({
        where: { code: groupId },
        include: {
            members: true,
        },
    });

    if (!group) throw new Error("Group not found");

    return {
        code: group.code,
        numberOfUsers: group.members.length,
        maxUsers: group.maxUsers,
        members: group.members.map((user) => ({
            pseudo: user.pseudo,
        })),
    };
}

export async function leave(userId: number): Promise<{
    pseudo: string;
    createdAt: Date;
    updatedAt: Date;
    groupId: string;
}> {
    const userFind = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!userFind) throw new Error("User not found");

    const user = await prisma.user.delete({
        where: { id: userId },
    });

    return {
        pseudo: user.pseudo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        groupId: user.groupId,
    };
}

export async function setProvider(groupId: string, provider: "youtube") {
    const group = await prisma.group.update({
        where: { code: groupId },
        data: { provider },
    });

    return {
        code: group.code,
        provider: group.provider,
        isPlaying: group.isPlaying,
    };
}

export async function rotateStreamToken(groupId: string): Promise<string | null> {
    const newStreamToken = crypto.randomUUID();
    await prisma.group.update({
        where: { code: groupId },
        data: { streamToken: newStreamToken },
    });

    return newStreamToken;
}

export async function jukeboxToken(groupId: string): Promise<string | null> {
    const group = await prisma.group.findUnique({
        where: { code: groupId },
        select: { streamToken: true },
    });

    if (!group) return null;

    return group.streamToken;
}

export async function updateMaxUsers(
    groupId: string,
    maxUsers: number
): Promise<{
    code: string;
    maxUsers: number;
}> {
    return await prisma.group.update({
        where: { code: groupId },
        data: { maxUsers },
        select: { code: true, maxUsers: true },
    });
}
