/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .spotifydl — Unduh lagu Spotify sebagai MP3
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Dionysus (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'spotifydl', alias: ['spotifymp3', 'spotidl'],
  platform: 'spotify', label: 'Spotify',
  example: 'https://open.spotify.com/track/xxxxxxxx',
  desc: 'Unduh lagu Spotify sebagai MP3',
})
