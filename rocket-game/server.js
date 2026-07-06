const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 5190);

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/rocket-game/index.html" : url.pathname;
  const file = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(root, file);
  if (!fullPath.startsWith(root)) return res.writeHead(403).end();
  fs.readFile(fullPath, (err, data) => {
    if (err) return res.writeHead(404).end("Not found");
    res.writeHead(200, { "content-type": type(fullPath) });
    res.end(data);
  });
}).listen(port, "0.0.0.0", () => {
  console.log(`Rocket game local: http://localhost:${port}`);
  lanUrls().forEach(url => console.log(`Rocket game LAN:   ${url}`));
});

function type(file) {
  return {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".json": "application/json"
  }[path.extname(file)] || "application/octet-stream";
}

function lanUrls() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i && i.family === "IPv4" && !i.internal)
    .map(i => `http://${i.address}:${port}`);
}
