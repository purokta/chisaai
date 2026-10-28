/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .teraboxdl — Unduh file dari TeraBox / Terabox share link
// Scraper: Mori v4.5.1 (lib/mori-scrapers.js — Sechno API).  Tampilan & pengiriman: Chisa (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'teraboxdl', alias: ['terabox', 'tbdl', 'dubox'],
  platform: 'terabox', label: 'TeraBox',
  example: 'https://www.terabox.com/s/xxxxxx',
  desc: 'Unduh file dari TeraBox share link (via scraper Mori)',
})
