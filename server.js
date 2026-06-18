const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5173);
const colors = ["#f05d5e", "#4da3ff", "#54d17a", "#ffd23f"];
const names = ["Player 1", "Player 2", "Player 3", "Player 4"];
const duration = 180;
const goldTarget = 12;
let nextGoldId = 0;
let nextSpawnAt = 0;
let startedAt = Date.now();

const clients = new Set();
const players = names.map(makePlayer);
const golds = [];
resetGame();

function makePlayer(name, i) {
  return {
    name, color: colors[i], score: 0,
    x: 250 + i * 260, y: 225, angle: -0.75 + i * 0.5, len: 46,
    state: "swing", target: null, cooldown: 0, online: false
  };
}

function seedGolds() {
  return [
  [210, 330, 34, 100], [360, 455, 48, 250], [545, 360, 60, 500], [730, 520, 36, 100],
  [900, 398, 50, 250], [1070, 520, 64, 500], [180, 585, 42, 250], [602, 610, 30, 100],
  [815, 305, 24, 800], [1110, 320, 30, 100], [455, 575, 26, 800], [1010, 610, 38, 250]
  ].map(([x, y, r, score]) => ({ id: nextGoldId++, x, y, r, score, alive: true, locked: false }));
}

function resetGame() {
  const online = players?.map(p => p.online) || [];
  players.splice(0, players.length, ...names.map(makePlayer));
  players.forEach((p, i) => p.online = !!online[i]);
  nextGoldId = 0;
  nextSpawnAt = 0;
  golds.splice(0, golds.length, ...seedGolds());
  startedAt = Date.now();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/host") {
    const base = req.headers.host?.includes("localhost")
      ? lanUrls()[0] || `http://localhost:${port}`
      : `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ base, urls: makeUrls(base) }));
  }
  const file = path.normalize(url.pathname === "/" ? "index.html" : url.pathname.slice(1));
  if (file.startsWith("..")) return res.writeHead(403).end();
  fs.readFile(path.join(root, file), (err, data) => {
    if (err) return res.writeHead(404).end("Not found");
    res.writeHead(200, { "content-type": type(file) });
    res.end(data);
  });
});

server.on("upgrade", (req, socket) => {
  if (req.headers.upgrade?.toLowerCase() !== "websocket") return socket.destroy();
  const accept = crypto.createHash("sha1")
    .update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");
  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "",
    ""
  ].join("\r\n"));
  clients.add(socket);
  socket.on("data", data => readFrames(data).forEach(msg => handle(socket, msg)));
  socket.on("close", () => disconnect(socket));
  socket.on("error", () => disconnect(socket));
  send(socket, { type: "hello", state: snapshot() });
});

function handle(socket, raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch { return; }
  if (msg.type === "join") {
    socket.role = msg.role === "host" ? "host" : (msg.role === "player" ? "player" : "viewer");
    socket.player = socket.role === "player" && Number.isInteger(msg.player) ? Math.max(0, Math.min(3, msg.player)) : null;
    if (socket.player !== null) players[socket.player].online = true;
  }
  if (msg.type === "reset" && socket.role === "host") {
    resetGame();
    broadcast({ type: "state", state: snapshot() });
  }
  if (msg.type === "fire" && socket.role === "player" && msg.player === socket.player) fire(players[socket.player]);
}

function disconnect(socket) {
  clients.delete(socket);
  if (socket.player !== null && socket.player !== undefined) players[socket.player].online = false;
}

function fire(p) {
  if (over() || p.state !== "swing") return;
  p.state = "out";
  p.target = null;
}

function tick() {
  const now = Date.now();
  const dt = 1 / 30;
  if (!over() && now >= nextSpawnAt && golds.filter(g => g.alive).length < goldTarget) {
    spawnGold();
    nextSpawnAt = now + 2000;
  }
  players.forEach((p, i) => {
    if (p.state === "swing") return void (p.angle = Math.sin(now / 650 + i * 0.9) * 0.9);
    if (p.state === "cool") {
      p.cooldown -= dt;
      if (p.cooldown <= 0) p.state = "swing";
      return;
    }
    const speed = p.target ? 170 / Math.max(1, p.target.r / 28) : 430;
    p.len += (p.state === "out" ? speed : -speed) * dt;
    const tip = clawTip(p);
    if (p.state === "out") {
      const hit = golds.find(g => g.alive && !g.locked && Math.hypot(g.x - tip.x, g.y - tip.y) < g.r + 16);
      if (hit) {
        hit.locked = true;
        p.target = hit;
        p.state = "back";
      } else if (p.len > 620) p.state = "back";
    }
    if (p.state === "back" && p.len <= 46) {
      p.len = 46;
      if (p.target) {
        p.target.alive = false;
        p.score += p.target.score;
      }
      p.target = null;
      p.state = "cool";
      p.cooldown = 0.25;
    }
  });
  broadcast({ type: "state", state: snapshot() });
}

function spawnGold() {
  const types = [[28, 100], [42, 250], [58, 500], [22, 800]];
  const [r, score] = types[Math.floor(Math.random() * types.length)];
  golds.push({ id: nextGoldId++, x: 160 + Math.random() * 960, y: 320 + Math.random() * 300, r, score, alive: true, locked: false });
}

function snapshot() {
  return { players, golds, remaining: Math.max(0, duration - (Date.now() - startedAt) / 1000), over: over() };
}

function over() {
  return Date.now() - startedAt >= duration * 1000;
}

function clawTip(p) {
  return { x: p.x + Math.sin(p.angle) * p.len, y: p.y + Math.cos(p.angle) * p.len };
}

function broadcast(msg) {
  clients.forEach(client => send(client, msg));
}

function send(socket, msg) {
  const payload = Buffer.from(JSON.stringify(msg));
  const head = payload.length < 126
    ? Buffer.from([0x81, payload.length])
    : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 255]);
  socket.write(Buffer.concat([head, payload]));
}

function readFrames(buf) {
  const out = [];
  for (let i = 0; i < buf.length;) {
    const len = buf[i + 1] & 127;
    const offset = len === 126 ? 4 : 2;
    const size = len === 126 ? buf.readUInt16BE(i + 2) : len;
    const mask = buf.subarray(i + offset, i + offset + 4);
    const data = buf.subarray(i + offset + 4, i + offset + 4 + size);
    out.push(Buffer.from(data.map((b, n) => b ^ mask[n % 4])).toString());
    i += offset + 4 + size;
  }
  return out;
}

function type(file) {
  return { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif" }[path.extname(file)] || "application/octet-stream";
}

function lanUrls() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i && i.family === "IPv4" && !i.internal)
    .map(i => `http://${i.address}:${port}`);
}

function makeUrls(base) {
  return {
    host: `${base}/?role=host`,
    players: [0, 1, 2, 3].map(i => `${base}/?player=${i}`)
  };
}

setInterval(tick, 1000 / 30);
server.listen(port, "0.0.0.0", () => {
  console.log(`Local: http://localhost:${port}`);
  lanUrls().forEach(url => console.log(`LAN:   ${url}`));
});
