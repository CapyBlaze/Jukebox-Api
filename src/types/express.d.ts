import { type Group, User } from "@prisma/client";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export interface AuthenticatedRequest extends Express.Request {
    user: User;
}

export interface AuthenticatedAdminRequest extends Express.Request {
    user: User & { managedGroup: Group };
}
