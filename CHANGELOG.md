## 3.4.5 — 29 Okt 2026
- APK: berisi arm64 + armeabi-v7a (HP 32-bit juga bisa), ffmpeg bundel jadi opsi (mati secara default) karena bisa membuat APK gagal dipasang.

## 3.4.4 — 28 Okt 2026
- Workflow APK: ffmpeg bundel divalidasi (dibuang jika bukan ARM64), dan ada pengecekan tanda tangan/isi APK di log build.

## 3.4.3 — 28 Okt 2026
- Workflow APK: npm install memakai --ignore-scripts (skrip cek versi Node milik Baileys menggagalkan build). APK: tambahan crypto global untuk Node 18.

## 3.4.2 — 28 Okt 2026
- Workflow APK: npm install tidak lagi menggantung (git dialihkan ke https, tanpa pertanyaan interaktif, batas waktu 12 menit).

## 3.4.1 — 28 Okt 2026
- Workflow APK: memakai Android SDK bawaan server GitHub (langkah setup-android yang gagal dibuang).

## 3.4.0 — 28 Okt 2026
- Aplikasi Android (APK): bot + Node.js di dalam satu aplikasi. Isi nomor, tekan MULAI BOT, salin kode pairing. Dibuat otomatis oleh GitHub Actions (Actions > Build APK), hasilnya di Releases > "CHISA-AI APK". Lihat README bagian "APK".
- Bot membaca nomor pairing dari aplikasi (`CHISA_PAIR_NUMBER`), tanpa perlu mengetik di terminal.

## 3.3.2 — 28 Okt 2026
- Telegram: menu terhapus otomatis 5 menit setelah terakhir dipakai. Pesan teks lain (bukan menu, bukan media) yang tombolnya dipencet terhapus setelah diproses (mis. tombol Gacha/Koleksi). Media tidak pernah dihapus otomatis. Atur di `settings.js`: `telegram: { autoDelete: false }` untuk mematikan, `menuDeleteSec: 300` untuk lamanya.

## 3.3.1 — 28 Okt 2026
- Telegram: menu `/menu` memakai banner GIF (4 banner yang sama dengan WhatsApp) dan berganti setiap menu dibuka; tombol "Menu utama" juga mengganti banner. Banner diunggah sekali lalu dipakai ulang (cepat).

## 3.3.0 — 28 Okt 2026
- Menu baru **Economy**: `.kurs` (dolar → rupiah, bisa mata uang lain), `.saham` (IHSG, LQ45, indeks dunia, atau harga saham mis. `.saham bbca`), `.beritaekonomi` (berita ekonomi Indonesia yang lagi ramai diberitakan). Ada sumber cadangan kalau satu sumber gagal.
- Banner menu sekarang 4 video (maks 10 detik, bawaan 8 detik) dan berganti setiap ada yang mengetik menu. Ganti dengan milikmu: `assets/custom/banner1.mp4` … `banner4.mp4`.
- Menu **Owner** menampilkan semua perintah tersembunyi (update, restart, fixsesi, deploy, ping, myid, dll).
- Semua nama lama fitur tambahan diganti "chisa" (folder `chisa/`, `lib/chisaplug.js`, `data/chisa`, pengaturan `chisa: { apikey }`). Data lama dipindah otomatis.
- Dibersihkan: perintah ganda (satu nama = satu perintah) dan ±25 fitur yang tidak berfungsi di Termux (butuh modul sharp / error). Perintah `.dio`, `.chisaai`, dan `.menustyle` dihapus.
- Perbaikan: `global.owner` sekarang daftar nomor (memperbaiki `.cekinaktif` dan pengecualian owner di anti-spam grup).

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
- Penggabungan fitur paket Chisa (±270 plugin, ±1.800 perintah): RPG, praktis, kreasi, tools, game, grup, unduh, dll.
- Pairing tetap Chisa AI (nama perangkat Ubuntu agar kode diterima).

## 2.9.0
- Login harian (`.daily`), gacha anime (`.gacha`, `.koleksi`) dengan database permanen.
- Stiker Telegram bisa dibuka, pack stiker Chisa di Telegram.

## 2.8.x
- Bot Telegram berjalan bersamaan dengan WhatsApp, menu tombol, moderasi grup.

## 2.x
- Deploy ke GitHub (`#deploy`), log berwarna, banner KUCHIBA CHISA, inventory buah + EXP, limit & ban, backup login, AI baca gambar, update lewat Termux.
