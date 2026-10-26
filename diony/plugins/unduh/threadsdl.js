/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .threadsdl — Unduh video & foto Threads
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Dionysus (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'threadsdl', alias: ['threads', 'threadsvideo'],
  platform: 'threads', label: 'Threads',
  example: 'https://www.threads.net/@user/post/xxxxxxxx',
  desc: 'Unduh video & foto Threads',
})
