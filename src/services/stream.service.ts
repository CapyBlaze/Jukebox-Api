import { prisma } from "../prisma.js";

export async function groupByStreamToken(streamToken: string) {
    return await prisma.group.findFirst({
        where: { streamToken },
    });
}
