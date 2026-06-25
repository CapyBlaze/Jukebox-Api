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
    @Security("userGroupAuth")
    public async listUsers(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const group = await GroupService.info(user.groupId);

        return ApiResponse.success("Group information", group);
    }

    @Delete("leave")
    @Security("userGroupAuth")
    public async leaveGroup(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;

        const result = await GroupService.leave(user.id);

        return ApiResponse.success("User left group", {
            pseudo: result.pseudo,
            groupId: result.groupId,
        });
    }

    @Patch("provider")
    @Security("adminGroupAuth")
    public async setProvider(
        @Request() req: AuthenticatedAdminRequest,
        @Body() body: SetProviderBody
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const { provider } = body;

        const result = await GroupService.setProvider(user.id, provider);

        return ApiResponse.success("Provider set", result);
    }
}
