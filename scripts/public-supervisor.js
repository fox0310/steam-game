const { spawn } = require("child_process");

const services = [
  ["gold", "server.js", { PORT: "5173" }],
  ["fishing", "fishing-game/server.js", { PORT: "5180" }],
  ["rocket", "rocket-game/server.js", { PORT: "5190" }],
  ["gateway", "gateway.js", { PORT: process.env.PUBLIC_PORT || process.env.PORT || "80" }]
];

const children = new Map();
let shuttingDown = false;

for (const [name, script, env] of services) {
  const child = spawn(process.execPath, [script], {
    env: { ...process.env, ...env },
    stdio: ["ignore", "inherit", "inherit"]
  });
  children.set(name, child);
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`${name} exited (${signal || code}); restarting all services`);
    shutdown(code || 1);
  });
}

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));

function shutdown(code) {
  shuttingDown = true;
  for (const child of children.values()) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 300).unref();
}
