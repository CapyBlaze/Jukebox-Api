import os from "os";
import systeminformation from "systeminformation";
import { Body, Controller, Get, Post, Route, Security, Tags } from "tsoa";

import { SecurityRole } from "../middlewares/auth.middleware.js";
import * as AdminService from "../services/admin.service.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

interface RegisterAdminBody {
    username: string;
    password: string;
}

interface IPBanBody {
    ipAddress: string;
}

@Route("admin")
@Tags("Admin")
export class AdminController extends Controller {
    @Post("login")
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

    @Post("ip/ban")
    @Security(SecurityRole.Admin)
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

    @Post("ip/unban")
    @Security(SecurityRole.Admin)
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

    @Get("stats")
    @Security(SecurityRole.Admin)
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
