import type { NextFunction, Request, Response } from "express";

import { getBannedIps } from "../services/admin.service.js";
import { ApiResponse } from "../utils/apiResponse.js";

export async function ipBannedHandler(req: Request, res: Response, next: NextFunction) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const bannedIps = await getBannedIps();

    if (bannedIps.some((bannedIp) => bannedIp.ipAddress === ip)) {
        return res.status(403).json(ApiResponse.error("Forbidden", "Your IP address is banned."));
    }

    next();
}
