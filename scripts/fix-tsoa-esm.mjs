import fs from "fs";
import path from "path";
import pc from 'picocolors';

const filePath = "src/generated/routes.ts";

let code = fs.readFileSync(filePath, "utf-8");

code = code.replace(
    /from\s+['"](\..*?)(?<!\.js)['"]/g,
    (match, importPath) => {
        if (
            importPath.endsWith(".js") ||
            importPath.endsWith(".json") ||
            importPath.endsWith(".ts")
        ) {
            return match;
        }

        return `from '${importPath}.js'`;
    }
);

fs.writeFileSync(filePath, code);
console.log(pc.green("TSOA ESM fix applied: .js extensions added"));
