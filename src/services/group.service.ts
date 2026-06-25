import { prisma } from "../prisma.js";
import { generateGroupCode } from "../utils/generatedCode.js";

export async function create() {
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

    const newGroup = await prisma.group.create({
        data: {
            code: code,
            adminUser: {
                create: {
                    pseudo: "Host",
                    token: adminToken,
                },
            },
            members: {
                connect: {
                    token: adminToken,
                },
            },
        },
        include: {
            adminUser: true,
        },
    });

    return {
        code: newGroup.code,
        maxUsers: newGroup.maxUsers,
        adminToken: adminToken,
    };
}

export async function join(groupId: string, pseudo: string) {
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

export async function info(groupId: string) {
    const group = await prisma.group.findUnique({
        where: { code: groupId },
        include: {
            code: true,
            maxUsers: true,
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

export async function leave(userId: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) throw new Error("User not found");

    return await prisma.user.delete({
        where: { id: userId },
    });
}

export async function setProvider(userId: number, provider: "youtube") {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            group: true,
        },
    });

    if (!user) throw new Error("User not found");
    if (!user.group) throw new Error("User is not in a group");

    return await prisma.group.update({
        where: { code: user.group.code },
        data: { provider },
    });
}
