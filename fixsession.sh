#!/data/data/com.termux/files/usr/bin/bash
# Memperbaiki error "Bad MAC" / "Failed to decrypt" / "Waiting for this message".
# Yang dihapus HANYA kunci enkripsi per-kontak (session-*, sender-key-*). Login bot (creds.json) TIDAK dihapus,
# jadi tidak perlu pairing ulang. Kunci dibuat ulang otomatis saat ada pesan baru.
#   bash fixsession.sh
cd "$(dirname "$0")"
bash stop.sh >/dev/null 2>&1 || true
[ -d session ] || { echo "Folder session tidak ada (bot belum login)."; exit 1; }
mkdir -p "$HOME/chisa-backup" 2>/dev/null
tar -czf "$HOME/chisa-backup/session-sebelum-fix-$(date +%Y%m%d-%H%M%S).tar.gz" session 2>/dev/null && echo "Cadangan: $HOME/chisa-backup"
n=$(ls session 2>/dev/null | grep -Ec '^(session|sender-key|sender-key-memory)-' || true)
rm -f session/session-* session/sender-key-* session/sender-key-memory-* 2>/dev/null
echo "✅ $n file kunci lama dihapus. Login (creds.json) aman."
echo "   Jalankan bot: npm start   (JANGAN tekan Ctrl+Z, pakai Ctrl+C untuk berhenti)"
