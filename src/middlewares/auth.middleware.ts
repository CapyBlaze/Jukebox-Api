import type { Request } from "express";

import { prisma } from "../prisma.js";
import { adminSessions } from "../services/admin.service.js";
import { HttpError } from "./error.middleware.js";

export async function expressAuthentication(request: Request, securityName: string): Promise<any> {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        throw new HttpError(401, "Missing Token", "Token is missing");
    }

    const targetGroupId = request.params.groupId ?? request.params.id;

    switch (securityName) {
        case "userGroupAuth": {
            const user = await prisma.user.findUnique({
                where: { token },
            });

            if (!user) {
                throw new HttpError(401, "Invalid Token", "Token does not match any user");
            }

            if (targetGroupId && user.groupId !== targetGroupId) {
                throw new HttpError(403, "Forbidden", "User does not belong to this group");
            }

            return user;
        }

        case "adminGroupAuth": {
            const user = await prisma.user.findUnique({
                where: { token },
                include: {
                    managedGroup: true,
                },
            });

            if (!user) {
                throw new HttpError(401, "Invalid Token", "Token does not match any user");
            }

            if (!user.managedGroup) {
                throw new HttpError(403, "Forbidden", "User is not an admin of any group");
            }

            if (targetGroupId && user.managedGroup.code !== targetGroupId) {
                throw new HttpError(403, "Forbidden", "User does not manage this group");
            }

            return user;
        }

        case "adminAuth": {
            const session = adminSessions.get(token);

            if (!session) {
                throw new HttpError(401, "Invalid Token", "Token does not match any admin session");
            }

            if (session.expiresAt < new Date()) {
                adminSessions.delete(token);
                throw new HttpError(401, "Session Expired", "Admin session has expired");
            }

            return {
                type: "admin",
                createdAt: session.createdAt,
                expiresAt: session.expiresAt,
            };
        }

        default: {
            throw new HttpError(500, "Unknown Security Scheme", "Unknown security scheme");
        }
    }
}
