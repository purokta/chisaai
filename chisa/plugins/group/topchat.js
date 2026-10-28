/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .topchat [jumlah]  peringkat anggota paling aktif di grup (dihitung dari pesan biasa sejak fitur ini aktif)
// .resettopchat      (admin) mulai hitung dari nol
const C = require('../../lib/chatcount'), ST = require('../../lib/style')
const MEDAL = ['𝐈', '𝐈𝐈', '𝐈𝐈𝐈']
module.exports = {
  name: 'topchat', alias: ['aktif', 'toppesan', 'resettopchat'], category: 'group', cmds: ['topchat', 'resettopchat'], noLimit: true,
  desc: 'Peringkat anggota paling aktif ngobrol di grup',
  group: true,
  // hook pesan biasa: dipanggil Chisa.js untuk setiap pesan non-perintah
  before: async ({ m, isGroup }) => { if (isGroup && m.sender) C.hit(m.chat, m.sender); return false },
  run: async ({ sock, m, reply, text, command, isAdmins, isCreator }) => {
    if (command === 'resettopchat') {
      if (!isAdmins && !isCreator) return reply(global.mess.admin)
      return reply(C.reset(m.chat) ? 'Peringkat aktif grup ini direset.' : 'Belum ada data di grup ini.')
    }
    const n = Math.min(20, Math.max(3, parseInt(text) || 10)), list = C.top(m.chat, n)
    if (!list.length) return reply('Belum ada data. Peringkat dihitung dari pesan biasa yang masuk setelah fitur ini aktif.')
    const rows = list.map((x, i) => `${MEDAL[i] || (i + 1) + '.'} @${x.jid.split('@')[0]}  :  ${x.n} pesan`)
    return sock.sendMessage(m.chat, { text: `${ST.B('ANGGOTA PALING AKTIF')}\n━━━━━━━━━━━━━━━━━━━━\n${rows.join('\n')}\n━━━━━━━━━━━━━━━━━━━━\nTotal ${C.total(m.chat)} pesan tercatat.`, mentions: list.map(x => x.jid) }, { quoted: m })
  },
}
