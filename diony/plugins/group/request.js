/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Permintaan bergabung grup (grup dengan persetujuan admin). Admin grup; bot harus admin.
//   .listreq              lihat daftar yang meminta bergabung
//   .terimareq [all|N]    terima semua / N orang pertama (tanpa angka = semua)
//   .tolakreq [all|N]     tolak semua / N orang pertama
const ST = require('../../lib/style')
module.exports = {
  name: 'listreq', alias: ['terimareq', 'tolakreq', 'acceptreq', 'rejectreq', 'terimasemua', 'tolaksemua'], category: 'group', cmds: ['listreq', 'terimareq', 'tolakreq'],
  desc: 'Lihat, terima, atau tolak permintaan bergabung grup', group: true, admin: true, botAdmin: true,
  run: async ({ sock, m, reply, args, command }) => {
    let list
    try { list = await sock.groupRequestParticipantsList(m.chat) } catch (e) { return reply('Gagal mengambil daftar: ' + e.message) }
    if (!list || !list.length) return reply('Tidak ada permintaan bergabung yang menunggu.')
    if (command === 'listreq') {
      const rows = list.slice(0, 40).map((r, i) => `${i + 1}. @${String(r.jid || r.phone_number || r.id).split('@')[0]}`)
      return sock.sendMessage(m.chat, { text: `${ST.B('PERMINTAAN BERGABUNG')} (${list.length})\n━━━━━━━━━━━━━━━━━━━━\n${rows.join('\n')}${list.length > 40 ? '\n... dan ' + (list.length - 40) + ' lainnya' : ''}`, mentions: list.slice(0, 40).map(r => r.jid || r.phone_number || r.id) }, { quoted: m })
    }
    const act = ['tolakreq', 'rejectreq', 'tolaksemua'].includes(command) ? 'reject' : 'approve'
    const a = String(args[0] || 'all').toLowerCase(), n = a === 'all' ? list.length : Math.min(list.length, Math.max(1, parseInt(a) || list.length))
    const jids = list.slice(0, n).map(r => r.jid || r.phone_number || r.id)
    try {
      const res = await sock.groupRequestParticipantsUpdate(m.chat, jids, act)
      const ok = Array.isArray(res) ? res.filter(r => !r.error || String(r.status) === '200').length : jids.length
      return reply(`${act === 'approve' ? 'Diterima' : 'Ditolak'}: ${ok} dari ${jids.length} permintaan.`)
    } catch (e) { return reply('Gagal memproses permintaan: ' + e.message) }
  },
}
