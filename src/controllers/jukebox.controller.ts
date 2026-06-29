import type { Request as ExpressRequest } from "express";
import { Controller, Example, Get, Path, Request, Response, Route, Tags } from "tsoa";

import * as StreamService from "../services/stream.service.js";
import * as QueueService from "../services/queue.service.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";
import path from "path";

@Route("jukebox")
@Tags("Jukebox")
export class JukeboxController extends Controller {
    /** Serve the public jukebox player page for a given stream token. */
    @Get("{streamToken}")
    @Response<ApiResponseFormat>(404, "Stream token not found")
    public async streamAudio(
        @Path("streamToken") streamToken: string,
        @Request() req: ExpressRequest
    ): Promise<void> {
        const group = await StreamService.groupByStreamToken(streamToken);
        if (!group) {
            this.setStatus(404);
            req.res!.send("Stream token not found");
            return;
        }
        
        await new Promise<void>((resolve, reject) => {
            req.res!.sendFile(
                path.join(process.cwd(), "public/jukebox.html"),
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        })
    }

    /** Get information about the song currently playing for a given stream token, or null if nothing is playing. */
    @Get("{streamToken}/now-playing")
    @Example<ApiResponseFormat>({
        "success": true,
        "message": "Now playing information retrieved successfully",
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
        "timestamp": "2026-06-29T15:58:32.345Z"
    })
    public async nowPlaying(
        @Path("streamToken") streamToken: string
    ): Promise<ApiResponseFormat> {
        const group = await StreamService.groupByStreamToken(streamToken);
        if (!group) {
            return ApiResponse.failure(
                "Stream token not found",
                "The provided stream token does not exist"
            );
        }

        const info = await QueueService.getCurrent(group.code);
        return ApiResponse.success("Now playing information retrieved successfully", info);
    }
}
