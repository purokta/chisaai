/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .brathd <teks> — Stiker brat resolusi tinggi
const { makePlugin } = require('../../lib/bratlib')
module.exports = makePlugin('brathd', { alias: ['brathds','brathdsticker'], title: 'BRAT HD', desc: 'Stiker brat resolusi tinggi' })
