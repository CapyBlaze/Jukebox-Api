import { Body, Controller, Delete, Get, Path, Post, Request, Route, Security, Tags } from "tsoa";

import { SecurityRole } from "../middlewares/auth.middleware.js";
import * as VoteService from "../services/vote.service.js";
import type { AuthenticatedAdminRequest, AuthenticatedRequest } from "../types/express.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

interface CreateVoteBody {
    title: string;
    url: string;
    timeoutSec?: number;
}

interface VoteBody {
    isUpvote: boolean;
}

@Route("group/vote")
@Tags("Vote")
export class VoteController extends Controller {
    @Get("{voteId}")
    @Security(SecurityRole.UserGroup)
    public async get(
        @Path() voteId: number,
        @Request() req: AuthenticatedAdminRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const groupId = user.managedGroup.code;

        const vote = await VoteService.get(groupId, voteId);
        return ApiResponse.success("Vote retrieved successfully", vote);
    }

    @Post("create")
    @Security(SecurityRole.AdminGroup)
    public async create(
        @Request() req: AuthenticatedAdminRequest,
        @Body() body: CreateVoteBody
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const groupId = user.managedGroup.code;
        const { title, url, timeoutSec } = body;

        const vote = await VoteService.create(groupId, user, title, url, timeoutSec);
        return ApiResponse.success("Vote created successfully", vote);
    }

    @Delete("{voteId}")
    @Security(SecurityRole.AdminGroup)
    public async delete(
        @Path() voteId: number,
        @Request() req: AuthenticatedAdminRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const groupId = user.managedGroup.code;

        const vote = await VoteService.deleteVote(groupId, voteId);
        return ApiResponse.success("Vote deleted successfully", vote);
    }

    @Post("{voteId}/vote")
    @Security(SecurityRole.UserGroup)
    public async vote(
        @Path() voteId: number,
        @Body() body: VoteBody,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const { isUpvote } = body;

        const vote = await VoteService.vote(user.groupId, voteId, user.id, isUpvote);

        return ApiResponse.success("Vote cast successfully", vote);
    }
}
