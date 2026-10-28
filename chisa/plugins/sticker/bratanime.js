/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .bratanime <teks> — Stiker brat gaya anime
const { makePlugin } = require('../../lib/bratlib')
module.exports = makePlugin('bratanime', { alias: ['animebrat'], title: 'BRAT ANIME', desc: 'Stiker brat gaya anime' })
