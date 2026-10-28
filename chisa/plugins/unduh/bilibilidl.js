/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .bilibilidl — Unduh video Bilibili
// Scraper: Mori (lib/mori-scrapers.js).  Tampilan & pengiriman: Chisa (lib/downloader.js).
module.exports = require('../../lib/morigrab').plugin({
  name: 'bilibilidl', alias: ['bilibili', 'b23dl'],
  platform: 'bilibili', label: 'Bilibili',
  example: 'https://www.bilibili.com/video/BVxxxxxxxx',
  desc: 'Unduh video Bilibili',
})
