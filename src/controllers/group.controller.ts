import {
    Body,
    Controller,
    Delete,
    Example,
    Get,
    Patch,
    Path,
    Post,
    Request,
    Response,
    Route,
    Security,
    Tags,
} from "tsoa";

import { SecurityRole } from "../middlewares/auth.middleware.js";
import * as GroupService from "../services/group.service.js";
import type { AuthenticatedAdminRequest, AuthenticatedRequest } from "../types/express.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

interface JoinBody {
    pseudo: string;
}

interface SetProviderBody {
    provider: "youtube";
}

@Route("group")
@Tags("Group")
export class GroupController extends Controller {
    /** Create a new group and return its access code and admin token. */
    @Post("create")
    @Example<ApiResponseFormat>({
        success: true,
        message: "Group created",
        data: {
            code: "X7K2QP",
            maxUsers: 20,
            adminToken: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    public async createGroup(): Promise<ApiResponseFormat> {
        const group = await GroupService.create();

        this.setStatus(201);
        return ApiResponse.success("Group created", group);
    }

    /** Join an existing group using its code and a chosen pseudo. */
    @Post("{groupId}/join")
    @Example<ApiResponseFormat>({
        success: true,
        message: "User joined group",
        data: {
            token: "8e2f9c1a-3b4d-4e5f-9a0b-1c2d3e4f5a6b",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(400, "Information missing")
    @Response<ApiResponseFormat>(404, "Group not found")
    @Response<ApiResponseFormat>(409, "Conflict")
    public async joinGroup(
        @Path() groupId: string,
        @Body() body: JoinBody
    ): Promise<ApiResponseFormat> {
        const { pseudo } = body;

        if (!pseudo) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "Pseudo is required");
        }

        try {
            const token = await GroupService.join(groupId, pseudo);
            return ApiResponse.success("User joined group", { 
                token 
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";

            if (message === "Group not found") {
                this.setStatus(404);
                return ApiResponse.error("Group not found", message);
            }

            this.setStatus(409);
            return ApiResponse.error("Cannot join group", message);
        }
    }

    /** Get information about the group the authenticated user belongs to. */
    @Get("")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Group information",
        data: {
            code: "X7K2QP",
            numberOfUsers: 2,
            maxUsers: 20,
            members: [
                { pseudo: "Host" },
                { pseudo: "Alice" },
            ],
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async listUsers(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const group = await GroupService.info(user.groupId);

        return ApiResponse.success("Group information", group);
    }

    /** Remove the authenticated user from their current group. */
    @Delete("leave")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "User left group",
        data: {
            pseudo: "Alice",
            groupId: "X7K2QP",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async leaveGroup(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;

        const result = await GroupService.leave(user.id);

        return ApiResponse.success("User left group", {
            pseudo: result.pseudo,
            groupId: result.groupId,
        });
    }

    /** Set the music provider used by the group (currently only YouTube is supported). */
    @Patch("provider")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Provider set",
        data: {
            code: "X7K2QP",
            provider: "youtube",
            isPlaying: false,
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async setProvider(
        @Request() req: AuthenticatedAdminRequest,
        @Body() body: SetProviderBody
    ): Promise<ApiResponseFormat> {
        const groupId = req.user.managedGroup.code;
        const { provider } = body;

        const result = await GroupService.setProvider(groupId, provider);

        return ApiResponse.success("Provider set", result);
    }

    /** Retrieve the current jukebox stream token for the group. */
    @Get("jukebox/token")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Stream token retrieved",
        data: {
            streamToken: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(404, "Stream token not found")
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async getStreamToken(@Request() req: AuthenticatedAdminRequest): Promise<ApiResponseFormat> {
        const groupId = req.user.managedGroup.code;
        const streamToken = await GroupService.jukeboxToken(groupId);

        if (!streamToken) {
            this.setStatus(404);
            return ApiResponse.error("Stream token not found", "No stream token available for the specified group");
        }

        return ApiResponse.success("Stream token retrieved", {
            streamToken,
        });
    }

    /** Generate a new jukebox stream token, invalidating the previous one. */
    @Patch("jukebox/rotate")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Stream token rotated successfully",
        data: {
            newStreamToken: "8e2f9c1a-3b4d-4e5f-9a0b-1c2d3e4f5a6b",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async rotateStreamToken(
        @Request() req: AuthenticatedAdminRequest,
    ): Promise<ApiResponseFormat> {
        const groupId = req.user.managedGroup.code;
        const newToken = await GroupService.rotateStreamToken(groupId);

        return ApiResponse.success("Stream token rotated successfully", {
            newStreamToken: newToken,
        });
    }
}
