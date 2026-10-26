/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .fbdl — Unduh video Facebook (kualitas terbaik)
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Dionysus (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'fbdl', alias: ['facebookdl', 'facebook', 'fbdown', 'fbvideo'],
  platform: 'facebook', label: 'Facebook',
  example: 'https://www.facebook.com/watch/?v=xxxxxxxx',
  desc: 'Unduh video Facebook (kualitas terbaik)',
})
