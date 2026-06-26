import type { Request as ExpressRequest } from "express";
import { Controller, Get, Path, Request, Route, Tags } from "tsoa";

import * as StreamService from "../services/stream.service.js";
import * as QueueService from "../services/queue.service.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";
import path from "path";

@Route("jukebox")
@Tags("Jukebox")
export class JukeboxController extends Controller {
    @Get("{streamToken}")
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

    @Get("{streamToken}/now-playing")
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
