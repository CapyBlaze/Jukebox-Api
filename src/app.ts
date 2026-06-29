import dotenv from "dotenv";
import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";

import swaggerDocument from "../docs/swagger.json" with { type: "json" };
import { RegisterRoutes } from "./generated/routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ipBannedHandler } from "./middlewares/ipBanned.middleware.js";
import { loggerHandler } from "./middlewares/logger.middleware.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import * as RateLimit from "./middlewares/rateLimit.middleware.js";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set("trust proxy", 1);

app.use(express.json());
app.use(loggerHandler);

app.use(ipBannedHandler);

app.use(RateLimit.globalLimiter);
app.use("/group/create", RateLimit.groupLimiter);
app.use("/group/{groupId}/join", RateLimit.joinLimiter);
app.use("/search", RateLimit.searchLimiter);
app.use("/jukebox", RateLimit.jukeboxLimiter);
app.use("/admin/login", RateLimit.adminLimiter);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.static(path.join(__dirname, "..", "public")));
RegisterRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
