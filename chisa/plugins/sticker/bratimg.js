/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .bratimg <teks> — Stiker brat versi biasa
const { makePlugin } = require('../../lib/bratlib')
module.exports = makePlugin('bratimg', { alias: ['brattext'], title: 'BRAT', desc: 'Stiker brat versi biasa' })
