FOLDER ASSETS - thumbnail & musik menu, bisa kamu ganti sendiri
================================================================
#menu memakai dua hal:

  thumbnail  = gambar di atas menu   (jpg / png / webp)
  music      = musik menu, dikirim sebagai VOICE NOTE otomatis setelah menu (mp3 / m4a / ogg / opus / wav; otomatis dikonversi, maks 3 menit)

CARA GANTI (paling gampang)
  Taruh filemu di folder  assets/custom/  dengan nama:
      thumbnail.jpg   (atau .png / .webp)
      music.mp3       (atau .m4a / .ogg / .opus / .wav)
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
