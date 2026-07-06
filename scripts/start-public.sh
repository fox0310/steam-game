#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
pkill -f "[n]ode server.js" || true
pkill -f "[n]ode fishing-game/server.js" || true
pkill -f "[n]ode rocket-game/server.js" || true
pkill -f "[n]ode gateway.js" || true

exec node scripts/public-supervisor.js
