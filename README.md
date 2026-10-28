<p align="center"><img src="docs/banner.gif" alt="CHISA-AI" width="400"></p>

# 🤖 CHISA-AI — Bot WhatsApp untuk Termux

_by @sipurse_ — mohon pertahankan watermark ini.

Login lewat **nomor (pairing code)**, tanpa scan QR. Gratis. Fitur mudah ditambah, dan bisa di-update tanpa login ulang.

## Pasang & jalankan

```bash
unzip chisa-ai.zip && cd chisa-ai
bash install.sh        # sekali saja
npm start
```

Masukkan nomor WA bot → muncul kode 8 karakter → WhatsApp: **Perangkat tertaut → Tautkan perangkat → Tautkan dengan nomor telepon** → ketik kodenya. Sesi tersimpan di folder `session`.

Biar tidak mati: `termux-wake-lock`, matikan optimasi baterai Termux, jalankan di tmux (`tmux new -s bot`, `npm start`; keluar `Ctrl+B` lalu `D`; masuk lagi `tmux attach -t bot`).

## Update bot (tanpa login ulang)

1. Simpan zip versi baru ke folder **Download** HP (nama berawalan `chisa-ai`).
2. Di Termux:
```bash
cd ~/chisa-ai
bash update.sh
```
Skrip memilih zip `chisa-ai*.zip` **terbaru** di Download, menimpa kode, dan **tidak menyentuh** `session` (login), `settings.js` (pengaturanmu), dan `data`. `npm install` hanya jalan kalau ada paket baru.

Variasi: `bash update.sh /path/file.zip` atau `bash update.sh https://link-zip`.

Lalu mulai ulang: kirim `#restart` dari WhatsApp (khusus owner, kalau bot dijalankan dengan `npm start`), atau Ctrl+C lalu `npm start`.

**Update lewat WhatsApp (`#update`)**: bot ini sudah diarahkan ke repo **purokta/chisaai** (`https://github.com/purokta/chisaai/archive/refs/heads/main.zip`, repo harus Public). Ganti di `settings.js` → `update.url` kalau repo-mu lain. Setelah itu kirim `#update` dan bot mengunduh, memasang, dan restart sendiri.

## Pengaturan

Semua pengaturanmu ada di **`settings.js`** (dibuat otomatis dari `settings.example.js`): owner, VIP, nama stiker, API key, link update. File ini aman dari update. `defaults.js` jangan diedit.

## Prefix

`.  !  ?  /  #  $`, contoh `.menu`, `#menu`, `!menu`. Kata `menu` dan `owner` juga boleh diketik tanpa prefix.

## Fitur

| Perintah | Fungsi |
|---|---|
| `#menu` | Banner + daftar berkelompok + voice note musik. `menu grup` = satu kategori, `menu semua`. |
| `#status` | Status bot & server |
| `#s` | Gambar/video → stiker (kirim dengan caption `#s`, atau reply) |
| `#toimg` | Stiker → gambar |
| `#stext` / `#stextanim` | Teks → stiker / stiker teks animasi hitam-putih |
| `#take pack\|author` | Ganti nama pack stiker (reply stikernya) |
| `#dl link` | TikTok, Instagram, YouTube, Facebook, dan link lain (X, Pinterest, dll. lewat yt-dlp) |
| `#ytmp3 link` | Audio dari link |
| `#play judul` / `#ytsearch` / `#lirik` | Musik: cari & kirim MP3, cari video, lirik |
| `#ai` / `#img` / `#hd` / `#search` | Tanya AI (**bisa baca gambar**: kirim/reply foto + `#ai pertanyaan`), gambar AI, enhancer, cari info |
| `#ringkas link/teks` | Ringkas isi link atau teks panjang |
| `#limit` | Sisa jatah pemakaian hari ini |
| **Inventory** | `#petik` (buah gratis), `#inv` (level, EXP, koin, buah), `#makan buah` (jadi EXP), `#jual buah/semua` (jadi koin), `#harga`, `#topbuah`. Menang game = +20 EXP & peluang dapat buah |
| `#pp` / `owner` | Foto profil (reply) / profil owner |
| **Grup** (admin) | `#tagall #hidetag #kick #promote #demote #linkgrup #tutupgrup #bukagrup #admin #infogrup #hapus #antilink on/off #welcome on/off` |
| **Alat** | `#calc #tr #qr #ssweb #tourl #ocr #tomp3 #tovn #ingatkan 10m pesan` |
| **Info** | `#cuaca #kurs #gempa #jam #wiki` |
| **Islami** | `#sholat kota`, `#quran 2 255` |
| **Anime** | `#waifu #neko #megumin #shinobu #animeinfo judul` (hanya SFW) |
| **Game** | `#tebakkata #asahotak #caklontong #susunkata #tebakgambar #tebakbendera`, `#hint #nyerah #skor` (jawab langsung di chat) |
| **Chat biasa** | Dibalas AI otomatis |

**Khusus owner**
- `#self` (atau `#private`): mode **SELF**. Bot hanya melayani owner dan **VIP**.
- `#public`: mode **PUBLIC**, semua orang dilayani.
- `#vip add 08xxx` / `#vip del 08xxx` / `#vip list` (juga bisa reply atau tag orangnya). VIP bawaan ada di `settings.js`.
- `#ban @orang` / `#unban @orang` (tag, reply, atau nomor), `#banlist`: pengguna diblokir diabaikan total.
- `#setlimit 100`: batas perintah per orang per hari (0 = tanpa batas). Owner dan VIP selalu bebas. Ada juga jeda anti-spam antar perintah.
- `#backup`: simpan cadangan login (`session`) ke `Download/chisa-backup` (otomatis tiap 24 jam, simpan 5 terbaru). Pulihkan: `bash restore.sh`.
- `#stop`: matikan bot. Dari Termux: `bash stop.sh`. Nyalakan lagi: `npm start`.
- `#autoreply on/off`, `#reload`, `#restart`, `#update`, `#deploy`.

Owner = nomor di `settings.js` dan pesan yang diketik langsung dari nomor bot sendiri. Auto-reply di grup hanya jika bot di-tag, di-reply, atau diawali kata "chisa".

## Backup & pulihkan login

Backup otomatis tersimpan di `Download/chisa-backup` (atau `~/chisa-backup`) dan **tidak dikirim lewat WhatsApp**. File itu berisi login bot, jadi jangan dibagikan. Kalau login rusak atau HP direset: `cd ~/chisa-ai && bash restore.sh` lalu `npm start`. Atur di `settings.js`: `backup: { auto: true, everyHours: 24, keep: 5 }`, dan batas harian `limit: { daily: 100 }`.

## Deploy ke GitHub (purokta/chisaai)

```bash
cd ~/chisa-ai
printf 'session/\ndata/\nsettings.js\nnode_modules/\ntmp/\nbackups/\n.bot.pid\n' > .gitignore
git init && git add . && git commit -m "CHISA-AI"
git branch -M main
git remote add origin https://github.com/purokta/chisaai.git   # kalau sudah ada: git remote set-url origin ...
git push -u origin main
```
Login GitHub dengan token (`ghp_...`) sebagai password, atau `pkg install gh && gh auth login`. Update berikutnya: `git add . && git commit -m update && git push`. Folder `session` jangan pernah di-push.

## Gaya menu

Bawaan: kartu teks berkelompok (banner + daftar per kategori), lalu voice note musik otomatis.

## Thumbnail & musik (voice note) menu

Taruh filemu di `assets/custom/` dengan nama `thumbnail.jpg` dan `music.mp3` (aman dari update, langsung berlaku). Detail: `assets/README.txt`. Matikan: hapus file, atau `menu: { thumbnail: false, music: false }` di `settings.js`.

## Menambah fitur

1. Salin `commands/_template.js` jadi `commands/fiturbaru.js` (nama file tidak boleh diawali `_`).
2. Ubah isinya.
3. Kirim `#reload`. Menu ikut terupdate otomatis.

## Batasan yang perlu diketahui

- **API gratis** (Pollinations, tikwm, API downloader publik, terjemah, OCR, upload, cuaca, dll.) bisa dibatasi atau mati sewaktu-waktu. Untuk AI yang lebih stabil, isi key gratis di `settings.js` (lihat contoh di dalamnya).
- **`#hd`** memperbesar 2x, mengurangi noise, dan mempertajam di HP (bukan AI generatif, jadi tidak "menggambar ulang" detail yang hilang).
- **`#search`** memakai DuckDuckGo, cadangan Wikipedia.
- **Downloader**: TikTok via tikwm; IG/FB/YT via API publik lalu yt-dlp. Update yt-dlp kalau gagal: `pip install -U yt-dlp`.
- `#stext` / `#stextanim` mendukung huruf latin, angka, tanda baca (emoji belum).
- Pakai nomor cadangan untuk bot, karena bot tidak resmi punya risiko nomor dibatasi/banned.

## Kalau ada masalah

- **Log penuh "Bad MAC" / "Failed to decrypt" atau pesan "Waiting for this message"**: kunci enkripsi kontak tidak cocok (biasanya karena bot jalan ganda, atau bot dihentikan dengan Ctrl+Z). Jalankan `bash fixsession.sh` (login tidak hilang, tidak perlu pairing ulang), lalu `npm start`. Untuk berhenti pakai **Ctrl+C**, bukan Ctrl+Z. Kalau terlanjur Ctrl+Z: ketik `kill %1`.

- **"Waiting for this message" di WhatsApp**: pastikan bot hanya jalan **satu** (tutup tmux/Termux lain), lalu `npm start` ulang (v2.2 sudah menyimpan pesan untuk dikirim ulang). Kalau masih, hapus folder `session` dan pairing ulang.
- **`#play` / link lain gagal**: `pkg install python` lalu `pip install -U yt-dlp`.

- **Owner/VIP tidak dikenali di grup**: ketik `#myid`, lalu tempel angka LID-nya di `settings.js` → `ownerLids`.
- **Logout / error sesi**: hapus folder `session`, jalankan ulang.
- **Error versi Baileys**: `npm i @whiskeysockets/baileys@latest --legacy-peer-deps`.
- **"Program ffmpeg belum terpasang"**: `pkg install ffmpeg`.


## Deploy update ke GitHub (`#deploy`)
Kirim kode bot terbaru dari HP ke repo GitHub-mu langsung dari WhatsApp (khusus owner) atau Termux (`bash deploy.sh`).

1. Pasang git sekali: `pkg install git`
2. Buat token: https://github.com/settings/tokens/new (centang **repo**), lalu isi di `settings.js`:
   `github: { token: 'ghp_xxxx' },` (user/repo bawaan: purokta/chisaai, ganti lewat `github: { user, repo }`)
3. Kirim `#deploy` atau `#deploy pesan commit`. Kalau bentrok dengan isi GitHub: `#deploy paksa` (menimpa GitHub dengan versi di HP).

Aman: `session/`, `data/`, dan `settings.js` (berisi token) otomatis tidak ikut ter-push (`.gitignore`), dan token tidak disimpan di `.git`.


## Bot Telegram (jalan bersamaan dengan WhatsApp)
Semua perintah yang sama juga jalan di Telegram, dan menunya memakai **tombol** yang bisa dipencet.

1. Di Telegram buka **@BotFather** → `/newbot` → salin **token**.
2. (Disarankan, supaya bot membaca semua pesan di grup) kirim ke BotFather: `/setprivacy` → pilih botmu → **Disable**.
3. Di `settings.js` tambahkan: `telegram: { token: '123456:ABC...' },`
4. `npm start`. Buka botmu di Telegram, tekan **Start**, lalu kirim `/myid`.
5. Isi ID itu sebagai owner: `telegram: { token: '...', ownerIds: ['123456789'] },` lalu restart. (VIP: `vipIds`.)

Catatan: di Telegram perintah ditulis dengan `/` (atau `.` `!` `?` `#` `$` seperti biasa). Mention/tag semua hanya mencakup admin (batasan Telegram), bot tidak bisa menambah anggota, dan stiker animasi (.tgs) tidak didukung. Mau hanya Telegram? `whatsapp: { enabled: false }`.

### Fitur khusus Telegram (v2.8.1)
Moderasi grup (bot harus admin): `/pin` `/unpin` (reply pesan), `/mute [10m|2j]` `/unmute`, `/bangrup` `/unbangrup`, `/warn [alasan]` (3x = dikeluarkan, ubah lewat `telegram.warnLimit`) `/resetwarn` `/warns`, `/setrules` `/rules` (aturan tampil juga di sambutan). Info: `/id`, `/userinfo` (reply/tag). Owner: `/broadcast <pesan>` ke semua pengguna yang pernah chat pribadi ke bot. Antilink grup juga memblokir link undangan `t.me/+...`. Perintah ini hanya muncul di menu Telegram.

### v2.9.0: login harian, gacha anime, pack stiker Chisa
- **`.daily`** (alias `.login`, `.absen`): login harian, hadiah koin + EXP yang naik tiap hari berturut-turut (streak). Tiap 7 hari: bonus 500 koin, 1 tiket gacha, 2 buah. Hanya bisa sekali per hari (WIB).
- **`.gacha`**: 1x gratis per hari (+ tiket dari streak). Karakter diambil dari daftar karakter anime terpopuler (Jikan/MyAnimeList) dengan rarity N / R / SR / SSR, hadiah koin + EXP lebih besar untuk rarity tinggi, bonus untuk karakter baru, dan pity (SSR dijamin tiap 50 pull, SR+ tiap 10). Pull tambahan: `.gacha beli` (200 koin, maks 5x per hari; atur di `rpg.gacha` di settings.js). **`.koleksi`** melihat karakter yang sudah didapat.
- Semua data (streak, koleksi, koin, EXP) tersimpan permanen di `data/db.json`, aman dari update/restart, dan ikut `#backup`. `restore.sh` menyimpan salinan database lama sebelum memulihkan.
- **Telegram:** stiker sekarang memakai format Telegram (WEBP polos / WEBM video, bukan webp WhatsApp) jadi bisa dibuka. Pack stiker Chisa: owner kirim `/buatpack` (8 stiker dari gambar karakter di `assets/thumbnail.jpg` + tulisan), `/tambahpack [emoji]` (reply foto/video/stiker), `/hapuspack` (reply stikernya), semua orang bisa `/pack` untuk linknya. Pemilik pack harus sudah pernah menekan Start di bot.

### v3.0.0 – 3.0.2: fitur gabungan Chisa, satu bot Chisa AI
Tidak ada lagi pilihan mode: semua fitur selalu aktif dan menyatu sebagai **Chisa AI**.
- Menambah ±270 plugin / ±1.800 perintah hasil adaptasi paket CHISA (RPG, praktis, harian & produktif, kreasi, tools, fun & game, grup, unduh, anime & baca, dunia & info, stiker brat, dll) di WhatsApp. Telegram tetap memakai menu Chisa.
- **Satu menu:** `.menu` menampilkan banner + satu daftar kategori (fitur Chisa dan tambahan digabung), satu baris per kategori dengan emoji. `.menu <kategori>` untuk isinya, `.menu semua` untuk semuanya, `.menu <perintah>` untuk detail, `.fitur <kata>` untuk mencari.
- **Prefix universal (WhatsApp):** semua tanda baca bisa jadi prefix (`. , ; : ! ? / # $ - + = ~ @ ^ * _ ( ) | •` dst). Kata yang bukan perintah dengan prefix di luar daftar standar dianggap obrolan biasa.
- Satu nama = satu perintah: kalau ada nama bentrok, perintah inti Chisa yang dipakai.
- Identitas tetap Chisa AI: thumbnail Chisa, watermark `@sipurse`, nama pack stiker, pairing code (nama perangkat harus `Ubuntu` supaya kode diterima WhatsApp), persona AI ramah.
- API key opsional untuk fitur AI tambahan: `settings.js` → `chisa: { apikey: { groq: '...' } }`. Fitur NSFW, panel/jualan server, dan generator dokumen palsu sengaja tidak disertakan.
- Modul tambahan (axios, chalk, cheerio, dll) terpasang lewat `npm install` / `update.sh`. Fitur gambar/kartu memakai `sharp` (opsional): `pkg install libvips binutils -y && npm i sharp --legacy-peer-deps`.
- Perbaikan: stiker brat (ffmpeg 7: `-vsync` diganti `-fps_mode`); `.brat <teks>` langsung jadi stiker.
- Data fitur tambahan tersimpan di `data/chisa/` (ikut `#backup`, aman dari update).
- Stiker brat (`.brat`, `.bratimg`, `.bratgreen`, `.bratwhite`, `.brathd`, `.bratvid`, `.bratwarna`) sekarang jalan **tanpa sharp** (cadangan memakai Jimp, tampilan lebih polos). Kalau sharp terpasang, tampilan penuh (bingkai & font serif) dipakai otomatis. Fitur gambar lain (efek, kartu, `.warna`, dll) tetap butuh sharp.
- Sharp di Termux (android-arm64): `npm install --cpu=wasm32 sharp` lalu `npm install @img/sharp-wasm32 --legacy-peer-deps`. Kalau build wasm tidak bisa merender teks, brat otomatis memakai Jimp.

### v3.1.0
- **Banner menu bergerak:** 4 video di `assets/banner1.mp4` … `banner4.mp4` (maks 10 detik, bawaan 8 detik, tampil seperti GIF), berganti setiap ada yang mengetik menu. Ganti dengan videomu di `assets/custom/banner1.mp4` … `banner4.mp4` (boleh 1–4 file, singkat, mis. 480p tanpa suara, maks 10 detik; aman dari update).
- **"Waiting for this message" hanya di HP kamu:** biasanya kunci enkripsi ke HP utama rusak. Kirim `#fixsesi` (owner): menghapus kunci lama (login aman) dan bot restart. Setelah itu kirim pesan lagi dari HP.
- **Video Facebook blur:** Facebook sekarang diunduh lewat yt-dlp lebih dulu (kualitas sampai 720p, suara digabung); hasil dari API yang resolusinya rendah (<480p) dibandingkan dengan sumber lain dan dipilih yang paling tajam. Pastikan yt-dlp & ffmpeg terpasang: `pkg install yt-dlp ffmpeg -y`.
- v3.1.1: log "Bad MAC / Closing session / Failed to decrypt" (dump panjang dari libsignal) disembunyikan sepenuhnya. Itu bukan error bot; kalau pesan di HP-mu masih "Waiting for this message", kirim `#fixsesi`.
- v3.1.2: **banner GIF tidak diunggah tiap menu** — pertama kali diunggah, lalu medianya dipakai ulang (cepat, tetap berputar terus). Kalau gagal otomatis diunggah ulang.
- v3.1.2: **proteksi dua bot sekaligus** (`.chisa.lock`): dua bot dengan login yang sama merusak kunci enkripsi dan memicu "Waiting for this message" di HP. Kalau muncul "Bot sudah berjalan di proses lain", jalankan `bash stop.sh` dulu.
- v3.1.2: dump "Closing session / Bad MAC" tidak lagi muncul di panel AKTIVITAS dashboard.
- v3.2.0: nomor versi tampil di Termux & menu WhatsApp; `.changelog` (alias `.versi`) melihat riwayat update (`.changelog semua`, `.changelog 3.1`). Riwayat disimpan di `CHANGELOG.md`.

### v3.3.0: menu Economy, 4 banner, menu Owner lengkap
- `.kurs`, `.saham`, `.beritaekonomi` (kategori Economy). Banner berganti tiap menu. Menu Owner memuat semua perintah tersembunyi. Semua nama lama fitur tambahan jadi "chisa"; perintah ganda & fitur yang tidak jalan dibuang. Detail: `.changelog`.

## APK (aplikasi Android, tanpa Termux)
1. Push repo ini ke GitHub (`#push`). **Token GitHub harus punya izin `workflow`** (centang `repo` dan `workflow` saat membuat token), kalau tidak folder `.github` ditolak.
2. Di GitHub: tab **Actions → Build APK → Run workflow** (±10–15 menit). Hasilnya: **Releases → "CHISA-AI APK" → chisa-ai.apk**.
3. Pasang APK (izinkan "install dari sumber tidak dikenal"), buka aplikasi, isi nomor WhatsApp bot, tekan **MULAI BOT**, lalu tautkan lewat kode pairing yang muncul (ketuk untuk menyalin).
4. Tekan "Izinkan jalan di latar belakang" agar bot tidak dimatikan sistem. Memperbarui: pasang APK baru di atas yang lama (login & data tetap).
- Bot jalan di Node.js 18 (nodejs-mobile) — fitur yang butuh ffmpeg (stiker video, voice note) bergantung pada ffmpeg yang ikut dibundel dan belum tentu jalan di semua HP.
