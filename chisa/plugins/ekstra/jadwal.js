/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .jadwal — jadwal mingguan pribadi (kuliah/kerja/les). .jadwal tambah <hari> <jam> <kegiatan> • hariini • besok • hapus <no>
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const HARI = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
const ALT = { ahad: 0, sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, jum: 5, jumat: 5, "jum'at": 5 }
const hari = (s) => { s = String(s || '').toLowerCase(); const i = HARI.indexOf(s); return i >= 0 ? i : ALT[s] !== undefined ? ALT[s] : -1 }
const cap = (s) => s[0].toUpperCase() + s.slice(1)
const hhmm = (s) => { const m = String(s || '').match(/^(\d{1,2})[:.](\d{2})$/); if (!m || +m[1] > 23 || +m[2] > 59) return null; return String(+m[1]).padStart(2, '0') + ':' + m[2] }
const dow = (k) => new Date(k + 'T00:00:00Z').getUTCDay()
const show = (list, d, title) => { const r = list.filter(x => x.h === d).sort((a, b) => a.t.localeCompare(b.t)); return `${title}\n` + (r.length ? r.map(x => `◇ ${x.t} — ${x.k}`).join('\n') : '_Kosong._') }
module.exports = {
  name: 'jadwal', alias: ['schedule', 'jadwalku', 'jadwalmingguan'], category: 'ekstra', noLimit: true, cmds: ['jadwal'],
  desc: 'Jadwal mingguan: .jadwal tambah <hari> <jam> <kegiatan> • hariini • besok • hapus <no> • (kosong = semua)',
  run: async ({ m, args, prefix, reply }) => {
    const list = K.get(m.sender, 'jadwal', []), sub = (args[0] || 'semua').toLowerCase(), p = prefix + 'jadwal', save = () => K.set(m.sender, 'jadwal', list), today = dow(K.dayKey())
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const h = hari(args[1]), t = hhmm(args[2]), k = args.slice(3).join(' ').trim().slice(0, 60)
      if (h < 0 || !t || !k) return reply(`Format: ${p} tambah <hari> <jam> <kegiatan>\nHari: senin..minggu\nContoh: ${p} tambah senin 08:00 Kuliah Kalkulus`)
      if (list.length >= 60) return reply('✕ Maksimal 60 kegiatan.')
      list.push({ h, t, k }); save(); return reply(`✦ Ditambahkan: *${cap(HARI[h])} ${t}* — ${k}`)
    }
    if (['hapus', 'del'].includes(sub)) {
      const no = parseInt(args[1], 10), sorted = [...list].sort((a, b) => a.h - b.h || a.t.localeCompare(b.t)); if (!(no >= 1 && no <= sorted.length)) return reply(`✕ Nomor tidak valid. Lihat nomor di ${p}`)
      const r = sorted[no - 1]; list.splice(list.indexOf(r), 1); save(); return reply(`Dihapus: *${cap(HARI[r.h])} ${r.t}* — ${r.k}`)
    }
    if (['hariini', 'today', 'sekarang'].includes(sub)) return reply(show(list, today, `✦ ${B('JADWAL HARI INI')} — ${cap(HARI[today])}`))
    if (sub === 'besok') return reply(show(list, (today + 1) % 7, `✦ ${B('JADWAL BESOK')} — ${cap(HARI[(today + 1) % 7])}`))
    if (hari(sub) >= 0) return reply(show(list, hari(sub), `✦ ${B('JADWAL ' + sub.toUpperCase())}`))
    if (!list.length) return reply(`${B('JADWAL')}\nBelum ada jadwal.\nTambah: ${p} tambah senin 08:00 Kuliah`)
    const sorted = [...list].sort((a, b) => a.h - b.h || a.t.localeCompare(b.t)); let t = `✦ ${B('JADWAL MINGGUAN')}\n━━━━━━━━━━━━━━━━━━━━`
    for (const h of [1, 2, 3, 4, 5, 6, 0]) { const r = sorted.filter(x => x.h === h); if (r.length) t += `\n${B(cap(HARI[h]))}${h === today ? ' ◆ hari ini' : ''}\n` + r.map(x => `${sorted.indexOf(x) + 1}. ${x.t} — ${x.k}`).join('\n') + '\n' }
    return reply(t + `\n_${p} hariini • besok • <hari> • hapus <no>_`)
  },
}
