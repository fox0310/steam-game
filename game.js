const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const views = document.querySelector("#views");
const wrap = document.querySelector(".wrap");
const W = canvas.width, H = canvas.height;
const colors = ["#f05d5e", "#4da3ff", "#54d17a", "#ffd23f"];
const names = ["Player 1", "Player 2", "Player 3", "Player 4"];
const imgs = {};
let view = "host", start = performance.now(), last = start, over = false;
let audioCtx = null, musicTimer = null;
const duration = 180;
const goldTarget = 12;

["back_cave", "user_miner_cutout", "spr_obj_cart_str_complete_anim", "user_claw_v2"].forEach(name => {
  imgs[name] = new Image();
  imgs[name].src = `assets/${name}.${name === "spr_obj_cart_str_complete_anim" ? "gif" : "png"}`;
});

const players = names.map((name, i) => ({
  name, color: colors[i], score: 0,
  x: 250 + i * 260, y: 225, angle: -0.75 + i * 0.5, len: 46,
  state: "swing", target: null, cooldown: 0
}));

let nextGoldId = 0, nextSpawnAt = 0;
const golds = [
  [210, 330, 34, 100], [360, 455, 48, 250], [545, 360, 60, 500], [730, 520, 36, 100],
  [900, 398, 50, 250], [1070, 520, 64, 500], [180, 585, 42, 250], [602, 610, 30, 100],
  [815, 305, 24, 800], [1110, 320, 30, 100], [455, 575, 26, 800], [1010, 610, 38, 250]
].map(([x, y, r, score]) => ({ id: nextGoldId++, x, y, r, score, alive: true, locked: false }));
const params = new URLSearchParams(location.search);
const playerId = params.has("player") ? Math.max(0, Math.min(3, Number(params.get("player")) || 0)) : 0;
const pageRole = params.get("role") === "host" ? "host" : (params.has("player") ? "player" : "local");
let online = false, serverState = null, ws = null;
if (params.has("player")) view = String(playerId);
connect();

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
  over = (duration - (now - start) / 1000) <= 0;
  if (!over && now >= nextSpawnAt && golds.filter(g => g.alive).length < goldTarget) {
    spawnGold();
    nextSpawnAt = now + 2000;
  }
  for (const p of players) {
    if (p.state === "swing") {
      p.angle = Math.sin(now / 650 + players.indexOf(p) * 0.9) * 0.9;
      continue;
    }
    if (p.state === "cool") {
      p.cooldown -= dt;
      if (p.cooldown <= 0) p.state = "swing";
      continue;
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

function applyServerState() {
  players.splice(0, players.length, ...serverState.players.map(p => ({ ...p })));
  golds.splice(0, golds.length, ...serverState.golds.map(g => ({ ...g })));
  over = serverState.over;
}

function spawnGold() {
  const types = [[28, 100], [42, 250], [58, 500], [22, 800]];
  const [r, score] = types[Math.floor(Math.random() * types.length)];
  golds.push({
    id: nextGoldId++,
    x: 160 + Math.random() * 960,
    y: 320 + Math.random() * 300,
    r,
    score,
    alive: true,
    locked: false
  });
}

function clawTip(p) {
  return { x: p.x + Math.sin(p.angle) * p.len, y: p.y + Math.cos(p.angle) * p.len };
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(imgs.back_cave, 0, 0, W, H);
  ctx.fillStyle = "rgba(8, 10, 8, .38)";
  ctx.fillRect(0, 0, W, H);
  golds.filter(g => g.alive).forEach(drawGold);
  const shown = view === "host" ? players : [players[Number(view)]];
  shown.forEach(drawPlayer);
  drawHud(shown);
  if (over) drawResults();
}

function drawGold(g) {
  ctx.globalAlpha = g.locked ? 0.45 : 1;
  const grad = ctx.createRadialGradient(g.x - g.r * 0.25, g.y - g.r * 0.35, 3, g.x, g.y, g.r);
  grad.addColorStop(0, "#fff6a8");
  grad.addColorStop(0.42, "#f7c52d");
  grad.addColorStop(1, "#9b5e06");
  ctx.fillStyle = grad;
  ctx.strokeStyle = "#6c3d05";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x - g.r * 0.8, g.y + g.r * 0.1);
  ctx.lineTo(g.x - g.r * 0.35, g.y - g.r * 0.65);
  ctx.lineTo(g.x + g.r * 0.45, g.y - g.r * 0.55);
  ctx.lineTo(g.x + g.r * 0.82, g.y + g.r * 0.05);
  ctx.lineTo(g.x + g.r * 0.28, g.y + g.r * 0.72);
  ctx.lineTo(g.x - g.r * 0.5, g.y + g.r * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath();
  ctx.ellipse(g.x - g.r * 0.22, g.y - g.r * 0.22, g.r * 0.16, g.r * 0.08, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.drawImage(imgs.user_miner_cutout, 95, 0, 390, 500, -58, -165, 116, 148);
  ctx.drawImage(imgs.spr_obj_cart_str_complete_anim, -69, -45, 138, 74);
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = p.color;
  ctx.fillRect(-63, -31, 126, 32);
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.color;
  ctx.fillRect(-44, -33, 88, 9);
  ctx.restore();

  const tip = clawTip(p);
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(-p.angle);
  ctx.drawImage(imgs.user_claw_v2, -38, -32, 76, 76);
  ctx.restore();
  if (p.target) drawGold({ ...p.target, x: tip.x, y: tip.y, r: p.target.r * 0.75 });
}

function drawHud(shown) {
  const left = view === "host" ? "Host 全局畫面" : `${players[Number(view)].name} 個人視角`;
  const time = Math.max(0, Math.ceil(serverState?.remaining ?? duration - (performance.now() - start) / 1000));
  ctx.fillStyle = "rgba(15, 12, 8, .72)";
  ctx.fillRect(0, 0, W, 82);
  ctx.fillStyle = "#ffe3a0";
  ctx.font = "700 28px system-ui";
  ctx.fillText(`${left}   ${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`, 24, 38);
  ctx.font = "16px system-ui";
  ctx.fillText(`${online ? "Online server" : "Local"}｜Space 出爪`, 24, 64);

  rank().forEach((p, i) => {
    const x = W - 230, y = 28 + i * 34;
    ctx.fillStyle = p.color;
    ctx.fillRect(x, y - 18, 14, 14);
    ctx.fillStyle = "#fff3c7";
    ctx.fillText(`#${i + 1} ${p.name}: ${p.score}`, x + 24, y - 5);
  });
}

function drawResults() {
  ctx.fillStyle = "rgba(0, 0, 0, .72)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffd45a";
  ctx.font = "700 52px system-ui";
  ctx.fillText("比賽結束", 505, 230);
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
views.insertAdjacentHTML("beforeend", `<button id="fullscreen">全螢幕</button><button id="reset">重開</button><span class="hint">本地原型：共享礦場、四人同機測試</span>`);
document.querySelector("#fullscreen").onclick = () => {
  startMusic();
  document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen();
};
document.querySelector("#reset").onclick = () => {
  if (online && pageRole === "host") ws.send(JSON.stringify({ type: "reset" }));
  else location.reload();
};
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
  const notes = [196, 247, 294, 330, 294, 247, 220, 247];
  const play = () => {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = notes[step++ % notes.length];
    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  };
  play();
  musicTimer = setInterval(play, 180);
}

window.__getDebugState = () => ({
  online, view, playerId, pageRole, music: !!musicTimer,
  remaining: serverState?.remaining ?? duration - (performance.now() - start) / 1000,
  players: players.map(p => ({ state: p.state, score: p.score }))
});

window.__runSelfTest = () => {
  console.assert(rank()[0].score >= rank()[3].score, "ranking sorts high score first");
  const p = players[0], old = p.state;
  const wasOnline = online;
  online = false;
  p.state = "swing"; fire(p);
  console.assert(p.state === "out", "fire moves swing to out");
  p.state = old;
  online = wasOnline;
  golds.forEach(g => g.alive = false);
  spawnGold();
  console.assert(golds.some(g => g.alive), "spawnGold creates live gold");
};
