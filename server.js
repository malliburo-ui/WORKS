const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 4000;
const ROOT = __dirname;
const MEDIA_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".mov",
]);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

function insideRoot(filePath) {
  const rel = path.relative(ROOT, filePath);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

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

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const mediaMatch = urlPath.match(/^\/([^/]+)\/media\.json$/);

  if (mediaMatch) {
    const dir = path.join(ROOT, mediaMatch[1]);
    if (!insideRoot(dir) || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ images: [] }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify({ images: listProjectImages(dir) }));
    return;
  }

  let filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);

  if (!insideRoot(filePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    if (!urlPath.endsWith("/")) {
      res.writeHead(302, { Location: urlPath + "/" });
      res.end();
      return;
    }
    filePath = path.join(filePath, "index.html");
  }

  sendFile(req, res, filePath);
});

function sendFile(req, res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const range = req.headers.range;

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
        res.end();
        return;
      }

      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;
      if (start >= stat.size || end >= stat.size || start > end) {
        res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
        res.end();
        return;
      }

      res.writeHead(206, {
        "Content-Type": type,
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

server.listen({ port: PORT, host: "::", ipv6Only: false }, () => {
  console.log(`WORKS ready: http://127.0.0.1:${PORT}`);
});
