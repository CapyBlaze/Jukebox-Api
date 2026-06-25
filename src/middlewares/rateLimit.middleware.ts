import rateLimit from "express-rate-limit";

import { ApiResponse } from "../utils/apiResponse.js";

const trustProxy = process.env.TRUST_PROXY === "true";

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Max 200 requests per IP
    standardHeaders: "draft-7",
    legacyHeaders: false,
    validate: { trustProxy },

    handler: (_req, res, _next, options) => {
        return res
            .status(options.statusCode)
            .json(
                ApiResponse.error(
                    "Too Many Requests",
                    "You have exceeded the limit of allowed requests. Please try again later."
                )
            );
    },
});

export const groupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 requests per IP
    standardHeaders: "draft-7",
    legacyHeaders: false,
    validate: { trustProxy },

    handler: (_req, res, _next, options) => {
        return res
            .status(options.statusCode)
            .json(
                ApiResponse.error(
                    "Too Many Requests",
                    "You have exceeded the limit of allowed requests. Please try again later."
                )
            );
    },
});

export const joinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 requests per IP
    standardHeaders: "draft-7",
    legacyHeaders: false,
    validate: { trustProxy },

    handler: (_req, res, _next, options) => {
        return res
            .status(options.statusCode)
            .json(
                ApiResponse.error(
                    "Too Many Requests",
                    "You have exceeded the limit of allowed requests. Please try again later."
                )
            );
    },
});

export const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Max 30 requests per IP
    standardHeaders: "draft-7",
    legacyHeaders: false,
    validate: { trustProxy },

    handler: (_req, res, _next, options) => {
        return res
            .status(options.statusCode)
            .json(
                ApiResponse.error(
                    "Too Many Requests",
                    "You have exceeded the limit of allowed requests. Please try again later."
                )
            );
    },
});

export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 requests per IP
    standardHeaders: "draft-7",
    legacyHeaders: false,
    validate: { trustProxy },

    handler: (_req, res, _next, options) => {
        return res
            .status(options.statusCode)
            .json(
                ApiResponse.error(
                    "Too Many Requests",
                    "You have exceeded the limit of allowed requests. Please try again later."
                )
            );
    },
});
