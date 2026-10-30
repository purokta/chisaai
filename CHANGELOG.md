## 3.10.1 — 30 Okt 2026
- Baru: `#autodelete` (owner) — atur lama hapus otomatis pesan bot: `#autodelete 30m`, `#autodelete wa 10m`, `#autodelete tg 2j`, `off`. Berlaku di WhatsApp (menu, atau `semua` untuk semua balasan) dan Telegram. Bawaan 1 jam.
- Gacha: gambar anime selalu ditampilkan (cari gambar karakter, cadangan gambar anime acak); #summon (companion) ikut menampilkan gambar.
- Respon lebih cepat: penyimpanan database tidak lagi menulis ulang file tiap perubahan (ditunda & digabung), reaksi emoji/status mengetik tidak ditunggu.
- Workflow APK: build tidak lagi bertabrakan saat push + Run workflow bersamaan; log gradle diunggah sebagai artifact "log-gagal" bila build gagal.

