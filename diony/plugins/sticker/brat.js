/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .brat [teks] — menu varian brat (tombol pilih). Pilih varian → stiker dibuat dari teks yang sama.
// Perintah langsung: .bratimg .bratgreen .bratwhite .brathd .bratvid .bratvid2 .bratanime .bratcewek
//                    .bratbahlil .bratpatrick .bratsquidward .bratgojo .bratvermeil .bratgojovid .bratvermeilvid
const { VARIANTS } = require('../../lib/bratlib')

module.exports = {
  name: 'brat', alias: ['bratmenu'], category: 'sticker',
  desc: 'Menu varian stiker brat',
  // Tombol interaktif WhatsApp sering tidak bisa dipencet di akun biasa, jadi:
  //   .brat <teks>  -> langsung jadi stiker (varian bratimg)
  //   .brat         -> daftar varian (ketik perintahnya)
  run: async (ctx) => {
    const { m, text, prefix, reply } = ctx
    const t = (text || (m.quoted && m.quoted.text) || '').trim()
    if (t) {
      const plug = require('./bratimg')
      return plug.run({ ...ctx, command: 'bratimg', text: t, q: t, args: t.split(/\s+/) })
    }
    return reply('🌿 *BRAT*\nKetik teksnya: ' + prefix + 'brat Hai semua\n\n' + VARIANTS.map(([title, d, cmd]) => `• *${prefix}${cmd}* <teks> — ${title}`).join('\n'))
  },
}
