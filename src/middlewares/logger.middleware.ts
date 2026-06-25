import type { NextFunction, Request, Response } from "express";
import pc from "picocolors";

export function loggerHandler(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();
    const date = new Date().toISOString();
    const method = req.method;
    const url = req.url;

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown Agent";

    res.on("finish", () => {
        const diff = process.hrtime(start);
        const durationInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        const status = res.statusCode;

        let statusStr = `${status}`;
        let statusColor = pc.green;

        if (status === 404) {
            statusColor = pc.yellow;
            statusStr = `NOT FOUND ${status}`;
        } else if (status === 403) {
            statusColor = pc.red;
            statusStr = `FORBIDDEN ${status}`;
        } else if (status === 429) {
            statusColor = pc.red;
            statusStr = `RATE LIMITED ${status}`;
        } else if (status >= 500) {
            statusColor = pc.red;
            statusStr = `SERVER ERROR ${status}`;
        } else if (status >= 400) {
            statusColor = pc.yellow;
        }

        console.log(
            `${pc.gray(`[${date}]`)} ` +
                `${statusColor(pc.bold(statusStr))} ` +
                `${url.startsWith("/admin") ? pc.red(pc.bold("ADMIN ")) : ""}` +
                `${pc.cyan(method)} ` +
                `${url.startsWith("/admin") ? pc.red(url) : pc.blue(url)} - ` +
                `IP: ${pc.magenta(ip as string)} - ` +
                `Agent: ${pc.dim(userAgent)} - ` +
                `${pc.yellow(`${durationInMs}ms`)}`
        );
    });

    next();
}
