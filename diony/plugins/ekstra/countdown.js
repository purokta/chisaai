/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .countdown — hitung mundur ke acara penting (ujian, liburan, deadline). Tersimpan per chat/pengguna.
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const diff = (k) => Math.round((new Date(k + 'T00:00:00Z') - new Date(K.dayKey() + 'T00:00:00Z')) / 864e5)
const label = (n) => n === 0 ? '*HARI INI!*' : n > 0 ? `*${n}* hari lagi${n >= 7 ? ` (±${Math.floor(n / 7)} minggu${n % 7 ? ' ' + (n % 7) + ' hari' : ''})` : ''}` : `sudah lewat ${-n} hari`
module.exports = {
  name: 'countdown', alias: ['hitungmundur', 'acara', 'event'], category: 'ekstra', noLimit: true, cmds: ['countdown'],
  desc: 'Hitung mundur acara: .countdown tambah <tanggal> <nama> • hapus <no> • (kosong = daftar)',
  run: async ({ m, args, prefix, reply }) => {
    const list = K.get(m.sender, 'countdown', []), sub = (args[0] || 'list').toLowerCase(), p = prefix + 'countdown', save = () => K.set(m.sender, 'countdown', list)
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const tgl = K.parseTanggal(args[1]), nama = args.slice(2).join(' ').trim().slice(0, 60)
      if (!tgl || !nama) return reply(`Format: ${p} tambah <tanggal> <nama acara>\nTanggal: 2026-12-31, 31/12/2026, atau besok\nContoh: ${p} tambah 2026-12-31 Tahun Baru`)
      if (list.length >= 20) return reply('✕ Maksimal 20 acara. Hapus dulu dengan ' + p + ' hapus <no>')
      list.push({ n: nama, d: tgl }); list.sort((a, b) => a.d.localeCompare(b.d)); save()
      return reply(`✦ Tersimpan: *${nama}*\n${K.fmtTanggal(tgl)}\n${label(diff(tgl))}`)
    }
    if (['hapus', 'del', 'delete'].includes(sub)) {
      const no = parseInt(args[1], 10); if (!(no >= 1 && no <= list.length)) return reply('✕ Nomor tidak valid. Lihat daftar: ' + p)
      const [r] = list.splice(no - 1, 1); save(); return reply(`Dihapus: *${r.n}*`)
    }
    if (!list.length) return reply(`${B('COUNTDOWN')}\nBelum ada acara.\nTambah: ${p} tambah <tanggal> <nama>`)
    const up = list.filter(x => diff(x.d) >= 0), past = list.filter(x => diff(x.d) < 0)
    let t = `✦ ${B('COUNTDOWN')}\n━━━━━━━━━━━━━━━━━━━━\n`
    t += up.map((x, i) => `${list.indexOf(x) + 1}. ${x.n}\n    ${K.fmtTanggal(x.d)} — ${label(diff(x.d))}`).join('\n')
    if (past.length) t += `\n\n${B('Sudah lewat')}\n` + past.map(x => `${list.indexOf(x) + 1}. ${x.n} — ${label(diff(x.d))}`).join('\n')
    return reply(t + `\n\n_${p} tambah • hapus <no>_`)
  },
}
