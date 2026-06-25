import fs from "fs";
import path from "path";
import pc from 'picocolors';

const srcRoot = "src";
const outRoot = "dist/src";

function copyJsonRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);

    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyJsonRecursive(srcPath, destPath);
    } else if (file.endsWith(".json")) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyJsonRecursive(srcRoot, outRoot);
console.log(pc.green("JSON copied from src -> dist"));
