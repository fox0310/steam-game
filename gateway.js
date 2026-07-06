const http = require("http");
const net = require("net");

const port = Number(process.env.PORT || 80);
const routes = {
  "/gold": { host: "127.0.0.1", port: 5173 },
  "/fishing": { host: "127.0.0.1", port: 5180 }
};

const server = http.createServer((req, res) => {
  const route = routeFor(req.url);
  if (!route) return landing(req, res);
  proxyHttp(req, res, route);
});

server.on("upgrade", (req, socket, head) => {
  const route = routeFor(req.url);
  if (!route) return socket.destroy();
  const target = net.connect(route.target.port, route.target.host, () => {
    target.write(`${req.method} ${route.path || "/"} HTTP/${req.httpVersion}\r\n`);
    Object.entries({
      ...req.headers,
      host: `${route.target.host}:${route.target.port}`,
      "x-forwarded-host": req.headers.host,
      "x-forwarded-prefix": route.prefix,
      "x-forwarded-proto": "http"
    }).forEach(([key, value]) => target.write(`${key}: ${value}\r\n`));
    target.write("\r\n");
    if (head.length) target.write(head);
    socket.pipe(target).pipe(socket);
  });
  target.on("error", () => socket.destroy());
});

function routeFor(url) {
  const path = new URL(url, "http://gateway").pathname;
  const prefix = Object.keys(routes).find(p => path === p || path.startsWith(`${p}/`));
  if (!prefix) return null;
  return { prefix, target: routes[prefix], path: path.slice(prefix.length) + new URL(url, "http://gateway").search };
}

function proxyHttp(req, res, route) {
  const upstream = http.request({
    hostname: route.target.host,
    port: route.target.port,
    method: req.method,
    path: route.path || "/",
    headers: {
      ...req.headers,
      host: `${route.target.host}:${route.target.port}`,
      "x-forwarded-host": req.headers.host,
      "x-forwarded-prefix": route.prefix,
      "x-forwarded-proto": "http"
    }
  }, upstreamRes => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on("error", () => {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end("Game server is not running");
  });
  req.pipe(upstream);
}

function landing(_req, res) {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(`<!doctype html>
<title>School Games</title>
<main style="font-family:system-ui;margin:40px;line-height:1.8">
  <h1>School Games</h1>
  <p><a href="/gold/?role=host">掘金遊戲 Host</a></p>
  <p><a href="/fishing/?role=host">釣魚遊戲 Host</a></p>
</main>`);
}

server.listen(port, "0.0.0.0", () => {
  console.log(`Gateway: http://0.0.0.0:${port}`);
  console.log("Gold: /gold/");
  console.log("Fishing: /fishing/");
});
