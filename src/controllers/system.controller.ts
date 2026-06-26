import { Controller, Get, Route, Tags } from "tsoa";

import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

@Route("system")
@Tags("System")
export class SystemController extends Controller {
    @Get("health")
    public async healthCheck(): Promise<ApiResponseFormat> {
        return ApiResponse.success("System is healthy");
    }

    @Get("version")
    public async getVersion(): Promise<ApiResponseFormat> {
        return ApiResponse.success("API version retrieved", {
            version: process.env.API_VERSION || "unknown",
        });
    }
}
