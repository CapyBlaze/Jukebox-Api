import type { Request } from "express";

import { prisma } from "../prisma.js";
import { adminSessions } from "../services/admin.service.js";
import { HttpError } from "./error.middleware.js";

export enum SecurityRole {
    UserGroup = "userGroupAuth",
    AdminGroup = "adminGroupAuth",
    Admin = "adminAuth",
}

export async function expressAuthentication(request: Request, securityName: string): Promise<any> {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        throw new HttpError(401, "Missing Token", "Token is missing");
    }

    switch (securityName) {
        case SecurityRole.UserGroup: {
            const user = await prisma.user.findUnique({
                where: { token },
            });

            if (!user) {
                throw new HttpError(401, "Invalid Token", "Token does not match any user");
            }

            return user;
        }

        case SecurityRole.AdminGroup: {
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

            return user;
        }

        case SecurityRole.Admin: {
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
