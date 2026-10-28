/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .swm / .wm <packname>|<author> — ganti packname & author pada stiker (reply stiker)
const L = require('../../lib/stickerlib')

module.exports = {
  name: 'swm', alias: ['stickerwm', 'stickermark', 'colong'], category: 'sticker',
  desc: 'Ganti packname & author stiker',
  run: async ({ sock, m, text, prefix, reply }) => {
    const media = L.pickMedia({ ...m, msg: null })   // hanya dari pesan yang di-reply
    if (!m.quoted || !media || media.kind !== 'sticker') {
      return reply(`🖼️ *WATERMARK STIKER*\n\n> Reply sebuah stiker dengan:\n> ${prefix}wm packname\n> ${prefix}wm packname|author\n\n*Contoh:*\n> ${prefix}wm Chisa AI\n> ${prefix}wm Chisa AI|PIX`)
    }
    const input = (text || '').trim()
    if (!input) return reply(`❌ Masukkan packname.\n\n*Contoh:* ${prefix}wm Chisa AI|PIX`)
    const [packname, author = ''] = input.split('|').map(s => s.trim())
    L.react(sock, m, '🕕')
    try {
      const buf = await L.download(media)
      if (!buf || !buf.length) { L.react(sock, m, '❌'); return reply('❌ Gagal mengunduh stiker.') }
      await L.sendWebp(sock, m, buf, { packname, author })
      L.react(sock, m, '✅')
    } catch (e) {
      console.log('[swm]', e.message); L.react(sock, m, '❌'); reply(`❌ Gagal mengganti watermark.\n_${e.message}_`)
    }
  },
}
