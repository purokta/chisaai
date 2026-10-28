/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .umur <tgl lahir> • .selisih <tgl1> [tgl2] • .tambahhari <tgl> <±n> — kalkulator tanggal
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const U = (k) => new Date(k + 'T00:00:00Z')
const ZOD = [['Capricorn', 1, 19], ['Aquarius', 2, 18], ['Pisces', 3, 20], ['Aries', 4, 19], ['Taurus', 5, 20], ['Gemini', 6, 20], ['Cancer', 7, 22], ['Leo', 8, 22], ['Virgo', 9, 22], ['Libra', 10, 22], ['Scorpio', 11, 21], ['Sagitarius', 12, 21], ['Capricorn', 12, 31]]
const zodiak = (mo, d) => ZOD.find(([, m, dd]) => mo < m || (mo === m && d <= dd))[0]
// selisih tahun/bulan/hari kalender dari a ke b (a <= b)
function ymd(a, b) {
  let y = b.getUTCFullYear() - a.getUTCFullYear(), mo = b.getUTCMonth() - a.getUTCMonth(), d = b.getUTCDate() - a.getUTCDate()
  if (d < 0) { mo--; d += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate() }
  if (mo < 0) { y--; mo += 12 }
  return { y, mo, d }
}
const days = (a, b) => Math.round((U(b) - U(a)) / 864e5)
module.exports = {
  name: 'umur', alias: ['usia', 'age', 'selisih', 'selisihtanggal', 'tambahhari', 'tglplus'], category: 'ekstra', noLimit: true, cmds: ['umur', 'selisih', 'tambahhari'],
  desc: 'Kalkulator tanggal: .umur <tgl lahir> • .selisih <tgl1> [tgl2] • .tambahhari <tgl> <±hari>',
  run: async ({ command, args, prefix, reply }) => {
    const today = K.dayKey()
    if (command === 'selisih' || command === 'selisihtanggal') {
      const a = K.parseTanggal(args[0]), b = args[1] ? K.parseTanggal(args[1]) : today
      if (!a || !b) return reply(`Format: ${prefix}selisih <tanggal1> [tanggal2]\nContoh: ${prefix}selisih 2026-01-01 2026-12-31\n_Tanggal kedua dikosongkan = hari ini._`)
      const [x, y] = a <= b ? [a, b] : [b, a], r = ymd(U(x), U(y)), n = days(x, y)
      return reply(`${B('SELISIH TANGGAL')}\n┣ ${K.fmtTanggal(x)}\n┣ ${K.fmtTanggal(y)}\n┃\n┣ Total : *${n.toLocaleString('id-ID')} hari* (${Math.floor(n / 7)} minggu ${n % 7} hari)\n┗ Rinci : ${r.y} tahun ${r.mo} bulan ${r.d} hari`)
    }
    if (command === 'tambahhari' || command === 'tglplus') {
      const a = K.parseTanggal(args[0]), n = parseInt(String(args[1] || '').replace('+', ''), 10)
      if (!a || !Number.isFinite(n) || Math.abs(n) > 36500) return reply(`Format: ${prefix}tambahhari <tanggal> <jumlah hari>\nContoh: ${prefix}tambahhari hariini 90\n       ${prefix}tambahhari 2026-12-31 -45`)
      const r = K.addDays(a, n)
      return reply(`${B('TAMBAH HARI')}\n${K.fmtTanggal(a)}\n${n >= 0 ? '+' : '−'} ${Math.abs(n)} hari\n= *${K.fmtTanggal(r)}*\n_${r}_`)
    }
    const lahir = K.parseTanggal(args[0])
    if (!lahir) return reply(`Format: ${prefix}umur <tanggal lahir>\nContoh: ${prefix}umur 2001-08-17  atau  ${prefix}umur 17/08/2001`)
    if (lahir > today) return reply('✕ Tanggal lahir tidak boleh di masa depan.')
    const r = ymd(U(lahir), U(today)), n = days(lahir, today), [ly, lm, ld] = lahir.split('-').map(Number), ty = +today.slice(0, 4)
    let next = `${ty}-${String(lm).padStart(2, '0')}-${String(ld).padStart(2, '0')}`
    if (lm === 2 && ld === 29 && new Date(Date.UTC(ty, 1, 29)).getUTCMonth() !== 1) next = `${ty}-03-01`
    if (next < today) { const y2 = ty + 1; next = (lm === 2 && ld === 29 && new Date(Date.UTC(y2, 1, 29)).getUTCMonth() !== 1) ? `${y2}-03-01` : `${y2}-${String(lm).padStart(2, '0')}-${String(ld).padStart(2, '0')}` }
    const sisa = days(today, next)
    return reply(`✦ ${B('UMUR')}\n┣ Lahir  : ${K.fmtTanggal(lahir)}\n┣ Umur   : *${r.y} tahun ${r.mo} bulan ${r.d} hari*\n┣ Total  : ${n.toLocaleString('id-ID')} hari • ${Math.floor(n / 7).toLocaleString('id-ID')} minggu • ${(n * 24).toLocaleString('id-ID')} jam\n┣ Zodiak : ${zodiak(lm, ld)}\n┗ Ulang tahun ke-${+next.slice(0, 4) - ly} ${sisa === 0 ? '*HARI INI! Selamat ulang tahun!*' : `dalam *${sisa}* hari (${K.fmtTanggal(next)})`}`)
  },
}
