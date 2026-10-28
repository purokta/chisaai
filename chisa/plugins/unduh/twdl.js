/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .twdl — Unduh video & gambar dari X / Twitter
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Chisa (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'twdl', alias: ['xdl', 'twitterdl', 'xdown', 'twitter', 'twvideo'],
  platform: 'twitter', label: 'X / Twitter',
  example: 'https://x.com/user/status/xxxxxxxx',
  desc: 'Unduh video & gambar dari X / Twitter',
})
