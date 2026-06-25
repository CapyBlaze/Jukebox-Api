import { Controller, Get, Query, Route, Security, Tags } from "tsoa";

import * as SearchService from "../services/search.service.js";
import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

@Route("search")
@Tags("Search")
export class SearchController extends Controller {
    @Get("")
    @Security("userGroupAuth")
    public async search(@Query("q") query?: string): Promise<ApiResponseFormat> {
        if (!query) {
            this.setStatus(400);
            return ApiResponse.error("Information missing", "Query is required");
        }

        const results = await SearchService.searchYouTube(query);
        return ApiResponse.success("Search results", { query, results });
    }
}
