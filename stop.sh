#!/data/data/com.termux/files/usr/bin/bash
# Mematikan bot dari Termux:  bash stop.sh
cd "$(dirname "$0")"
stopped=0
if [ -f .bot.pid ]; then
  pid="$(cat .bot.pid)"
  if kill -0 "$pid" 2>/dev/null; then
    pkill -TERM -P "$pid" 2>/dev/null   # hentikan node (anak dari start.sh)
    kill -TERM "$pid" 2>/dev/null       # hentikan start.sh supaya tidak menyala lagi
    stopped=1
  fi
  rm -f .bot.pid
fi
# cadangan: bot yang dijalankan tanpa start.sh (npm run start:plain)
for p in $(pgrep -f "^node index.js" 2>/dev/null); do
  if [ "$(readlink /proc/$p/cwd 2>/dev/null)" = "$(pwd)" ]; then kill -TERM "$p" 2>/dev/null && stopped=1; fi
done
if [ "$stopped" = 1 ]; then echo "🛑 Bot dimatikan."; else echo "Bot tidak sedang berjalan."; fi
