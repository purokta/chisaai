/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Ulang tahun anggota: .ultah set <tgl-bln> (mis. 17-08) • .ultah (daftar terdekat di grup) • .ultah hapus
const K = require('../../lib/praktis'), { tag } = require('../../lib/grouputil'), { B } = require('../../lib/style')
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const parse = (s) => { const m = String(s || '').match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.]\d{2,4})?$/); if (!m) return null; const d = +m[1], b = +m[2]; if (b < 1 || b > 12 || d < 1 || d > new Date(2024, b, 0).getDate()) return null; return { d, b } }
const days = (u, today) => { const t = new Date(Date.UTC(today.y, today.m - 1, today.d)); let n = new Date(Date.UTC(today.y, u.b - 1, u.d)); if (n < t) n = new Date(Date.UTC(today.y + 1, u.b - 1, u.d)); return Math.round((n - t) / 864e5) }

module.exports = {
  name: 'ultah', alias: ['ulangtahun', 'birthday', 'bday'], category: 'group', group: true, noLimit: true, cmds: ['ultah'],
  desc: 'Ulang tahun: .ultah set 17-08 • .ultah (daftar terdekat) • .ultah hapus',
  run: async ({ sock, m, args, prefix, reply, groupMetadata }) => {
    const sub = (args[0] || '').toLowerCase()
    if (sub === 'set') {
      const u = parse(args[1]); if (!u) return reply(`Format: ${prefix}ultah set <tanggal-bulan>\nContoh: ${prefix}ultah set 17-08`)
      K.set(m.sender, 'ultah', u); return reply(`✦ Ulang tahunmu disimpan: *${u.d} ${BLN[u.b - 1]}*`)
    }
    if (['hapus', 'del'].includes(sub)) { K.set(m.sender, 'ultah', null); return reply('Data ulang tahunmu dihapus.') }
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number), today = { y: p[0], m: p[1], d: p[2] }
    const rows = groupMetadata.participants.map(x => [x.id, K.get(x.id, 'ultah', null)]).filter(([, u]) => u).map(([j, u]) => ({ j, u, n: days(u, today) })).sort((a, b) => a.n - b.n)
    if (!rows.length) return reply(`Belum ada yang mengisi ulang tahun di grup ini.\nIsi punyamu: ${prefix}ultah set 17-08`)
    const top = rows.slice(0, 10)
    return sock.sendMessage(m.chat, { text: `${B('ULANG TAHUN TERDEKAT')}\n━━━━━━━━━━━━━━━━━━━━\n` + top.map(r => `${r.n === 0 ? '🎂' : '•'} ${tag(r.j)}  ${r.u.d} ${BLN[r.u.b - 1]}  ${r.n === 0 ? '*HARI INI! Selamat ulang tahun!*' : `(${r.n} hari lagi)`}`).join('\n') + `\n\n_Isi punyamu: ${prefix}ultah set <tgl-bln>_`, mentions: top.map(r => r.j) }, { quoted: m })
  },
}
