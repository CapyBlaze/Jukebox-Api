import { Controller, Example, Get, Route, Tags } from "tsoa";

import { ApiResponse, type ApiResponseFormat } from "../utils/apiResponse.js";

@Route("system")
@Tags("System")
export class SystemController extends Controller {
    /** Check whether the API process is running and able to answer requests. */
    @Get("health")
    @Example<ApiResponseFormat>({
        success: true,
        message: "System is healthy",
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    public async healthCheck(): Promise<ApiResponseFormat> {
        return ApiResponse.success("System is healthy");
    }

    /** Get the API version exposed by the running process. */
    @Get("version")
    @Example<ApiResponseFormat>({
        success: true,
        message: "API version retrieved",
        data: {
            version: "1.0.0",
        },
        timestamp: "2026-06-17T18:30:00.000Z",
    })
    public async getVersion(): Promise<ApiResponseFormat> {
        return ApiResponse.success("API version retrieved", {
            version: process.env.API_VERSION || "unknown",
        });
    }
}
