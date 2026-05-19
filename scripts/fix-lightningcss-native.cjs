const fs = require("node:fs");
const path = require("node:path");

const platformPackage = `lightningcss-${process.platform}-${process.arch}`;
const nativeFile = `lightningcss.${process.platform}-${process.arch}.node`;
const source = path.join(
  process.cwd(),
  "node_modules",
  platformPackage,
  nativeFile
);
const target = path.join(
  process.cwd(),
  "node_modules",
  "lightningcss",
  nativeFile
);

if (!fs.existsSync(source) || !fs.existsSync(path.dirname(target))) {
  process.exit(0);
}

fs.copyFileSync(source, target);
