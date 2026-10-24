// Dependency-free local static server: npm run dev
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (pathname.split("/").some(part => part.startsWith("."))) {
    response.writeHead(403).end();
    return;
  }
  try {
    const file = await fs.realpath(path.join(__dirname, pathname, pathname.endsWith("/") ? "index.html" : ""));
    if (!file.startsWith(__dirname + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    const content = await fs.readFile(file);
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Content-Length": content.length
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    response.writeHead(["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code) ? 404 : 500).end();
  }
});

server.on("error", error => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(Number(process.env.PORT || 9000), "127.0.0.1", () => {
  console.log(`Serving http://127.0.0.1:${server.address().port}/ (Ctrl+C to stop)`);
});
