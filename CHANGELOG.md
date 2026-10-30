## 3.10.4 — 30 Okt 2026
- Nomor owner/VIP dihapus dari script (settings.example.js). Nomor WA bot, owner, dan token Telegram cukup diisi di aplikasi (tab Pengaturan).

## 3.10.3 — 30 Okt 2026
- Perbaikan build APK: `onActivityResult` terdefinisi ganda di MainActivity (kompilasi Java gagal). Pilih gambar ikon custom dan banner kini lewat satu handler.

## 3.10.2 — 30 Okt 2026
- Workflow APK: kegagalan gradle tidak lagi tersamar (langkah `cp` ikut gagal); penyebab error ditampilkan di langkah "Tampilkan penyebab error".

## 3.10.1 — 30 Okt 2026
- Baru: `#autodelete` (owner) — atur lama hapus otomatis pesan bot: `#autodelete 30m`, `#autodelete wa 10m`, `#autodelete tg 2j`, `off`. Berlaku di WhatsApp (menu, atau `semua` untuk semua balasan) dan Telegram. Bawaan 1 jam.
- Gacha: gambar anime selalu ditampilkan (cari gambar karakter, cadangan gambar anime acak); #summon (companion) ikut menampilkan gambar.
- Respon lebih cepat: penyimpanan database tidak lagi menulis ulang file tiap perubahan (ditunda & digabung), reaksi emoji/status mengetik tidak ditunggu.
- Workflow APK: build tidak lagi bertabrakan saat push + Run workflow bersamaan; log gradle diunggah sebagai artifact "log-gagal" bila build gagal.

