#!/data/data/com.termux/files/usr/bin/bash
# Installer otomatis CHISA-AI untuk Termux
set -e

echo ">> Update paket Termux..."
pkg update -y && pkg upgrade -y

echo ">> Install nodejs, ffmpeg, python, git, tmux..."
pkg install -y nodejs ffmpeg python git tmux
pkg install -y python-pip || true

echo ">> Install yt-dlp (cadangan downloader YouTube/IG/FB/TikTok)..."
pip install -U yt-dlp || pip install -U --break-system-packages yt-dlp || echo "!! yt-dlp gagal dipasang (tidak wajib)"

echo ">> Install modul Node..."
npm install --legacy-peer-deps --allow-git=all

echo ""
echo "Selesai! Jalankan bot dengan:  npm start"
