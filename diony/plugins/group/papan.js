/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .papan  papan skor grup untuk malam game / lomba / arisan poin. Lihat: semua anggota. Ubah: admin
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const num = (j) => String(j).split('@')[0].split(':')[0]
function ranking(b) {
  const rows = Object.entries(b.skor).map(([k, v]) => ({ k, nama: v.nama, jid: v.jid, poin: v.poin })).sort((a, z) => z.poin - a.poin || a.nama.localeCompare(z.nama))
  let r = 0, prev = null; rows.forEach((x, i) => { if (x.poin !== prev) { r = i + 1; prev = x.poin } x.rank = r }); return rows
}
module.exports = {
  name: 'papan', alias: ['skorgrup', 'scoreboard', 'papanskor'], category: 'group', noLimit: true, group: true, cmds: ['papan'],
  desc: 'Papan skor grup untuk lomba / game malam: tambah, kurangi poin peserta, peringkat otomatis',
  ranking,
  run: async function (c) {
    const { m, sock, args, prefix, reply } = c, p = prefix + 'papan', sub = (args[0] || '').toLowerCase(), b = K.get(m.chat, 'papan', null), save = () => K.set(m.chat, 'papan', b)
    const admin = () => { if (!E.isAdmin(c)) { reply(global.mess?.admin || 'Khusus admin grup.'); return false } return true }
    const show = (extra) => {
      const rows = ranking(b), mentions = rows.filter(x => x.jid).map(x => x.jid), med = (r) => (['1.', '2.', '3.'][r - 1] || r + '.')
      const t = `✦ ${B('PAPAN SKOR')}\n*${b.nama}*\n\n` + (rows.length ? rows.map(x => `${med(x.rank)} ${x.jid ? '@' + num(x.jid) : x.nama} — *${x.poin}*`).join('\n') : '_belum ada peserta_') + (extra ? '\n\n' + extra : '')
      return sock.sendMessage(m.chat, { text: t, mentions }, { quoted: m })
    }
    if (['baru', 'buat', 'mulai'].includes(sub)) { if (!admin()) return; const nama = args.slice(1).join(' ').trim().slice(0, 60); if (!nama) return reply(`Format: ${p} baru <nama papan>`); K.set(m.chat, 'papan', { nama, skor: {} }); return reply(`Papan *${nama}* dibuat. Tambah poin: ${p} tambah @orang 10  atau  ${p} tambah Budi 10`) }
    if (!b) return reply(`✦ ${B('PAPAN SKOR')}\nBelum ada papan di grup ini.\nAdmin: ${p} baru <nama papan>`)
    if (['tambah', 'add', 'kurang', 'min'].includes(sub)) {
      if (!admin()) return
      const neg = ['kurang', 'min'].includes(sub), who = K.mentions(m)[0], words = args.slice(1).filter(w => !/^@\d+$/.test(w)), last = words[words.length - 1]
      const n = last !== undefined && /^-?\d+$/.test(last) ? parseInt(last, 10) : NaN, nama = words.slice(0, -1).join(' ').trim()
      if (!Number.isFinite(n) || (!who && !nama)) return reply(`Format: ${p} ${sub} <@orang|nama> <poin>\nContoh: ${p} ${sub} Budi 5`)
      if (Math.abs(n) > 100000) return reply('Poin terlalu besar.')
      const key = who ? num(who) : nama.toLowerCase(); if (!b.skor[key] && Object.keys(b.skor).length >= 60) return reply('Maksimal 60 peserta.')
      const e = b.skor[key] = b.skor[key] || { nama: nama || num(who), jid: who || null, poin: 0 }; e.poin += neg ? -Math.abs(n) : n; save(); return show()
    }
    if (['hapus', 'del', 'keluarkan'].includes(sub)) {
      if (!admin()) return; const who = K.mentions(m)[0], key = who ? num(who) : args.slice(1).join(' ').trim().toLowerCase()
      if (!b.skor[key]) return reply('Peserta tidak ditemukan.'); delete b.skor[key]; save(); return show()
    }
    if (sub === 'reset') { if (!admin()) return; for (const v of Object.values(b.skor)) v.poin = 0; save(); return show('Semua poin dikembalikan ke 0.') }
    if (sub === 'tutup') { if (!admin()) return; const r = ranking(b), win = r.filter(x => x.rank === 1 && r.length); await show(win.length ? `Juara: ${win.map(x => x.jid ? '@' + num(x.jid) : x.nama).join(', ')}` : ''); K.set(m.chat, 'papan', null); return }
    return show(`_${p} tambah|kurang <@orang|nama> <poin> • hapus • reset • tutup • baru_`)
  },
}
