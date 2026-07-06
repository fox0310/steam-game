#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
repo_dir="$(pwd)"

sudo tee /etc/systemd/system/steam-games.service >/dev/null <<EOF
[Unit]
Description=Steam classroom games
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$repo_dir
Environment=PUBLIC_PORT=80
ExecStart=$repo_dir/scripts/start-public.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable steam-games.service
sudo systemctl restart steam-games.service
sudo systemctl --no-pager status steam-games.service
