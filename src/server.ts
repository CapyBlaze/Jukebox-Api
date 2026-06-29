import pc from "picocolors";

import app from "./app.js";
import { startPlaybackScheduler } from "./scheduler/play.scheduler.js";

const port = process.env.SERVER_PORT || 8080;
const date = new Date().toISOString();

app.listen(port, () => {
    console.log(
        `${pc.gray(`[${date}]`)} ` +
            pc.green(`Server started at ` + pc.bold(pc.underline(`http://localhost:${port}`)))
    );

    startPlaybackScheduler();
});
