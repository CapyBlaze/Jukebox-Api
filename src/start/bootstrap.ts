import pc from "picocolors";

import { initJson } from "./initJson.js";

export async function bootstrap() {
    initJson();
    logBootstrapMessage("JSON state initialized successfully.");
}

function logBootstrapMessage(message: string) {
    const date = new Date().toISOString();
    console.log(`${pc.gray(`[${date}]`)} ` + pc.white(message));
}
