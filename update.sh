#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  UPDATE CHISA-AI
#  Memasang versi baru TANPA menghapus login (session), pengaturan (settings.js), dan data.
#
#  Pemakaian:
#    bash update.sh                      -> pakai zip chisa-ai*.zip TERBARU di folder Download
#    bash update.sh /path/ke/file.zip    -> pakai zip tertentu
#    bash update.sh https://link/x.zip   -> unduh zip dari link (mis. repo GitHub kamu)
#    (tambah kata  paksa  di belakang untuk mengizinkan menurunkan versi)
# ============================================================
set -e
# Seluruh skrip dibungkus fungsi: bash membaca & memeriksa semuanya DULU sebelum menjalankan.
# Tanpa ini, update.sh yang menimpa dirinya sendiri di tengah proses bisa error ("syntax error near unexpected token").
main() {
cd "$(dirname "$0")"
APP="$(pwd)"
SRC="$1"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ---- 1. cari / unduh zip ----
ZIP=""
if [ -z "$SRC" ]; then
  for d in "$HOME/storage/downloads" "$HOME/storage/shared/Download" "/sdcard/Download" "$HOME"; do
    f="$(ls -t "$d"/chisa-ai*.zip 2>/dev/null | head -1 || true)"
    if [ -n "$f" ]; then ZIP="$f"; break; fi
  done
  if [ -z "$ZIP" ]; then
    echo "!! Zip tidak ditemukan."
    echo "   Simpan zip baru ke folder Download (nama berawalan chisa-ai), lalu jalankan lagi."
    echo "   Kalau belum pernah: termux-setup-storage"
    exit 1
  fi
elif [[ "$SRC" == http* ]]; then
  echo ">> Mengunduh $SRC"
  ZIP="$WORK/update.zip"
  curl -fsSL "$SRC" -o "$ZIP"
else
  ZIP="$SRC"
fi
[ -f "$ZIP" ] || { echo "!! File tidak ada: $ZIP"; exit 1; }
echo ">> Memakai: $ZIP"

# ---- 2. ekstrak & cari folder bot di dalamnya ----
unzip -q -o "$ZIP" -d "$WORK/x"
ENTRY="$(find "$WORK/x" -maxdepth 3 -name index.js -not -path "*/node_modules/*" | head -1)"
if [ -z "$ENTRY" ]; then echo "!! Isi zip tidak valid (index.js tidak ditemukan)."; exit 1; fi
NEW="$(dirname "$ENTRY")"
[ -f "$NEW/package.json" ] || { echo "!! package.json tidak ada di zip."; exit 1; }

ver() { grep -m1 '"version"' "$1" 2>/dev/null | sed 's/[^0-9.]//g'; }
OLDVER="$(ver package.json)"
NEWVER="$(ver "$NEW/package.json")"

# ---- pengaman: jangan menurunkan versi tanpa sengaja (mis. repo GitHub-mu masih berisi versi lama) ----
if [ -n "$OLDVER" ] && [ -n "$NEWVER" ] && [ "$2" != "paksa" ] && [ "$OLDVER" != "$NEWVER" ] \
   && [ "$(printf '%s\n%s\n' "$OLDVER" "$NEWVER" | sort -V | tail -1)" = "$OLDVER" ]; then
  echo "!! Dibatalkan: versi di zip (v$NEWVER) LEBIH LAMA dari yang terpasang (v$OLDVER)."
  echo "   Kalau memakai link GitHub: push dulu versi terbarumu (#push / bash deploy.sh)."
  echo "   Kalau memang ingin menurunkan versi:  bash update.sh \"$SRC\" paksa"
  exit 1
fi

# ---- 3. amankan milikmu ----
# versi lama menyimpan pengaturan di config.js: simpan salinannya sekali supaya bisa dilihat lagi
if [ -f config.js ] && ! grep -q "defaults" config.js && [ ! -f config.old.js ]; then
  cp config.js config.old.js
  echo ">> Config lama disimpan di config.old.js"
fi
[ -f settings.js ] && cp settings.js "$WORK/settings.js.bak"
deps() { node -p "JSON.stringify(require('$1').dependencies||{})" 2>/dev/null || echo none; }
PKG_BEFORE="$(deps "$APP/package.json")"

# ---- 4. timpa kode ----
cp -rf "$NEW"/. "$APP"/
[ -f "$WORK/settings.js.bak" ] && cp "$WORK/settings.js.bak" settings.js
# bersihkan sisa file versi lama yang sudah diganti nama / dihapus (supaya tidak ada perintah ganda)
OLDN="di""ony"
rm -rf "$APP/$OLDN" "$APP/lib/$OLDN.js" "$APP/lib/${OLDN}menu.js" "$APP/commands/$OLDN.js" "$APP/assets/banner.mp4" 2>/dev/null

# ---- 5. modul npm (hanya kalau berubah) ----
PKG_AFTER="$(deps "$APP/package.json")"
if [ "$PKG_BEFORE" != "$PKG_AFTER" ] || [ ! -d node_modules ]; then
  echo ">> Memasang modul npm..."
  npm install --legacy-peer-deps --allow-git=all
fi

echo ""
echo "✅ Update selesai: v${OLDVER:-?} -> v${NEWVER:-?}"
echo "   Login, settings.js, dan data kamu tidak berubah."
if [ -z "$CHISA_SUPERVISED" ]; then
  echo "   Mulai ulang bot supaya versi baru aktif:"
  echo "   - kalau jalan di tmux: tmux attach -t bot, Ctrl+C, lalu npm start"
  echo "   - atau kirim #restart dari WhatsApp (khusus owner)"
fi
}
main "$@"
exit $?
