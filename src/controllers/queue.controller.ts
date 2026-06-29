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

interface AddPlaylistToQueueBody {
    provider: string;
    playlistKey: string;
}

@Route("group/queue")
@Tags("Queue")
export class QueueController extends Controller {
    /** Get the full music queue for the group, ordered by insertion, with positions. */
    @Get("")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Queue information",
        "data": [
            {
                "id": 2,
                "title": "Never Gonna Give You Up",
                "provider": "youtube",
                "providerKey": "dQw4w9WgXcQ",
                "durationSec": 214,
                "groupId": "1ARM6G",
                "userId": 4,
                "addedAt": "2026-06-29T15:47:51.787Z",
                "position": 1
            }
        ],
        "timestamp": "2026-06-29T15:51:35.640Z"
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
        "success": true,
        "message": "Music added to queue",
        "data": {
            "id": 2,
            "title": "Never Gonna Give You Up",
            "provider": "youtube",
            "providerKey": "dQw4w9WgXcQ",
            "durationSec": 214,
            "groupId": "1ARM6G",
            "userId": 4,
            "addedAt": "2026-06-29T15:47:51.787Z"
        },
        "timestamp": "2026-06-29T15:47:51.796Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async addToQueue(
        @Body() body: AddToQueueBody,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const { title, provider, providerKey } = body;

        if (await SearchService.isAlreadyInQueue(user.groupId, providerKey)) {
            return ApiResponse.error("Music already in queue", "This song is already in the queue");
        }

        const durationSec = await SearchService.durationYoutube(providerKey);

        const addedMusic = await QueueService.addToQueue(user.groupId, user.id, title, provider, providerKey, durationSec);
        return ApiResponse.success("Music added to queue", addedMusic);
    }

    
    /** Remove a song from the queue by its ID. */
    @Delete("{musicId}")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Music deleted from queue",
        "data": {
            "id": 2,
            "title": "Never Gonna Give You Up",
            "provider": "youtube",
            "providerKey": "dQw4w9WgXcQ",
            "durationSec": 214,
            "groupId": "1ARM6G",
            "userId": 4,
            "addedAt": "2026-06-29T15:47:51.787Z"
        },
        "timestamp": "2026-06-29T15:53:57.962Z"
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

    /** Add a playlist to the group's queue. Duration is fetched automatically from YouTube. (limited to 50 songs per playlist) */
    @Post("playlist")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Music added to queue",
        "data": {
            "addedCount": 50,
            "playlistItems": [
                {
                    "id": 4,
                    "title": "Taylor Swift - The Fate of Ophelia (Official Music Video)",
                    "provider": "youtube",
                    "providerKey": "ko70cExuzZM",
                    "durationSec": 239,
                    "groupId": "1ARM6G",
                    "userId": 4,
                    "addedAt": "2026-06-29T16:50:21.860Z"
                }
            ]
        },
        "timestamp": "2026-06-29T16:50:21.879Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async addPlaylistToQueue(
        @Body() body: AddPlaylistToQueueBody,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponseFormat> {
        const user = req.user;
        const { provider, playlistKey } = body;
    
        const addedMusics = await QueueService.addPlaylistToQueue(user.groupId, user.id, provider, playlistKey);
        return ApiResponse.success("Music added to queue", {
            addedCount: addedMusics.length,
            playlistItems: addedMusics
        });
    }

    /** Get information about the song currently playing, or null if none. */
    @Get("current")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Current song information",
        "data": {
            "id": 3,
            "title": "Never Gonna Give You Up",
            "provider": "youtube",
            "providerKey": "dQw4w9WgXcQ",
            "durationSec": 214,
            "groupId": "1ARM6G",
            "userId": 4,
            "addedAt": "2026-06-29T15:54:11.270Z",
            "startedAt": "2026-06-29T15:56:42.195Z",
            "isPlaying": false
        },
        "timestamp": "2026-06-29T16:34:39.347Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async getCurrentSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const currentSong = await QueueService.getCurrent(user.groupId);

        if (currentSong === null) {
            return ApiResponse.success("No song is currently playing");
        }

        return ApiResponse.success("Current song information", currentSong);
    }

    /** Move to and start playing the next song in the queue. */
    @Post("play")
    @Security(SecurityRole.AdminGroup)
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Song played",
        "data": {
            "id": 3,
            "title": "Never Gonna Give You Up",
            "provider": "youtube",
            "providerKey": "dQw4w9WgXcQ",
            "durationSec": 214,
            "groupId": "1ARM6G",
            "userId": 4,
            "addedAt": "2026-06-29T15:54:11.270Z"
        },
        "timestamp": "2026-06-29T15:56:42.208Z"
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
        "success": true,
        "message": "Song paused",
        "timestamp": "2026-06-29T15:57:05.838Z"
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
        "success": true,
        "message": "Song skipped",
        "data": {
            "id": 3,
            "title": "Never Gonna Give You Up",
            "provider": "youtube",
            "providerKey": "dQw4w9WgXcQ",
            "durationSec": 214,
            "groupId": "1ARM6G",
            "userId": 4,
            "addedAt": "2026-06-29T15:54:11.270Z"
        },
        "timestamp": "2026-06-29T16:33:52.012Z"
    })
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async skipSong(@Request() req: AuthenticatedRequest): Promise<ApiResponseFormat> {
        const user = req.user;
        const skippedSong = await QueueService.skip(user.groupId);
        return ApiResponse.success("Song skipped", skippedSong);
    }
}
