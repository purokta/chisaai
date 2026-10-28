/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .igdl — Unduh Reels, video, foto, dan carousel Instagram
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Chisa (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'igdl', alias: ['instagramdl', 'reels', 'igreels', 'igvideo', 'igfoto'],
  platform: 'instagram', label: 'Instagram',
  example: 'https://www.instagram.com/reel/xxxxxxxx/',
  desc: 'Unduh Reels, video, foto, dan carousel Instagram',
})
