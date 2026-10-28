/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .absen — daftar hadir grup. Admin: .absen mulai <judul> • .absen tutup • .absen reset. Anggota: .hadir [ket] • .izin <alasan> • .sakit [ket]
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const LBL = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit' }
function view(s) {
  const by = (k) => Object.values(s.rec).filter(r => r.s === k)
  let t = `✦ ${B('ABSEN')} — ${s.title}\n${s.open ? '◆ Dibuka' : '◇ Ditutup'} • ${Object.keys(s.rec).length} tercatat\n`
  for (const k of ['hadir', 'izin', 'sakit']) { const a = by(k); if (a.length) t += `\n${B(LBL[k])} (${a.length})\n` + a.map((r, i) => `${i + 1}. ${r.n} _${r.at}_${r.note ? ` — ${r.note}` : ''}`).join('\n') + '\n' }
  return t
}
module.exports = {
  name: 'hadir', alias: ['hadir', 'izin', 'sakit'], category: 'ekstra', noLimit: true, group: true, cmds: ['hadir', 'izin', 'sakit'],
  desc: 'Absen grup: admin .absen mulai <judul> / tutup; anggota .hadir • .izin <alasan> • .sakit',
  run: async function (c) {
    const { m, args, command, prefix, reply, pushname } = c, s = K.get(m.chat, 'absen', null), sub = (args[0] || '').toLowerCase(), p = prefix + 'absen'
    if (['hadir', 'izin', 'sakit'].includes(command)) {
      if (!s || !s.open) return reply(`Tidak ada absen yang dibuka. Admin bisa memulai dengan ${p} mulai <judul>`)
      const note = args.join(' ').slice(0, 80); if (command === 'izin' && !note) return reply(`✕ Tulis alasannya.\nContoh: ${prefix}izin ada acara keluarga`)
      const had = s.rec[m.sender]; s.rec[m.sender] = { n: pushname, s: command, note, at: E.timeWIB() }; K.set(m.chat, 'absen', s)
      return reply(`✦ *${pushname}* tercatat *${LBL[command]}*${had ? ' (diperbarui)' : ''}${note ? ` — ${note}` : ''}\n_Total ${Object.keys(s.rec).length} orang_`)
    }
    if (sub === 'mulai' || sub === 'buka') {
      if (!E.isAdmin(c)) return reply(global.mess?.admin || 'Khusus admin grup.')
      if (s && s.open) return reply(`Absen *${s.title}* masih dibuka. Tutup dulu: ${p} tutup`)
      const title = args.slice(1).join(' ').trim().slice(0, 60) || `Absen ${K.fmtTanggal(K.dayKey())}`
      K.set(m.chat, 'absen', { title, open: true, by: m.sender, rec: {}, start: Date.now() })
      return reply(`✦ ${B('ABSEN DIBUKA')}\n*${title}*\n\nKetik *${prefix}hadir*, *${prefix}izin <alasan>*, atau *${prefix}sakit*`)
    }
    if (sub === 'tutup' || sub === 'selesai') {
      if (!E.isAdmin(c)) return reply(global.mess?.admin || 'Khusus admin grup.'); if (!s || !s.open) return reply('Tidak ada absen yang dibuka.')
      s.open = false; K.set(m.chat, 'absen', s); return reply(view(s) + '\n_Absen ditutup._')
    }
    if (sub === 'reset' || sub === 'hapus') { if (!E.isAdmin(c)) return reply(global.mess?.admin || 'Khusus admin grup.'); K.set(m.chat, 'absen', null); return reply('Data absen dihapus.') }
    if (!s) return reply(`${B('ABSEN GRUP')}\nBelum ada sesi.\n┣ Admin: ${p} mulai <judul> • tutup • reset\n┗ Anggota: ${prefix}hadir • ${prefix}izin <alasan> • ${prefix}sakit`)
    return reply(view(s))
  },
}
