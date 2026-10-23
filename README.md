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

**Update lewat WhatsApp (`#update`)**: taruh bot di repo GitHub milikmu, isi `update.url` di `settings.js` dengan link `https://github.com/USERNAME/REPO/archive/refs/heads/main.zip`, restart. Setelah itu kirim `#update` dan bot mengunduh, memasang, dan restart sendiri.

## Pengaturan

Semua pengaturanmu ada di **`settings.js`** (dibuat otomatis dari `settings.example.js`): owner, VIP, nama stiker, API key, link update. File ini aman dari update. `defaults.js` jangan diedit.

## Prefix

`.  !  ?  /  #  $`, contoh `.menu`, `#menu`, `!menu`. Kata `menu` dan `owner` juga boleh diketik tanpa prefix.

## Fitur

| Perintah | Fungsi |
|---|---|
| `#menu` | Banner + daftar berkelompok + voice note musik. `menu grup` = satu kategori, `menu semua`. Gaya: `#menustyle teks/poll/tombol` |
| `#status` | Status bot & server |
| `#s` | Gambar/video → stiker (kirim dengan caption `#s`, atau reply) |
| `#toimg` | Stiker → gambar |
| `#stext` / `#stextanim` | Teks → stiker / stiker teks animasi hitam-putih |
| `#take pack\|author` | Ganti nama pack stiker (reply stikernya) |
| `#dl link` | TikTok, Instagram, YouTube, Facebook, dan link lain (X, Pinterest, dll. lewat yt-dlp) |
| `#ytmp3 link` | Audio dari link |
| `#play judul` / `#ytsearch` / `#lirik` | Musik: cari & kirim MP3, cari video, lirik |
| `#ai` / `#img` / `#hd` / `#search` | Tanya AI, gambar AI, enhancer, cari info |
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
- `#autoreply on/off`, `#reload`, `#restart`, `#update`.

Owner = nomor di `settings.js` dan pesan yang diketik langsung dari nomor bot sendiri. Auto-reply di grup hanya jika bot di-tag, di-reply, atau diawali kata "chisa".

## Gaya menu

Bawaan: kartu teks berkelompok (banner + daftar per kategori), lalu voice note musik otomatis. `#menustyle poll` / `tombol` adalah percobaan (sering tidak bisa dipencet di bot WhatsApp biasa); kembali dengan `#menustyle teks`.

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

- **"Waiting for this message" di WhatsApp**: pastikan bot hanya jalan **satu** (tutup tmux/Termux lain), lalu `npm start` ulang (v2.2 sudah menyimpan pesan untuk dikirim ulang). Kalau masih, hapus folder `session` dan pairing ulang.
- **`#play` / link lain gagal**: `pkg install python` lalu `pip install -U yt-dlp`.

- **Owner/VIP tidak dikenali di grup**: ketik `#myid`, lalu tempel angka LID-nya di `settings.js` → `ownerLids`.
- **Logout / error sesi**: hapus folder `session`, jalankan ulang.
- **Error versi Baileys**: `npm i @whiskeysockets/baileys@latest --legacy-peer-deps`.
- **"Program ffmpeg belum terpasang"**: `pkg install ffmpeg`.
