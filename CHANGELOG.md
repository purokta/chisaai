## 3.12.1 — 31 Okt 2026
- Stiker animasi: video/GIF kembali jadi stiker bergerak bila ffmpeg tersedia (bawaan APK atau Termux); tanpa ffmpeg tetap stiker diam.
- #play: judul lagu, channel, dan durasi dikirim sebagai pesan tersendiri (tidak ikut terhapus auto-delete); nama berkas audio memakai judul lagu.
- #diag: tidak lagi mengirim audio tes; hanya memeriksa format hasil unduhan.

## 3.12.0 — 31 Okt 2026
- ffmpeg kembali ke APK, kali ini dibangun untuk Android (NDK, arm64, dengan opus/mp3/x264/webp) oleh workflow Build APK — bukan biner glibc yang dimatikan Android. Build pertama +10 menit, berikutnya memakai cache. Bila gagal dibangun, APK tetap jadi tanpa ffmpeg. Aplikasi menguji ffmpeg saat bot mulai; bila jalan, dipakai langsung (tanpa Termux).
- Alat Termux: aplikasi kini bisa memakai ffmpeg & yt-dlp milik Termux lewat server lokal (127.0.0.1:38918). Android melarang aplikasi menjalankannya sendiri, tapi Termux boleh. Pengaturan → "Nyalakan alat Termux" (pasang sekali: `pkg install nodejs ffmpeg yt-dlp`, lalu `allow-external-apps = true` di ~/.termux/termux.properties).
- Bila alat Termux aktif: ffmpeg (voice note, thumbnail, banner, konversi audio) dan yt-dlp (unduh YouTube/TikTok/dll) jalan otomatis; bila mati, bot memakai jalur bawaan seperti sebelumnya.
- Keamanan: server hanya di localhost, hanya ffmpeg/ffprobe/yt-dlp, argumen berbahaya (path luar, URL di ffmpeg, --exec dll di yt-dlp) ditolak.
- #diag: tambah tes "Alat Termux".

## 3.11.0 — 31 Okt 2026
- Aplikasi: 4 tab — Home, Terminal, Pengaturan (sekarang memuat Tampilan, Ikon, Banner & YouTube, Bot, GitHub), Tentang (pengembang + foto/nama/bio owner bot yang bisa diganti). Ikon aplikasi bawaan memakai gambarmu.
- Stiker diperbaiki di Android: konversi gambar lewat server lokal di aplikasi (ffmpeg diblokir Android). Video/GIF jadi stiker diam (animasi belum didukung). Perintah #toimg untuk stiker diam juga jalan.
- Owner bot: koin, tiket gacha, gold RPG, dan limit selalu 99999+.
- Telegram: bawaan hanya pesan sementara (⏳ 🔎) yang dihapus; menu, lagu, gacha dan hasil lain tetap. `#autodelete tg menu` untuk ikut menghapus menu.
- #play: mencoba beberapa hasil pencarian & lebih banyak klien YouTube (ANDROID_VR, TV, …); peringatan parser youtubei didiamkan; galat tiap percobaan ditampilkan.
- Perintah #owner memakai foto owner dari aplikasi.

## 3.10.9 — 31 Okt 2026
- ffmpeg dibuang dari APK (bawaan): biner statis glibc dimatikan Android (SIGSYS), jadi tidak pernah jalan; APK jauh lebih kecil. Voice note menu sudah OGG siap kirim; thumbnail memakai JPEG apa adanya; `#setbanner` memakai video pendek utuh (≤ 3 menit) bila ffmpeg tidak ada.
- Gacha/summon: gambar dari beberapa sumber bergantian (AniList, nekos.best, waifu.pics, waifu.im, nekos.life); `#diag` menunjukkan sumber mana yang gagal.
- Aplikasi: banner YouTube diunduh bot lalu diputar pemutar aplikasi (tanpa embed YouTube, tanpa error 152); status unduhan tampil di tab Banner. Pilihan ikon: ganti ikon aplikasi atau pasang pintasan ber-ikon di layar utama.
- `#diag`: tes terpisah ytdl-core, youtubei.js, dan alur play/mp3 lengkap sampai terkirim.

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

