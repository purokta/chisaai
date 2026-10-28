/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .vnote — ubah video / GIF yang di-reply menjadi VIDEO BULAT (video note WhatsApp).
const L = require('../../lib/stickerlib')
const RV = require('../../lib/roundvid')

module.exports = {
  name: 'vnote', alias: ['videonote', 'jadibulat', 'circlevid'], category: 'sticker',
  desc: 'Ubah video yang di-reply jadi video bulat (video note)',
  run: async ({ sock, m, reply, prefix }) => {
    const media = L.pickMedia(m)
    if (!media || media.kind !== 'video') return reply(`⭕ *VIDEO BULAT*\n\nReply sebuah video / GIF dengan:\n> ${prefix}vnote\n\n_Video dipotong persegi dari tengah, maks 60 detik._`)
    L.react(sock, m, '🕕')
    try {
      const buf = await L.download(media)
      if (!buf || !buf.length) { L.react(sock, m, '❌'); return reply('❌ Gagal mengunduh video.') }
      await RV.send(sock, m, await RV.crop(buf))
      L.react(sock, m, '✅')
    } catch (e) { console.log('[vnote]', e.message); L.react(sock, m, '❌'); reply('❌ Gagal membuat video bulat.\n_' + e.message + '_') }
  },
}
