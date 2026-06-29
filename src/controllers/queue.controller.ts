import { Body, Controller, Delete, Example, Get, Path, Post, Request, Response, Route, Security, Tags } from "tsoa";

import { SecurityRole } from "../middlewares/auth.middleware.js";
import * as QueueService from "../services/queue.service.js";
import * as SearchService from "../services/search.service.js";
import type { AuthenticatedRequest } from "../types/express.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

interface AddToQueueBody {
    title: string;
    provider: string;
    providerKey: string;
}

@Route("group/queue")
@Tags("Queue")
export class QueueController extends Controller {
    /** Get the full music queue for the group, ordered by insertion, with positions. */
    @Get("")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Queue information",
        data: [
            {
                id: 12,
                groupId: "X7K2QP",
                title: "Never Gonna Give You Up",
                provider: "youtube",
                providerKey: "dQw4w9WgXcQ",
                durationSec: 212,
                userId: 2,
                addedAt: "2026-06-17T18:25:00.000Z",
                position: 1,
            },
        ],
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
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

    /** Add a new song to the group's queue. Duration is fetched automatically from YouTube. */
    @Post("")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Music added to queue",
        data: {
            id: 13,
            groupId: "X7K2QP",
            title: "Never Gonna Give You Up",
            provider: "youtube",
            providerKey: "dQw4w9WgXcQ",
            durationSec: 212,
            userId: 3,
            addedAt: "2026-06-17T18:30:00.000Z",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async addToQueue(
        @Body() body: AddToQueueBody,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const { title, provider, providerKey } = body;
        const durationSec = await SearchService.durationYoutube(providerKey);

        const addedMusic = await QueueService.addToQueue(user.groupId, user.id, title, provider, providerKey, durationSec);
        return ApiResponse.success("Music added to queue", addedMusic);
    }

    /** Remove a song from the queue by its ID. */
    @Delete("{musicId}")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Music deleted from queue",
        data: {
            id: 13,
            groupId: "X7K2QP",
            title: "Never Gonna Give You Up",
            provider: "youtube",
            providerKey: "dQw4w9WgXcQ",
            durationSec: 212,
            userId: 3,
            addedAt: "2026-06-17T18:30:00.000Z",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async deleteFromQueue(
        @Path() musicId: number,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;

        const deletedMusic = await QueueService.deleteFromQueue(user.groupId, musicId);
        return ApiResponse.success("Music deleted from queue", deletedMusic);
    }

    /** Get information about the song currently playing, or null if none. */
    @Get("current")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Current song information",
        data: {
            id: 12,
            groupId: "X7K2QP",
            title: "Never Gonna Give You Up",
            provider: "youtube",
            providerKey: "dQw4w9WgXcQ",
            durationSec: 212,
            userId: 2,
            addedAt: "2026-06-17T18:25:00.000Z",
            startedAt: "2026-06-17T18:29:00.000Z",
            isPlaying: true,
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async getCurrentSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const currentSong = await QueueService.getCurrent(user.groupId);
        return ApiResponse.success("Current song information", currentSong);
    }

    /** Move to and start playing the next song in the queue. */
    @Post("play")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Song played",
        data: {
            id: 13,
            groupId: "X7K2QP",
            title: "Never Gonna Give You Up",
            provider: "youtube",
            providerKey: "FTQbiNvZqaY",
            durationSec: 295,
            userId: 1,
            addedAt: "2026-06-17T18:28:00.000Z",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async playSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const playedSong = await QueueService.play(user.groupId);
        return ApiResponse.success("Song played", playedSong);
    }

    /** Pause playback of the current song. */
    @Post("pause")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Song paused",
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async pauseSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        await QueueService.pause(user.groupId);
        return ApiResponse.success("Song paused");
    }

    /** Skip the current song and move to the next one in the queue. */
    @Post("skip")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Song skipped",
        data: {
            id: 13,
            groupId: "X7K2QP",
            title: "Never Gonna Give You Up",
            provider: "youtube",
            providerKey: "FTQbiNvZqaY",
            durationSec: 295,
            userId: 1,
            addedAt: "2026-06-17T18:28:00.000Z",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async skipSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const skippedSong = await QueueService.skip(user.groupId);
        return ApiResponse.success("Song skipped", skippedSong);
    }
}
