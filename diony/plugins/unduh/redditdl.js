/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .redditdl — Unduh video & media Reddit
// Scraper: Mori v4.5.1 (lib/mori-scrapers.js — RapidSave).  Tampilan & pengiriman: Dionysus (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'redditdl', alias: ['reddit', 'rddt'],
  platform: 'reddit', label: 'Reddit',
  example: 'https://www.reddit.com/r/example/comments/xxxx/title/',
  desc: 'Unduh video & media Reddit (via scraper Mori)',
})
