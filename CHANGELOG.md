## 3.2.3 — 27 Okt 2026
- update.sh dibungkus fungsi: tidak error "syntax error near unexpected token" saat menimpa dirinya sendiri.

## 3.2.2 — 27 Okt 2026
- Penutup menu: "chisa-ai By Shipur • powered by claude • ©tahun".
- Update tidak lagi menurunkan versi tanpa sengaja (mis. repo GitHub masih versi lama); paksa dengan `bash update.sh <zip/link> paksa`.
- Banner GIF di README GitHub.

## 3.2.1 — 27 Okt 2026
- Telegram: menu "/" pribadi owner memuat `/push`, `/update`, `/restart`, `/stop`, dll. `#push` (alias `#deploy`) bisa dipakai dari WhatsApp maupun Telegram.

## 3.2.0 — 26 Okt 2026
- Nomor versi tampil di Termux (banner, dashboard, log) dan di menu WhatsApp.
- Perintah `.changelog` untuk melihat riwayat update.

## 3.1.2 — 26 Okt 2026
- Banner GIF diunggah sekali lalu dipakai ulang, menu lebih cepat.
- Proteksi dua bot sekaligus (penyebab "Waiting for this message" dan Bad MAC).
- Dump "Closing session / Bad MAC" tidak muncul lagi di dashboard.

## 3.1.1 — 26 Okt 2026
- Log Bad MAC / Closing session / Failed to decrypt disembunyikan.

## 3.1.0 — 26 Okt 2026
- Banner menu berupa video pendek (GIF) 5 detik.
- Perintah `#fixsesi` untuk memperbaiki "Waiting for this message".
- Video Facebook diunduh lewat yt-dlp lebih dulu supaya lebih tajam.

## 3.0.4 — 26 Okt 2026
- Stiker brat cadangan lewat Jimp bila sharp tidak bisa merender teks.

## 3.0.3 — 26 Okt 2026
- Stiker brat jalan tanpa sharp (cadangan Jimp).

## 3.0.2 — 26 Okt 2026
- Satu bot saja: Chisa AI (mode terpisah dihapus), semua fitur tambahan selalu aktif.
- Judul kategori menu tebal: `.menu download`, `.menu grup`, dst.

## 3.0.1 — 26 Okt 2026
- Menu gabungan satu daftar kategori dengan emoji dan banner baru.
- Prefix universal: semua tanda baca bisa dipakai.
- Perbaikan stiker brat (ffmpeg 7) dan `.brat <teks>`.

## 3.0.0 — 26 Okt 2026
- Penggabungan fitur paket Dionysus (±270 plugin, ±1.800 perintah): RPG, praktis, kreasi, tools, game, grup, unduh, dll.
- Pairing tetap Chisa AI (nama perangkat Ubuntu agar kode diterima).

## 2.9.0
- Login harian (`.daily`), gacha anime (`.gacha`, `.koleksi`) dengan database permanen.
- Stiker Telegram bisa dibuka, pack stiker Chisa di Telegram.

## 2.8.x
- Bot Telegram berjalan bersamaan dengan WhatsApp, menu tombol, moderasi grup.

## 2.x
- Deploy ke GitHub (`#deploy`), log berwarna, banner KUCHIBA CHISA, inventory buah + EXP, limit & ban, backup login, AI baca gambar, update lewat Termux.
