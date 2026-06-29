import os from "os";
import systeminformation from "systeminformation";
import { Body, Controller, Delete, Example, Get, Patch, Post, Response, Route, Security, Tags } from "tsoa";

import { SecurityRole } from "../middlewares/auth.middleware.js";
import * as AdminService from "../services/admin.service.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";
import { config } from "../config/config.js";

interface RegisterAdminBody {
    username: string;
    password: string;
}

interface IPBanBody {
    ipAddress: string;
}

interface UpdateApiLimitBody {
    youtubeLimit: number;
}

interface UpdateCacheSizeBody {
    searchCacheLineSize?: number; 
    metadataCacheLineSize?: number;
}

@Route("admin")
@Tags("Admin")
export class AdminController extends Controller {
    /** Authenticate as an administrator and receive the bearer token required for admin routes. */
    @Post("login")
    @Example<ApiResponseFormat>({
        success: true,
        message: "User logged in",
        data: {
            token: "admin_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
            name: "admin",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(400, "Missing credentials")
    public async login(@Body() body: RegisterAdminBody): Promise<ApiResponseFormat> {
        const { username, password } = body;

        if (!username || !password) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "Username and password are required");
        }

        const token = await AdminService.login(username, password);

        this.setStatus(201);
        return ApiResponse.success("User logged in", {
            token: token,
            name: username,
        });
    }

    /** Ban an IP address from accessing the API. */
    @Post("ip/ban")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        success: true,
        message: "IP banned",
        data: { ipAddress: "203.0.113.42" },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(400, "Missing IP address")
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async banIP(@Body() body: IPBanBody): Promise<ApiResponseFormat> {
        const { ipAddress } = body;

        if (!ipAddress) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "IP address is required");
        }

        await AdminService.ipBanned(body.ipAddress);

        return ApiResponse.success("IP banned", {
            ipAddress: body.ipAddress,
        });
    }

    /** Remove a ban from an IP address. */
    @Post("ip/unban")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        success: true,
        message: "IP unbanned",
        data: { ipAddress: "203.0.113.42" },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(400, "Missing IP address")
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async unbanIP(@Body() body: IPBanBody): Promise<ApiResponseFormat> {
        const { ipAddress } = body;

        if (!ipAddress) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "IP address is required");
        }

        await AdminService.ipUnbanned(body.ipAddress);

        return ApiResponse.success("IP unbanned", {
            ipAddress: body.ipAddress,
        });
    }

    /** Update the daily YouTube API call limit. */
    @Patch("api/limit")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        success: true,
        message: "YouTube API limit updated",
        data: {
            youtubeLimit: 10000,
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(400, "Invalid input")
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async updateApiLimit(@Body() body: UpdateApiLimitBody): Promise<ApiResponseFormat> {
        const { youtubeLimit } = body;

        if (youtubeLimit === undefined || youtubeLimit < 0) {
            this.setStatus(400);
            return ApiResponse.error("Invalid input", "YouTube API limit must be a non-negative number");
        }

        config.data.apiLimitDay.youtube = youtubeLimit;
        await config.save();

        return ApiResponse.success("YouTube API limit updated", {
            youtubeLimit: youtubeLimit,
        });
    }

    /** Update the maximum number of cache lines for the search and metadata caches. */
    @Patch("cache/size")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Cache sizes updated",
        data: {
            searchCacheLineSize: 100,
            metadataCacheLineSize: 100,
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(400, "Invalid input")
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async updateCacheSize(@Body() body: UpdateCacheSizeBody): Promise<ApiResponseFormat> {
        const { searchCacheLineSize, metadataCacheLineSize } = body;

        if (searchCacheLineSize !== undefined) {
            if (searchCacheLineSize < 0) {
                this.setStatus(400);
                return ApiResponse.error("Invalid input", "Search cache line size must be a non-negative number");
            }
        }

        if (metadataCacheLineSize !== undefined) {
            if (metadataCacheLineSize < 0) {
                this.setStatus(400);
                return ApiResponse.error("Invalid input", "Metadata cache line size must be a non-negative number");
            }
        }

        config.data.maxCacheLine.search = searchCacheLineSize ?? config.data.maxCacheLine.search;
        config.data.maxCacheLine.metadata = metadataCacheLineSize ?? config.data.maxCacheLine.metadata;
        await config.save();

        return ApiResponse.success("Cache sizes updated", {
            searchCacheLineSize: searchCacheLineSize,
            metadataCacheLineSize: metadataCacheLineSize,
        });
    }

    /** Clear all server-side caches (search and metadata). */
    @Delete("cache/clear")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Cache cleared",
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async clearCache(): Promise<ApiResponseFormat> {
        await AdminService.clearCache();
        return ApiResponse.success("Cache cleared");
    }

    /** Get global game totals and host resource statistics for the admin dashboard. */
    @Get("stats")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Admin stats fetched",
        data: {
            groups: 4,
            users: 18,
            apiVersion: "1.0.0",
            uptime: 86400,
            memory: {
                usedMB: 512,
                freeMB: 1536,
                totalMB: 2048,
                usagePercent: 25,
            },
            cpuUsage: "12.34%",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async getStats(): Promise<ApiResponseFormat> {
        const load = await systeminformation.currentLoad();
        const mem = await systeminformation.mem();

        const groups = await AdminService.countGroups();
        const users = await AdminService.countUsers();

        return ApiResponse.success("Admin stats fetched", {
            groups: groups,
            users: users,
            apiVersion: process.env.API_VERSION || "unknown",
            uptime: os.uptime(),
            memory: {
                usedMB: Math.round(mem.used / 1024 / 1024),
                freeMB: Math.round(mem.free / 1024 / 1024),
                totalMB: Math.round(mem.total / 1024 / 1024),
                usagePercent: Number(((mem.used / mem.total) * 100).toFixed(2)),
            },
            cpuUsage: `${load.currentLoad.toFixed(2)}%`,
        });
    }
}
