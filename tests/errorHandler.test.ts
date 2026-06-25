import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "../src/middlewares/error.middleware.js";

describe("errorHandler", () => {
    it("should return a status 500 and the error message", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        const error = new Error("A TSOA error has occurred");
        const req = {} as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Internal Server Error",
            message: "An internal error occurred on the server.",
            timestamp: expect.any(String),
        });
    });
});
