import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Path,
    Post,
    Request,
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
    @Post("create")
    public async createGroup(): Promise<ApiResponseFormat> {
        const group = await GroupService.create();

        this.setStatus(201);
        return ApiResponse.success("Group created", group);
    }

    @Post("{groupId}/join")
    public async joinGroup(
        @Path() groupId: string,
        @Body() body: JoinBody
    ): Promise<ApiResponseFormat> {
        const { pseudo } = body;

        if (!pseudo) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "Pseudo is required");
        }

        const token = await GroupService.join(groupId, pseudo);
        return ApiResponse.success("User joined group", { token });
    }

    @Get("")
    @Security(SecurityRole.UserGroup)
    public async listUsers(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const group = await GroupService.info(user.groupId);

        return ApiResponse.success("Group information", group);
    }

    @Delete("leave")
    @Security(SecurityRole.UserGroup)
    public async leaveGroup(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;

        const result = await GroupService.leave(user.id);

        return ApiResponse.success("User left group", {
            pseudo: result.pseudo,
            groupId: result.groupId,
        });
    }

    @Patch("provider")
    @Security(SecurityRole.AdminGroup)
    public async setProvider(
        @Request() req: AuthenticatedAdminRequest,
        @Body() body: SetProviderBody
    ): Promise<ApiResponseFormat> {
        const groupId = req.user.managedGroup.code;
        const { provider } = body;

        const result = await GroupService.setProvider(groupId, provider);

        return ApiResponse.success("Provider set", result);
    }

    @Get("jukebox/token")
    @Security(SecurityRole.AdminGroup)
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

    @Patch("jukebox/rotate")
    @Security(SecurityRole.AdminGroup)
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
