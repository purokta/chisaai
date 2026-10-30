## 3.10.8 — 30 Okt 2026
- Dari hasil #diag: jaringan Google/WhatsApp/Telegram/gambar anime gagal sementara YouTube jalan -> kemungkinan IPv6 HP tidak tersambung. Bot kini mengutamakan IPv4 (dns ipv4first + autoSelectFamily). Ini juga bisa mengurangi delay pesan.
- Play YouTube: galat "invalid onError method" (undici ytdl-core tidak cocok dengan fetch bawaan Node 18) diatasi dengan memakai fetch undici milik ytdl-core selama proses unduh.
- youtubei.js: regex `\p{Emoji}` di modul ESM ditambal saat build APK (scripts/patch-regex.js), karena penambal runtime hanya untuk CommonJS.
- #diag menampilkan sinyal/kode/penyebab/stderr untuk tiap ❌ (mis. ffmpeg).

## 3.10.7 — 30 Okt 2026
- Perbaikan "ytdl-core/youtubei belum terpasang" di Android: Node 18 tidak punya `File`, `CustomEvent`, `Array.toSorted`, `Promise.withResolvers`, dll yang dibutuhkan library terbaru -> ditambal (lib/node18-compat.js). Pesan error kini menyebut penyebab asli pemuatan library.
- Gacha: gambar dikirim lewat unduhan sendiri, lalu lewat link langsung bila gagal; galat dicatat di log ([gacha] ...). `#diag` menguji gambar anime & pemuatan ytdl-core.

## 3.10.6 — 30 Okt 2026
- APK lebih kecil: hanya arm64 (armeabi-v7a dibuang), biner sharp/libvips x64 dan dokumen/peta/tipe/tes di node_modules tidak ikut dipaketkan. Build mencetak ukuran komponen di log.
- Play/unduh YouTube: library lokal dicoba lebih dulu (API pihak ketiga jadi cadangan). youtubei.js versi terbaru ditambahkan (dengan evaluator JS sendiri) dan mencoba beberapa klien YouTube bergantian; versi lama tetap jadi cadangan.

## 3.10.5 — 30 Okt 2026
- Voice note: musik menu kini bawaan OGG/Opus (assets/music.ogg), langsung terkirim tanpa ffmpeg; bila konversi perlu, ada encoder cadangan.
- Play/unduh audio: mimetype dikenali dari isi berkas (m4a/ogg/mp3), webm dikonversi bila ffmpeg ada — tidak lagi "audio tidak bisa diputar".
- Banner: hanya banner1 bawaan; slot 2-4 lewat `#setbanner <slot> <link YouTube>`. Banner YouTube di aplikasi memakai header Referer.
- `#diag` (owner): tes ffmpeg, voice note, YouTube, jaringan, kecepatan kirim — kirim hasilnya bila ada yang gagal.
- WhatsApp delay: aplikasi menahan WiFi tetap aktif (WifiLock); bot mencatat `[lambat]` bila pesan tiba >5 dtk setelah dikirim.

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

