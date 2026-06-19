const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const views = document.querySelector("#views");
const hostLinks = document.querySelector("#host-links");
const wrap = document.querySelector(".wrap");
const W = canvas.width, H = canvas.height;
const colors = ["#f05d5e", "#4da3ff", "#54d17a", "#ffd23f"];
const names = ["Player 1", "Player 2", "Player 3", "Player 4"];
let view = "host", start = performance.now(), last = start, over = false;
let online = false, serverState = null, ws = null, audioCtx = null, musicTimer = null;
const duration = 180, fishTarget = 32;
const params = new URLSearchParams(location.search);
const playerId = params.has("player") ? Math.max(0, Math.min(3, Number(params.get("player")) || 0)) : 0;
const pageRole = params.get("role") === "host" ? "host" : (params.has("player") ? "player" : "local");
if (params.has("player")) view = String(playerId);

const players = names.map((name, i) => ({
  name, color: colors[i], score: 0, x: 220 + i * 280, y: 132,
  angle: -0.7 + i * 0.35, len: 52, state: "swing", target: null, cooldown: 0
}));
let nextFishId = 0, nextSpawnAt = 0;
const fishes = Array.from({ length: fishTarget }, () => spawnFish(true));
connect();
loadHostLinks();

function fire(p) {
  if (online) return ws.send(JSON.stringify({ type: "fire", player: playerId }));
  if (over || p.state !== "swing") return;
  p.state = "out";
  p.target = null;
}

function rank() {
  return [...players].sort((a, b) => b.score - a.score);
}

function update(dt, now) {
  if (serverState) return applyServerState();
  over = duration - (now - start) / 1000 <= 0;
  if (!over && now >= nextSpawnAt && fishes.filter(f => f.alive).length < fishTarget) {
    fishes.push(spawnFish(false));
    nextSpawnAt = now + 650;
  }
  fishes.forEach(f => {
    if (!f.alive || f.locked) return;
    f.x += f.vx * dt;
    f.wobble += dt * 4;
    f.y += Math.sin(f.wobble) * 0.22;
    if (f.x < -80) f.x = W + 80;
    if (f.x > W + 80) f.x = -80;
  });
  players.forEach((p, i) => updatePlayer(p, i, dt, now));
}

function updatePlayer(p, i, dt, now) {
  if (p.state === "swing") {
    p.angle = Math.sin(now / 620 + i * 0.75) * 0.82;
    return;
  }
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

function connect() {
  if (!location.protocol.startsWith("http")) return;
  ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
  ws.onopen = () => ws.send(JSON.stringify({ type: "join", role: pageRole, player: pageRole === "player" ? playerId : null }));
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.state) {
      online = true;
      serverState = msg.state;
    }
  };
  ws.onclose = () => online = false;
}

async function loadHostLinks() {
  if (pageRole !== "host" || !location.protocol.startsWith("http")) return;
  try {
    const res = await fetch("/api/host");
    const data = await res.json();
    hostLinks.style.display = "flex";
    hostLinks.innerHTML = `<strong>連線網址：</strong>${linkButton("Host", data.urls.host)}${data.urls.players.map((url, i) => linkButton(`P${i + 1}`, url)).join("")}`;
  } catch {}
}

function linkButton(label, url) {
  return `<button data-copy="${url}">${label}: ${url}</button>`;
}

function applyServerState() {
  players.splice(0, players.length, ...serverState.players.map(p => ({ ...p })));
  fishes.splice(0, fishes.length, ...serverState.fishes.map(f => ({ ...f })));
  over = serverState.over;
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
  return {
    id: nextFishId++, ...t, alive: true, locked: false,
    x: seed ? 80 + Math.random() * 1120 : (dir > 0 ? -60 : W + 60),
    y: 270 + Math.random() * 365,
    vx: dir * (34 + Math.random() * 58),
    wobble: Math.random() * 10
  };
}

function netTip(p) {
  return { x: p.x + Math.sin(p.angle) * p.len, y: p.y + Math.cos(p.angle) * p.len };
}

function draw() {
  drawSea();
  fishes.filter(f => f.alive).forEach(drawFish);
  (view === "host" ? players : [players[Number(view)]]).forEach(drawPlayer);
  drawHud();
  if (over) drawResults();
}

function drawSea() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#58b8d4");
  grad.addColorStop(0.24, "#0b6a91");
  grad.addColorStop(1, "#062032");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,.22)";
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.ellipse(100 + i * 150, 172 + Math.sin(performance.now() / 600 + i) * 8, 90, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(p) {
  const tip = netTip(p);
  drawBoat(p.x, p.y, p.color);
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 36);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  drawNet(tip.x, tip.y, p.angle);
  if (p.target) drawFish({ ...p.target, x: tip.x, y: tip.y, r: p.target.r * 0.78 });
}

function drawBoat(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6d3f20";
  ctx.beginPath();
  ctx.moveTo(-74, 12); ctx.lineTo(74, 12); ctx.lineTo(48, 58); ctx.lineTo(-48, 58); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(-63, 18, 126, 24);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#d7e8e8";
  ctx.fillRect(-32, -14, 64, 30);
  ctx.fillStyle = "#17252d";
  ctx.fillRect(-21, -7, 16, 12);
  ctx.fillRect(6, -7, 16, 12);
  ctx.fillStyle = "#20272d";
  ctx.beginPath();
  ctx.arc(0, 42, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNet(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-angle * 0.35);
  ctx.strokeStyle = "rgba(230, 245, 239, .86)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 7, 28, 20, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * 9, -10); ctx.lineTo(i * -7, 25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-24, i * 7 + 8); ctx.lineTo(24, i * -5 + 8); ctx.stroke();
  }
  ctx.restore();
}

function drawFish(f) {
  ctx.save();
  ctx.translate(f.x, f.y);
  if (f.vx < 0) ctx.scale(-1, 1);
  const grad = ctx.createLinearGradient(-f.r, -f.r, f.r, f.r);
  grad.addColorStop(0, f.accent);
  grad.addColorStop(0.45, f.color);
  grad.addColorStop(1, "#102635");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, f.r * 1.65, f.r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.moveTo(-f.r * 1.55, 0); ctx.lineTo(-f.r * 2.25, -f.r * 0.7); ctx.lineTo(-f.r * 2.05, 0); ctx.lineTo(-f.r * 2.25, f.r * 0.7); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath(); ctx.arc(f.r * 0.9, -f.r * 0.16, f.r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#071927";
  ctx.beginPath(); ctx.arc(f.r * 0.95, -f.r * 0.16, f.r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHud() {
  const time = Math.max(0, Math.ceil(serverState?.remaining ?? duration - (performance.now() - start) / 1000));
  const title = view === "host" ? "Host 全局海域" : `${players[Number(view)].name} 個人視角`;
  ctx.fillStyle = "rgba(2, 12, 20, .74)";
  ctx.fillRect(0, 0, W, 86);
  ctx.fillStyle = "#e7f8ff";
  ctx.font = "700 28px system-ui";
  ctx.fillText(`${title}   ${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`, 24, 38);
  ctx.font = "16px system-ui";
  ctx.fillText(`${online ? "Online server" : "Local"} | Space 發射魚網`, 24, 64);
  rank().forEach((p, i) => {
    const x = W - 232, y = 28 + i * 34;
    ctx.fillStyle = p.color;
    ctx.fillRect(x, y - 18, 14, 14);
    ctx.fillStyle = "#e7f8ff";
    ctx.fillText(`#${i + 1} ${p.name}: ${p.score}`, x + 24, y - 5);
  });
}

function drawResults() {
  ctx.fillStyle = "rgba(0,0,0,.72)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffe35c";
  ctx.font = "700 52px system-ui";
  ctx.fillText("捕魚比賽結束", 450, 230);
  ctx.font = "28px system-ui";
  rank().forEach((p, i) => ctx.fillText(`#${i + 1} ${p.name} - ${p.score}`, 520, 295 + i * 44));
}

function loop(now) {
  update(Math.min(0.033, (now - last) / 1000), now);
  draw();
  last = now;
  requestAnimationFrame(loop);
}

["Host", ...names].forEach((label, i) => {
  if (pageRole === "player" && i !== playerId + 1) return;
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = () => {
    view = i ? String(i - 1) : "host";
    document.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
  };
  if ((!i && view === "host") || String(i - 1) === view) b.className = "active";
  views.appendChild(b);
});
views.insertAdjacentHTML("beforeend", `<button id="fullscreen">全螢幕</button><button id="reset">重開</button><span class="hint">共享魚群・四人競技</span>`);
document.querySelector("#fullscreen").onclick = () => document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen();
document.querySelector("#reset").onclick = () => online && pageRole === "host" ? ws.send(JSON.stringify({ type: "reset" })) : location.reload();
hostLinks.addEventListener("click", e => {
  const url = e.target.dataset.copy;
  if (url) navigator.clipboard?.writeText(url);
});
addEventListener("keydown", e => {
  startMusic();
  if (e.code !== "Space" || pageRole === "host") return;
  e.preventDefault();
  online ? ws.send(JSON.stringify({ type: "fire", player: playerId })) : fire(players[playerId]);
});
addEventListener("pointerdown", startMusic, { once: true });
requestAnimationFrame(loop);

function startMusic() {
  if (musicTimer) return;
  audioCtx = new AudioContext();
  let step = 0;
  const notes = [147, 196, 247, 294, 247, 220, 196, 165];
  const play = () => {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = notes[step++ % notes.length];
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  };
  play();
  musicTimer = setInterval(play, 190);
}

window.__getDebugState = () => ({ online, view, playerId, pageRole, fish: fishes.filter(f => f.alive).length, players: players.map(p => ({ state: p.state, score: p.score })) });
window.__runSelfTest = () => {
  const p = players[0], old = p.state;
  p.state = "swing"; fire(p);
  console.assert(p.state === "out", "Space fires net");
  p.state = old;
  console.assert(fishes.length >= fishTarget, "many fish exist");
};
