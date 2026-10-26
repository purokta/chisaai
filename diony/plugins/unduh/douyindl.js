/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .douyindl — Unduh video & foto Douyin
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Dionysus (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'douyindl', alias: ['douyin'],
  platform: 'douyin', label: 'Douyin',
  example: 'https://v.douyin.com/xxxxxxx/',
  desc: 'Unduh video & foto Douyin',
})
