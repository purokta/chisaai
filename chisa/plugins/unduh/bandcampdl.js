/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .bandcampdl — Unduh lagu / album Bandcamp
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Chisa (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'bandcampdl', alias: ['bcdl', 'bandcamp'],
  platform: 'bandcamp', label: 'Bandcamp',
  example: 'https://artist.bandcamp.com/track/xxxxxxxx',
  desc: 'Unduh lagu / album Bandcamp',
})
