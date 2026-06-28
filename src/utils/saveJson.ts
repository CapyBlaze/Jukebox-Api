import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function saveJsonConfig(fileName: string, data: any) {
    const filePath = path.join(__dirname, "../config", fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
