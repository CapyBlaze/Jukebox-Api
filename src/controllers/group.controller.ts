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

interface UpdateMaxUsersBody {
    maxUsers: number;
}

@Route("group")
@Tags("Group")
export class GroupController extends Controller {
    /** Create a new group and return its access code and admin token. */
    @Post("create")
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Group created",
        "data": {
            "code": "1ARM6G",
            "maxUsers": 10,
            "adminToken": "49efc6d7-3fb7-410e-a063-1fc35c1bdde6"
        },
        "timestamp": "2026-06-29T15:16:24.692Z"
    })
    public async createGroup(): Promise<ApiResponseFormat> {
        const group = await GroupService.create();

        this.setStatus(201);
        return ApiResponse.success("Group created", group);
    }

    /** Join an existing group using its code and a chosen pseudo. */
    @Post("{groupId}/join")
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "User joined group",
        "data": {
            "token": "3760c6c5-1515-460f-9d26-2aad9b49cfe4"
        },
        "timestamp": "2026-06-29T15:28:16.960Z"
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
        "success": true,
        "message": "Group information",
        "data": {
            "code": "1ARM6G",
            "numberOfUsers": 2,
            "maxUsers": 10,
            "members": [
                {
                    "pseudo": "Host"
                },
                {
                    "pseudo": "Sterling26"
                }
            ]
        },
        "timestamp": "2026-06-29T15:28:45.304Z"
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
        "success": true,
        "message": "User left group",
        "data": {
            "pseudo": "Sterling26",
            "groupId": "1ARM6G"
        },
        "timestamp": "2026-06-29T15:31:12.878Z"
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
        "success": true,
        "message": "Provider set",
        "data": {
            "code": "1ARM6G",
            "provider": "youtube",
            "isPlaying": false
        },
        "timestamp": "2026-06-29T15:31:43.435Z"
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

    /** Update the maximum number of users allowed in the group. */
    @Patch("max-users")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Max users updated",
        "data": {
            "code": "1ARM6G",
            "maxUsers": 15
        },
        "timestamp": "2026-06-29T15:33:34.377Z"
    })
    @Response<ApiResponseFormat>(400, "Invalid input")
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async updateMaxUsers(
        @Request() req: AuthenticatedAdminRequest,
        @Body() body: UpdateMaxUsersBody
    ): Promise<ApiResponseFormat> {
        const groupId = req.user.managedGroup.code;
        const { maxUsers } = body;

        if (maxUsers === undefined || maxUsers < 1) {
            this.setStatus(400);
            return ApiResponse.error("Invalid input", "maxUsers must be a positive integer");
        }

        const result = await GroupService.updateMaxUsers(groupId, maxUsers);

        return ApiResponse.success("Max users updated", result);
    }

    /** Retrieve the current jukebox stream token for the group. */
    @Get("jukebox/token")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Stream token retrieved",
        "data": {
            "streamToken": "3f2f4dde-f0c6-457d-a0d9-6c698c24d353"
        },
        "timestamp": "2026-06-29T15:33:48.840Z"
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
    @Patch("jukebox/token/rotate")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Stream token rotated successfully",
        "data": {
            "newStreamToken": "2da9464a-243f-4025-99a5-09398e0e72a4"
        },
        "timestamp": "2026-06-29T15:34:46.674Z"
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
