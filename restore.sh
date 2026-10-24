#!/data/data/com.termux/files/usr/bin/bash
# Memulihkan login (session) dari backup:  bash restore.sh [file.tar.gz]
# Tanpa argumen: memakai backup terbaru di Download/chisa-backup (atau ~/chisa-backup).
set -e
cd "$(dirname "$0")"
F="$1"
if [ -z "$F" ]; then
  for d in "$HOME/storage/downloads/chisa-backup" "$HOME/chisa-backup"; do
    f="$(ls -t "$d"/chisa-session-*.tar.gz 2>/dev/null | head -1 || true)"
    if [ -n "$f" ]; then F="$f"; break; fi
  done
fi
[ -f "$F" ] || { echo "!! Backup tidak ditemukan. Pakai: bash restore.sh /path/file.tar.gz"; exit 1; }
bash stop.sh >/dev/null 2>&1 || true
[ -d session ] && mv session "session.lama.$(date +%s)"
tar -xzf "$F" -C .
echo "✅ Session dipulihkan dari: $F"
echo "   Jalankan bot: npm start"
