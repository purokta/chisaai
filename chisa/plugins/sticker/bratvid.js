/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .bratvid <teks> — Stiker brat bergerak
const { makePlugin } = require('../../lib/bratlib')
module.exports = makePlugin('bratvid', { alias: ['bratgif', 'bratvideo'], title: 'BRAT VIDEO', desc: 'Stiker brat bergerak' })
