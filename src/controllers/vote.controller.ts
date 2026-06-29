import { Body, Controller, Delete, Example, Get, Path, Post, Request, Response, Route, Security, Tags } from "tsoa";

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
    /** Get details of a specific vote. */
    @Get("{voteId}")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Vote retrieved successfully",
        data: {
            id: 4,
            title: "Skip this song?",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            userId: 2,
            groupId: "X7K2QP",
            endDate: "2026-06-17T18:35:00.000Z",
            upVote: 3,
            downVote: 1,
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async get(
        @Path() voteId: number,
        @Request() req: AuthenticatedAdminRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const groupId = user.managedGroup.code;

        const vote = await VoteService.get(groupId, voteId);
        return ApiResponse.success("Vote retrieved successfully", vote);
    }

    /** Create a new vote for the group (e.g. to skip a song or like a song). Defaults to a 3-minute timeout. */
    @Post("create")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Vote created successfully",
        data: {
            id: 5,
            title: "Skip this song?",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            userId: 1,
            groupId: "X7K2QP",
            endDate: "2026-06-17T18:33:00.000Z",
            upVote: 0,
            downVote: 0,
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
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

    /** Delete an existing vote. */
    @Delete("{voteId}")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Vote deleted successfully",
        data: {
            id: 5,
            title: "Skip this song?",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            userId: 1,
            groupId: "X7K2QP",
            endDate: "2026-06-17T18:33:00.000Z",
            upVote: 4,
            downVote: 1,
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async delete(
        @Path() voteId: number,
        @Request() req: AuthenticatedAdminRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const groupId = user.managedGroup.code;

        const vote = await VoteService.deleteVote(groupId, voteId);
        return ApiResponse.success("Vote deleted successfully", vote);
    }

    /** Cast an upvote or downvote on an existing vote. */
    @Post("{voteId}/vote")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Vote cast successfully",
        data: {
            id: 5,
            title: "Skip this song?",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            userId: 3,
            groupId: "X7K2QP",
            endDate: "2026-06-17T18:33:00.000Z",
            upVote: 5,
            downVote: 1,
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
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
