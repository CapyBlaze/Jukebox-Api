import type { NextFunction, Request, Response } from "express";

import { ApiResponse } from "../utils/apiResponse.js";

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
    return res
        .status(404)
        .json(
            ApiResponse.error("Not Found", `Route ${req.method} ${req.originalUrl} does not exist.`)
        );
};
