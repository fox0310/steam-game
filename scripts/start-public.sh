#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
pkill -f "[n]ode server.js" || true
pkill -f "[n]ode fishing-game/server.js" || true
pkill -f "[n]ode gateway.js" || true

PORT=5173 node server.js &
PORT=5180 node fishing-game/server.js &
PORT="${PUBLIC_PORT:-${PORT:-80}}" node gateway.js &
wait
