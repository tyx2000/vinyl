const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(projectRoot, "node_modules", "hermes-compiler", "hermesc");
const targetDir = path.join(projectRoot, "node_modules", "react-native", "sdks", "hermesc");

function copyDirRecursive(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

if (!fs.existsSync(sourceDir)) {
  console.warn("[ensure-hermesc] Source hermesc directory not found, skipping.");
  process.exit(0);
}

if (fs.existsSync(targetDir)) {
  process.exit(0);
}

copyDirRecursive(sourceDir, targetDir);
console.log("[ensure-hermesc] Restored react-native/sdks/hermesc from hermes-compiler.");
