const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const MEDIA_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".mov"]);
const SKIP = new Set(["css", "js", "node_modules"]);

function listProjectImages(dir) {
  const files = fs.readdirSync(dir).filter((name) => {
    if (name.startsWith(".")) return false;
    return MEDIA_EXT.has(path.extname(name).toLowerCase());
  });

  const cover = files.filter((name) => name.toLowerCase() === "cover.png");
  const rest = files
    .filter((name) => name.toLowerCase() !== "cover.png")
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const names = rest.length > 0 ? rest : cover;

  return names.map((name) => {
    const mtime = fs.statSync(path.join(dir, name)).mtimeMs;
    return `${name}?v=${Math.round(mtime)}`;
  });
}

for (const name of fs.readdirSync(ROOT)) {
  if (name.startsWith(".")) continue;
  if (SKIP.has(name)) continue;
  const dir = path.join(ROOT, name);
  if (!fs.statSync(dir).isDirectory()) continue;
  const images = listProjectImages(dir);
  fs.writeFileSync(path.join(dir, "media.json"), JSON.stringify({ images }) + "\n");
}
