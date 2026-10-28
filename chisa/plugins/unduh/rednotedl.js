/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .rednotedl — Unduh video & foto RedNote / Xiaohongshu
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Chisa (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'rednotedl', alias: ['xhsdl', 'rednote', 'xiaohongshu'],
  platform: 'rednote', label: 'RedNote',
  example: 'https://xhslink.com/xxxxxxx',
  desc: 'Unduh video & foto RedNote / Xiaohongshu',
})
