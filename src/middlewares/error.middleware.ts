import type { ErrorRequestHandler } from "express";
import pc from "picocolors";
import { ValidateError } from "tsoa";

import { ApiResponse } from "../utils/apiResponse.js";

export class HttpError extends Error {
    constructor(
        public status: number,
        name: string,
        message: string
    ) {
        super(message);

        this.name = name;
    }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
        return res
            .status(err.status)
            .json(ApiResponse.error(err.name || "Http Error", err.message));
    }

    const date = new Date().toISOString();
    console.error(
        `${pc.gray(`[${date}]`)} ` +
            `${pc.red(pc.bold("Encountered error:"))} ${pc.white(err.message)}`
    );

    if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
        return res
            .status(400)
            .json(ApiResponse.error("Bad Request", "The JSON format sent is invalid."));
    }

    if (err instanceof TypeError && err.message.includes("Cannot destructure property")) {
        return res
            .status(400)
            .json(ApiResponse.error("Bad Request", "The request body is unreadable or empty."));
    }

    if (err instanceof ValidateError) {
        const errorKeys = Object.keys(err.fields);

        const firstKey = errorKeys[0];
        const cleanMessage = firstKey ? err.fields[firstKey]?.message : "Invalid parameter";

        return res
            .status(400)
            .json(
                ApiResponse.error(
                    "Validation Error",
                    cleanMessage || "One or more parameters failed validation."
                )
            );
    }

    return res
        .status(err.status || 500)
        .json(
            ApiResponse.error("Internal Server Error", "An internal error occurred on the server.")
        );
};
