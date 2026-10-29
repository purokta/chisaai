## 3.10.0 — 30 Okt 2026
- APK: kustomisasi tampilan — 9 palet warna (+ Dinamis di Android 12+), mode Sistem/Terang/Gelap, 6 pilihan ikon aplikasi, ikon custom lewat pintasan layar utama.
- APK: banner YouTube di Home (link, detik mulai, saklar aktif, saklar suara). Banner menu bot dari YouTube lewat chat: `#setbanner <slot 1-4> <link> [mulai] [durasi]`, `#setbanner <slot> reset`.
- APK: tampilan lebih lembut (sudut membulat besar, permukaan pastel, judul tipis); saklar "Hapus log otomatis saat bot dimulai" (bawaan aktif).
- APK: nama berkas dan judul rilis memuat versi (chisa-ai-vX.Y.Z.apk).
- Telegram: pesan menu/tombol otomatis terhapus setelah 1 jam (bawaan).
- Perbaikan: pesan "yt-dlp belum terpasang" di Android — play/pencarian memakai jalur JS.

## 3.9.1 — 29 Okt 2026
- APK: log tidak pernah dihapus otomatis — dirotasi ke arsip (bot.log.1…5, total ±30 MB) dan Terminal/Log lengkap membaca lintas arsip; tombol Hapus minta konfirmasi.

## 3.9.0 — 29 Okt 2026
- Perbaikan: "spawn yt-dlp EACCES" — di Android yt-dlp dilewati (langsung jalur JS); EACCES diperlakukan seperti "belum terpasang".
- Banner bot per slot sama persis dengan aplikasi: slot dengan banner custom (GIF/MP4/gambar) dipakai, slot kosong memakai bawaan.
- APK: cek & pasang APK baru dari Releases GitHub (kartu "APK baru tersedia" di Home, otomatis dicek tiap 6 jam), saklar nyalakan bot otomatis setelah HP restart, tombol Hentikan di notifikasi, Reset sesi WhatsApp (pairing ulang). Rilis APK mencatat versionCode.

