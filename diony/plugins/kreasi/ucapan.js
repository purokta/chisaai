/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .ucapan <jenis> [nama] [| pesan] — kartu ucapan bertema 1080x1350 (ultah, lebaran, natal, tahunbaru, nikah, wisuda, semangat, terimakasih, jumat, sembuh)
const K2 = require('../../lib/kreasi2')

module.exports = {
  name: 'ucapan', alias: ['kartuucapan', 'greeting', 'selamat'], category: 'kreasi', cmds: ['ucapan'],
  desc: 'Kartu ucapan bertema: ultah, lebaran, natal, tahunbaru, nikah, wisuda, semangat, terimakasih, jumat, sembuh',
  run: async ({ sock, m, text, args, prefix, reply }) => {
    const first = String(args[0] || '').toLowerCase().replace(/[^a-z]/g, ''), kind = K2.UCAPAN[first] ? first : K2.UCAPAN_ALIAS[first]
    if (!kind) return reply(`🎉 *KARTU UCAPAN*\n\n> Format: ${prefix}ucapan <jenis> <nama> | <pesan sendiri>\n> Jenis: ${Object.keys(K2.UCAPAN).join(', ')}\n> Pesan setelah tanda | boleh dikosongkan (ada pesan bawaan).\n\n*Contoh:*\n> ${prefix}ucapan ultah Budi Santoso\n> ${prefix}ucapan lebaran Keluarga Besar | Mohon maaf lahir dan batin`)
    const rest = text.slice(text.toLowerCase().indexOf(args[0].toLowerCase()) + args[0].length).trim(), [n, ...p] = rest.split('|')
    const nama = n.trim().slice(0, 40), pesan = p.join('|').trim().slice(0, 160)
    try {
      await sock.sendMessage(m.chat, { image: await K2.greetingCard(kind, nama, pesan || null), caption: `🎉 ${K2.UCAPAN[kind].judul}${nama ? ' — ' + nama : ''}` }, { quoted: m })
    } catch (e) { console.log('[ucapan]', e.message); reply('❌ Gagal membuat gambar: ' + e.message) }
  },
}
