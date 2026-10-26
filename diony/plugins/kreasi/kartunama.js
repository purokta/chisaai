/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .kartunama <nama> | <jabatan> | <kontak1 / kontak2 / kontak3> — kartu nama 1050x600
const K2 = require('../../lib/kreasi2')

module.exports = {
  name: 'kartunama', alias: ['namecard', 'bizcard', 'kartubisnis'], category: 'kreasi', cmds: ['kartunama'],
  desc: 'Kartu nama bergaya modern: nama, jabatan, dan sampai 3 baris kontak',
  run: async ({ sock, m, text, prefix, reply }) => {
    const [n, j = '', k = ''] = String(text || '').split('|').map(s => s.trim())
    if (!n) return reply(`💼 *KARTU NAMA*\n\n> Format: ${prefix}kartunama <nama> | <jabatan> | <kontak 1 / kontak 2 / kontak 3>\n\n*Contoh:* ${prefix}kartunama Budi Santoso | Pengembang Bot | 0812-3456-7890 / budi@mail.com`)
    try {
      await sock.sendMessage(m.chat, { image: await K2.businessCard(n.slice(0, 40), j.slice(0, 50), k.slice(0, 160)), caption: `💼 Kartu nama *${n.slice(0, 40)}*` }, { quoted: m })
    } catch (e) { console.log('[kartunama]', e.message); reply('❌ Gagal membuat gambar: ' + e.message) }
  },
}
