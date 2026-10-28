/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .piket — jadwal piket/ronda mingguan per grup. Anggota: .piket (hari ini) • .piket semua. Admin: set/hapus/acak
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const DAYS = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'], NAMA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const dayIdx = (s) => { s = String(s || '').toLowerCase().replace("'", ''); if (s === 'jum’at') s = 'jumat'; return DAYS.indexOf(s) }
const todayIdx = () => new Date(K.dayKey() + 'T00:00:00Z').getUTCDay()
module.exports = {
  name: 'piket', alias: ['jadwalpiket', 'ronda'], category: 'group', noLimit: true, group: true, cmds: ['piket'],
  desc: 'Jadwal piket mingguan grup: lihat hari ini, set per hari, atau acak otomatis (admin)',
  run: async function (c) {
    const { m, args, prefix, reply } = c, p = prefix + 'piket', sub = (args[0] || '').toLowerCase(), j = K.get(m.chat, 'piket', {})
    const row = (i) => `${i === todayIdx() ? '◆' : '◇'} *${NAMA[i]}* : ${j[DAYS[i]] && j[DAYS[i]].length ? j[DAYS[i]].join(', ') : '—'}`
    const admin = () => { if (!E.isAdmin(c)) { reply(global.mess?.admin || 'Khusus admin grup.'); return false } return true }
    if (sub === 'semua' || sub === 'minggu') return reply(`✦ ${B('JADWAL PIKET')}\n\n` + [1, 2, 3, 4, 5, 6, 0].map(row).join('\n'))
    if (sub === 'set') {
      if (!admin()) return; const d = dayIdx(args[1]), names = args.slice(2).join(' ').split(/[,&]+/).map(s => s.trim()).filter(Boolean)
      if (d < 0 || !names.length) return reply(`✕ Format: ${p} set <hari> <nama, nama>\nContoh: ${p} set senin Ani, Budi`)
      j[DAYS[d]] = names.slice(0, 15); K.set(m.chat, 'piket', j); return reply(`✦ Piket *${NAMA[d]}*: ${j[DAYS[d]].join(', ')}`)
    }
    if (sub === 'hapus') { if (!admin()) return; if (args[1] === 'semua') { K.set(m.chat, 'piket', {}); return reply('Semua jadwal piket dihapus.') } const d = dayIdx(args[1]); if (d < 0) return reply(`✕ Contoh: ${p} hapus senin  atau  ${p} hapus semua`); delete j[DAYS[d]]; K.set(m.chat, 'piket', j); return reply(`Piket ${NAMA[d]} dikosongkan.`) }
    if (sub === 'acak') {
      if (!admin()) return; const names = args.slice(1).join(' ').split(/[,&]+/).map(s => s.trim()).filter(Boolean)
      if (names.length < 2) return reply(`✕ Format: ${p} acak <nama, nama, ...> (minimal 2)\n_Dibagi rata ke Senin–Sabtu secara acak._`)
      if (names.length > 60) return reply('✕ Maksimal 60 nama.')
      const out = {}; E.shuffle(names.slice()).forEach((n, i) => { const d = DAYS[1 + (i % 6)]; (out[d] = out[d] || []).push(n) }); K.set(m.chat, 'piket', out)
      return reply(`✦ ${B('JADWAL PIKET BARU')}\n\n` + [1, 2, 3, 4, 5, 6].map(i => `◆ *${NAMA[i]}* : ${(out[DAYS[i]] || ['—']).join(', ')}`).join('\n'))
    }
    if (!Object.keys(j).length) return reply(`✦ ${B('PIKET')}\nBelum ada jadwal.\nAdmin: ${p} set <hari> <nama, nama> • ${p} acak <nama, nama, ...>`)
    const t = todayIdx(); return reply(`✦ ${B('PIKET HARI INI')} — ${NAMA[t]}\n${j[DAYS[t]] && j[DAYS[t]].length ? j[DAYS[t]].map(n => '◆ ' + n).join('\n') : '_Tidak ada jadwal piket hari ini._'}\n\n_${p} semua untuk jadwal seminggu_`)
  },
}
