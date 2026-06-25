import { HttpError } from "../middlewares/error.middleware.js";
import { prisma } from "../prisma.js";

export const adminSessions = new Map<
    string,
    {
        createdAt: Date;
        expiresAt: Date;
    }
>();

export async function login(username: string, password: string) {
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

export async function ipBanned(ipAddress: string) {
    return await prisma.ipBan.create({
        data: {
            ipAddress,
        },
    });
}

export async function ipUnbanned(ipAddress: string) {
    return await prisma.ipBan.delete({
        where: {
            ipAddress,
        },
    });
}

export async function getBannedIps() {
    return await prisma.ipBan.findMany({
        select: {
            ipAddress: true,
            bannedAt: true,
        },
    });
}
