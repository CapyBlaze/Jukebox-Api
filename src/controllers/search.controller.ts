import { Controller, Example, Get, Query, Response, Route, Security, Tags } from "tsoa";

import { SecurityRole } from "../middlewares/auth.middleware.js";
import * as SearchService from "../services/search.service.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

@Route("search")
@Tags("Search")
export class SearchController extends Controller {
    /** Search YouTube for songs matching a query string. */
    @Get("")
    @Security(SecurityRole.UserGroup)
    @Example<ApiResponseFormat>({
        success: true,
        message: "Search results",
        data: {
            query: "never gonna give you up",
            results: [
                {
                    "id": {
                        "videoId": "dQw4w9WgXcQ"
                    },
                    "snippet": {
                        "publishedAt": "2010-10-25T06:57:24Z",
                        "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
                        "title": "Rick Astley - Never Gonna Give You Up (Official Video)",
                        "description": "The official video for Never Gonna Give You Up by Rick Astley...",
                        "thumbnails": {
                            "default": {
                                "url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
                            },
                        },
                        "channelTitle": "Rick Astley",
                    }
                }
            ],
            pageInfo: {
                totalResults: 45,
                resultsPerPage: 15,
            },
            nextPageToken: "CDIQAA",
            prevPageToken: "CBkQAA",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    @Response<ApiResponseFormat>(400, "Information missing")
    @Response<ApiResponseFormat>(401, "Unauthorized")
    public async search(
        @Query("q") query?: string, 
        @Query("maxResults") maxResults?: number, 
        @Query("pageToken") pageToken?: string,
        @Query("type") type?: "video" | "playlist" 
    ): Promise<ApiResponseFormat> {
        if (!query) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "Query is required");
        }

        if (maxResults && (maxResults < 1 || maxResults > 50)) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "maxResults must be between 1 and 50");
        }

        const results = await SearchService.searchYouTube(query, maxResults, pageToken, type);
        const resultsCleaned = results.items.map((video) => ({
            id: video.id 
                ? { videoId: video.id.videoId } 
                : null,
            snippet: video.snippet 
                ? {
                    publishedAt: video.snippet.publishedAt,
                    channelId: video.snippet.channelId,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    thumbnails: video.snippet.thumbnails 
                        ? {
                            default: video.snippet.thumbnails.default 
                                ? { url: video.snippet.thumbnails.default.url } 
                                : null
                        } 
                        : null,
                    channelTitle: video.snippet.channelTitle,
                } 
                : null
        }));

        return ApiResponse.success("Search results", { 
            query: query, 
            results: resultsCleaned,
            pageInfo: {
                totalResults: results.pageInfo.totalResults,
                resultsPerPage: results.pageInfo.resultsPerPage,
            },
            nextPageToken: results.nextPageToken,
            prevPageToken: results.prevPageToken,
        });
    }
}
