import os from "os";
import systeminformation from "systeminformation";
import { Body, Controller, Delete, Example, Get, Patch, Path, Post, Response, Route, Security, Tags } from "tsoa";

import { SecurityRole } from "../middlewares/auth.middleware.js";
import * as AdminService from "../services/admin.service.js";
import * as CacheService from "../services/cache.service.js";
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
        "success": true,
        "message": "User logged in",
        "data": {
            "token": "1c565e42-3f76-4f78-b9a4-26dcddac786c",
            "name": "admin"
        },
        "timestamp": "2026-06-29T16:14:18.099Z"
    })
    @Response<ApiResponseFormat>(400, "Missing credentials")
    public async login(@Body() body: RegisterAdminBody): Promise<ApiResponseFormat> {
        const { username, password } = body;

        if (!username || !password) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "Username and password are required");
        }

        const token = await AdminService.login(username, password);

        this.setStatus(200);
        return ApiResponse.success("User logged in", {
            token: token,
            name: username,
        });
    }

    /** Delete a group. */
    @Delete("group/{groupId}")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Group deleted",
        "timestamp": "2026-06-30T09:35:59.762Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    @Response<ApiResponseFormat>(404, "Group not found")
    public async deleteGroup(@Path() groupId: string): Promise<ApiResponseFormat> {
        const groupDeleted = await AdminService.deleteGroup(groupId);

        if (!groupDeleted) {
            this.setStatus(404);
            return ApiResponse.error("Group not found", `No group found with ID: ${groupId}`);
        }

        return ApiResponse.success("Group deleted");
    }

    /** Delete a user. */
    @Delete("user/{userId}")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "User deleted",
        "timestamp": "2026-06-30T09:35:09.457Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    @Response<ApiResponseFormat>(404, "User not found")
    public async deleteUser(@Path() userId: number): Promise<ApiResponseFormat> {
        const userDeleted = await AdminService.deleteUser(userId);

        if (!userDeleted) {
            this.setStatus(404);
            return ApiResponse.error("User not found", `No user found with ID: ${userId}`);
        }

        return ApiResponse.success("User deleted");
    }

    /** Ban an IP address from accessing the API. */
    @Post("ip/ban")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "IP banned",
        "data": {
            "ipAddress": "203.0.113.42"
        },
        "timestamp": "2026-06-29T16:18:49.137Z"
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
        "success": true,
        "message": "IP unbanned",
        "data": {
            "ipAddress": "203.0.113.42"
        },
        "timestamp": "2026-06-29T16:21:02.254Z"
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

    /** Get a list of all banned IP addresses. */
    @Get("ip/banned")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Banned IPs fetched",
        "data": [
            {
                "ipAddress": "203.0.113.42",
                "bannedAt": "2026-06-29T16:18:49.126Z"
            }
        ],
        "timestamp": "2026-06-29T16:20:28.338Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async getBannedIPs(): Promise<ApiResponseFormat> {
        const bannedIps = await AdminService.getBannedIps();

        const formattedBannedIps = bannedIps.map((ban) => ({
            ipAddress: ban.ipAddress,
            bannedAt: ban.bannedAt,
        }));

        return ApiResponse.success("Banned IPs fetched", formattedBannedIps);
    }
    
    /** Get the current daily YouTube API call limit. */
    @Get("api/limit")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "YouTube API limit fetched",
        "data": {
            "youtubeLimit": 10000
        },
        "timestamp": "2026-06-29T16:32:05.221Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async getApiLimit(): Promise<ApiResponseFormat> {
        return ApiResponse.success("YouTube API limit fetched", {
            youtubeLimit: config.data.apiLimitDay.youtube,
        });
    }

    /** Get the current YouTube API usage for the day. */
    @Get("api/usage")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "YouTube API usage fetched",
        "data": [
            {
                "id": "cmqzdv4130000xkkli9ocs5y6",
                "provider": "youtube",
                "startDate": "2026-06-29T00:00:00.000Z",
                "endDate": "2026-06-29T23:59:59.999Z",
                "used": 101,
                "lastUsed": "2026-06-29T15:39:13.575Z"
            }
        ],
        "timestamp": "2026-06-29T16:32:42.506Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async getApiUsage(): Promise<ApiResponseFormat> {
        const apiUsage = await AdminService.getYoutubeApiUsage();
        return ApiResponse.success("YouTube API usage fetched", apiUsage);
    }

    /** Update the daily YouTube API call limit. */
    @Patch("api/limit")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "YouTube API limit updated",
        "data": {
            "youtubeLimit": 10000
        },
        "timestamp": "2026-06-29T16:23:09.664Z"
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

    /** Get the current maximum cache line sizes for search and metadata caches. */
    @Get("cache/size")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Cache sizes fetched",
        "data": {
            "searchCacheLineSize": 100,
            "metadataCacheLineSize": 100
        },
        "timestamp": "2026-06-29T23:09:59.432Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async getCacheSize(): Promise<ApiResponseFormat> {
        return ApiResponse.success("Cache sizes fetched", {
            searchCacheLineSize: config.data.maxCacheLine.search,
            metadataCacheLineSize: config.data.maxCacheLine.metadata,
        });
    }

    /** Update the maximum number of cache lines for the search and metadata caches. */
    @Patch("cache/size")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Cache sizes updated",
        "data": {
            "searchCacheLineSize": 200,
            "metadataCacheLineSize": 500
        },
        "timestamp": "2026-06-29T16:24:06.726Z"
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
        "success": true,
        "message": "Cache cleared",
        "timestamp": "2026-06-29T16:24:30.768Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async clearCache(): Promise<ApiResponseFormat> {
        await AdminService.clearCache();
        return ApiResponse.success("Cache cleared");
    }

    /** Cleanup the search and metadata caches. */
    @Post("cache/cleanup")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Cache cleanup completed",
        "timestamp": "2026-06-29T23:10:45.888Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async cleanupCache(): Promise<ApiResponseFormat> {
        await CacheService.cleanupSearchCache();
        await CacheService.cleanupMetadataCache();
        return ApiResponse.success("Cache cleanup completed");
    }

    /** Get global game totals and host resource statistics for the admin dashboard. */
    @Get("stats")
    @Security(SecurityRole.Admin)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Admin stats fetched",
        "data": {
            "groups": 2,
            "users": 3,
            "apiVersion": "v1",
            "uptime": 22045,
            "memory": {
                "usedMB": 18570,
                "freeMB": 13555,
                "totalMB": 32125,
                "usagePercent": 57.81
            },
            "cpuUsage": "9.36%"
        },
        "timestamp": "2026-06-29T16:25:03.147Z"
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
