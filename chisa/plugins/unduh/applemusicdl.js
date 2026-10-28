/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .applemusicdl — Unduh lagu Apple Music
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Chisa (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'applemusicdl', alias: ['amdl', 'applemusic', 'applemp3'],
  platform: 'applemusic', label: 'Apple Music',
  example: 'https://music.apple.com/id/album/xxxxxxxx',
  desc: 'Unduh lagu Apple Music',
})
