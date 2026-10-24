#!/data/data/com.termux/files/usr/bin/bash
# Menjalankan bot dan otomatis menghidupkannya lagi setelah #restart / #update / crash.
# Berhenti dengan Ctrl+C.
cd "$(dirname "$0")"
export CHISA_SUPERVISED=1
echo $$ > .bot.pid
trap 'rm -f .bot.pid' EXIT
fails=0

while true; do
  started=$(date +%s)
  ${NODE_BIN:-node} index.js
  code=$?

  # keluar normal / dihentikan manual -> berhenti
  if [ "$code" -eq 0 ] || [ "$code" -eq 130 ] || [ "$code" -eq 143 ]; then break; fi

  # crash berulang dalam waktu singkat -> berhenti supaya tidak looping tanpa henti
  if [ $(( $(date +%s) - started )) -lt 15 ] && [ "$code" -ne 2 ]; then fails=$((fails + 1)); else fails=0; fi
  if [ "$fails" -ge 5 ]; then
    echo "!! Bot berhenti terus-menerus (kode $code). Baca error di atas lalu jalankan lagi."
    break
  fi

  echo "↻ Memulai ulang bot..."
  sleep 2
done
