import { loadJsonConfig } from "../utils/loadJson.js";
import { saveJsonConfig } from "../utils/saveJson.js";

export interface ConfigFile {
    apiLimitDay: {
        youtube: number;
    };
    maxCacheLine: {
        search: number;
        metadata: number;
    };
}

class Config {
    data: ConfigFile;

    constructor() {
        this.data = loadJsonConfig("index.json");
    }

    async save() {
        saveJsonConfig("index.json", this.data);
    }
}

export const config = new Config();
