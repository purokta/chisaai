/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .pixivdl — Unduh ilustrasi Pixiv (semua halaman)
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Dionysus (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'pixivdl', alias: ['pixiv'],
  platform: 'pixiv', label: 'Pixiv',
  example: 'https://www.pixiv.net/artworks/12345678',
  desc: 'Unduh ilustrasi Pixiv (semua halaman)',
})
