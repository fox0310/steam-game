#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
pkill -f "[n]ode server.js" || true
pkill -f "[n]ode fishing-game/server.js" || true
pkill -f "[n]ode gateway.js" || true

node server.js &
node fishing-game/server.js &
PORT="${PORT:-80}" node gateway.js &
wait
