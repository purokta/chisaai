FOLDER ASSETS - thumbnail & musik menu, bisa kamu ganti sendiri
================================================================
#menu memakai dua hal:

  banner1 = banner utama bawaan; banner2-4 kosong (isi sendiri, mis. #setbanner 2 <link YouTube>); berganti tiap ada yang mengetik menu
  thumbnail  = gambar di atas menu   (jpg / png / webp)
  music      = musik menu, dikirim sebagai VOICE NOTE otomatis setelah menu (mp3 / m4a / ogg / opus / wav; otomatis dikonversi, maks 3 menit)

CARA GANTI (paling gampang)
  Taruh filemu di folder  assets/custom/  dengan nama:
      thumbnail.jpg   (atau .png / .webp)
      music.mp3       (atau .m4a / .ogg / .opus / .wav)
      banner1.mp4 ... banner4.mp4   (video, tanpa suara, maks 10 detik; boleh 1-4 file)
      banner1.jpg ... banner4.jpg   (gambar, boleh .png/.webp; menggantikan video di slot yang sama)
  Di aplikasi Android: tab Banner > Ganti (GIF otomatis diubah jadi MP4).
  Folder custom/ TIDAK ditimpa saat update, dan langsung berlaku tanpa restart.

  Contoh di Termux:
      cp ~/storage/downloads/fotoku.jpg ~/chisa-ai/assets/custom/thumbnail.jpg
      cp ~/storage/downloads/laguku.mp3 ~/chisa-ai/assets/custom/music.mp3

  Atau ganti langsung di dalam zip sebelum di-unzip: timpa assets/thumbnail.jpg
  dan assets/music.mp3 (file bawaan; ini bisa tertimpa saat update berikutnya).

URUTAN: assets/custom/ dulu, kalau kosong baru assets/ bawaan.

MATIKAN
  Hapus file-nya, atau di settings.js:
      menu: { thumbnail: false, music: false }

SARAN: gambar 16:9 (mis. 1024x576); musik maks ~2 menit supaya cepat terkirim.
