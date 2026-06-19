const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5180);
const colors = ["#f05d5e", "#4da3ff", "#54d17a", "#ffd23f"];
const names = ["Player 1", "Player 2", "Player 3", "Player 4"];
const duration = 180, fishTarget = 32;
let nextFishId = 0, nextSpawnAt = 0, startedAt = Date.now();
const clients = new Set();
const players = names.map(makePlayer);
const fishes = [];
resetGame();

function makePlayer(name, i) {
  return { name, color: colors[i], score: 0, x: 220 + i * 280, y: 132, angle: -0.7 + i * 0.35, len: 52, state: "swing", target: null, cooldown: 0, online: false };
}

function resetGame() {
  const online = players?.map(p => p.online) || [];
  players.splice(0, players.length, ...names.map(makePlayer));
  players.forEach((p, i) => p.online = !!online[i]);
  nextFishId = 0;
  nextSpawnAt = 0;
  fishes.splice(0, fishes.length, ...Array.from({ length: fishTarget }, () => spawnFish(true)));
  startedAt = Date.now();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/host") {
    const base = req.headers.host?.includes("localhost") ? lanUrls()[0] || `http://localhost:${port}` : `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
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
  const accept = crypto.createHash("sha1").update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
  socket.write(["HTTP/1.1 101 Switching Protocols", "Upgrade: websocket", "Connection: Upgrade", `Sec-WebSocket-Accept: ${accept}`, "", ""].join("\r\n"));
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
  const now = Date.now(), dt = 1 / 30;
  if (!over() && now >= nextSpawnAt && fishes.filter(f => f.alive).length < fishTarget) {
    fishes.push(spawnFish(false));
    nextSpawnAt = now + 650;
  }
  fishes.forEach(f => {
    if (!f.alive || f.locked) return;
    f.x += f.vx * dt;
    f.wobble += dt * 4;
    f.y += Math.sin(f.wobble) * 0.22;
    if (f.x < -80) f.x = 1360;
    if (f.x > 1360) f.x = -80;
  });
  players.forEach((p, i) => updatePlayer(p, i, dt, now));
  broadcast({ type: "state", state: snapshot() });
}

function updatePlayer(p, i, dt, now) {
  if (p.state === "swing") return void (p.angle = Math.sin(now / 620 + i * 0.75) * 0.82);
  if (p.state === "cool") {
    p.cooldown -= dt;
    if (p.cooldown <= 0) p.state = "swing";
    return;
  }
  const speed = p.target ? 150 / Math.max(1, p.target.r / 26) : 470;
  p.len += (p.state === "out" ? speed : -speed) * dt;
  const tip = netTip(p);
  if (p.state === "out") {
    const hit = fishes.find(f => f.alive && !f.locked && Math.hypot(f.x - tip.x, f.y - tip.y) < f.r + 24);
    if (hit) {
      hit.locked = true;
      p.target = hit;
      p.state = "back";
    } else if (p.len > 590) p.state = "back";
  }
  if (p.state === "back" && p.len <= 52) {
    p.len = 52;
    if (p.target) {
      p.target.alive = false;
      p.score += p.target.score;
    }
    p.target = null;
    p.state = "cool";
    p.cooldown = 0.22;
  }
}

function spawnFish(seed) {
  const types = [
    { kind: "small", r: 16, score: 100, color: "#d8eef2", accent: "#789aa5" },
    { kind: "medium", r: 25, score: 250, color: "#2d9cd3", accent: "#d9fbff" },
    { kind: "large", r: 38, score: 500, color: "#30465a", accent: "#d4dde5" },
    { kind: "rare", r: 20, score: 800, color: "#f4bc25", accent: "#fff4a8" }
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  const dir = Math.random() < 0.5 ? -1 : 1;
  return { id: nextFishId++, ...t, alive: true, locked: false, x: seed ? 80 + Math.random() * 1120 : (dir > 0 ? -60 : 1340), y: 270 + Math.random() * 365, vx: dir * (34 + Math.random() * 58), wobble: Math.random() * 10 };
}

function snapshot() {
  return { players, fishes, remaining: Math.max(0, duration - (Date.now() - startedAt) / 1000), over: over() };
}
function over() { return Date.now() - startedAt >= duration * 1000; }
function netTip(p) { return { x: p.x + Math.sin(p.angle) * p.len, y: p.y + Math.cos(p.angle) * p.len }; }
function broadcast(msg) { clients.forEach(client => send(client, msg)); }
function send(socket, msg) {
  const payload = Buffer.from(JSON.stringify(msg));
  const head = payload.length < 126 ? Buffer.from([0x81, payload.length]) : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 255]);
  socket.write(Buffer.concat([head, payload]));
}
function readFrames(buf) {
  const out = [];
  for (let i = 0; i < buf.length;) {
    const len = buf[i + 1] & 127, offset = len === 126 ? 4 : 2, size = len === 126 ? buf.readUInt16BE(i + 2) : len;
    const mask = buf.subarray(i + offset, i + offset + 4), data = buf.subarray(i + offset + 4, i + offset + 4 + size);
    out.push(Buffer.from(data.map((b, n) => b ^ mask[n % 4])).toString());
    i += offset + 4 + size;
  }
  return out;
}
function type(file) { return { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif" }[path.extname(file)] || "application/octet-stream"; }
function lanUrls() { return Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === "IPv4" && !i.internal).map(i => `http://${i.address}:${port}`); }
function makeUrls(base) { return { host: `${base}/?role=host`, players: [0, 1, 2, 3].map(i => `${base}/?player=${i}`) }; }

setInterval(tick, 1000 / 30);
server.listen(port, "0.0.0.0", () => {
  console.log(`Fishing game local: http://localhost:${port}`);
  lanUrls().forEach(url => console.log(`Fishing game LAN: ${url}`));
});
