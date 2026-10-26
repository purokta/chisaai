/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .pinterestdl — Unduh gambar & video Pinterest
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Dionysus (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'pinterestdl', alias: ['pindl', 'pinterestvideo', 'pinterestimg'],
  platform: 'pinterest', label: 'Pinterest',
  example: 'https://pin.it/xxxxxxx',
  desc: 'Unduh gambar & video Pinterest',
})
