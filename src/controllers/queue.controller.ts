import { Body, Controller, Delete, Get, Path, Post, Request, Route, Security, Tags } from "tsoa";

import { SecurityRole } from "../middlewares/auth.middleware.js";
import * as QueueService from "../services/queue.service.js";
import type { AuthenticatedRequest } from "../types/express.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

interface AddToQueueBody {
    title: string;
    url: string;
}

@Route("group/queue")
@Tags("Queue")
export class QueueController extends Controller {
    @Get("")
    @Security(SecurityRole.UserGroup)
    public async getQueue(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const queue = await QueueService.getQueue(user.groupId);

        const updatedQueue = queue.map((item, i) => {
            return {
                ...item,
                position: i + 1,
            };
        });

        return ApiResponse.success("Queue information", updatedQueue);
    }

    @Post("")
    @Security(SecurityRole.UserGroup)
    public async addToQueue(
        @Body() body: AddToQueueBody,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const { title, url } = body;

        const addedMusic = await QueueService.addToQueue(user.groupId, user.id, title, url);
        return ApiResponse.success("Music added to queue", addedMusic);
    }

    @Delete("{musicId}")
    @Security(SecurityRole.AdminGroup)
    public async deleteFromQueue(
        @Path() musicId: number,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;

        const deletedMusic = await QueueService.deleteFromQueue(user.groupId, musicId);
        return ApiResponse.success("Music deleted from queue", deletedMusic);
    }

    @Get("current")
    @Security(SecurityRole.UserGroup)
    public async getCurrentSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const currentSong = await QueueService.getCurrent(user.groupId);
        return ApiResponse.success("Current song information", currentSong);
    }

    @Post("play")
    @Security(SecurityRole.AdminGroup)
    public async playSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const playedSong = await QueueService.play(user.groupId);
        return ApiResponse.success("Song played", playedSong);
    }

    @Post("pause")
    @Security(SecurityRole.AdminGroup)
    public async pauseSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const pausedSong = await QueueService.pause(user.groupId);
        return ApiResponse.success("Song paused", pausedSong);
    }

    @Post("skip")
    @Security(SecurityRole.AdminGroup)
    public async skipSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const skippedSong = await QueueService.skip(user.groupId);
        return ApiResponse.success("Song skipped", skippedSong);
    }
}
