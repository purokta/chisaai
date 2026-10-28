/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Konversi Masehi <-> Hijriah (Intl Umm al-Qura, offline) + hitung mundur Ramadan
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const BH = ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syaban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah']
const FMT = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
function toHijri(key) { const p = FMT.formatToParts(new Date(key + 'T12:00:00Z')), g = (t) => +p.find(x => x.type === t).value; return { d: g('day'), m: g('month'), y: g('year') } }
function fromHijri(d, m, y) {
  let k = new Date(Date.UTC(Math.floor(y * 0.970224 + 621.5774) - 1, 0, 1))
  for (let i = 0; i < 900; i++) { const key = k.toISOString().slice(0, 10), h = toHijri(key); if (h.d === d && h.m === m && h.y === y) return key; k = new Date(k.getTime() + 86400000) }
  return null
}
module.exports = {
  name: 'hijri', alias: ['hijriah', 'tanggalhijriyah', 'masehikehijriah'], category: 'praktis', noLimit: true, cmds: ['hijri'],
  desc: 'Konversi tanggal Masehi ⇄ Hijriah + hitung mundur 1 Ramadan',
  run: async ({ args, prefix, reply }) => {
    const today = K.dayKey(), note = `\n\n_Kalender Umm al-Qura; awal bulan versi Kemenag RI/ormas bisa berbeda ±1 hari._`
    if (args.length >= 3 && /^\d+$/.test(args[0]) && /^\d+$/.test(args[2])) {
      const d = +args[0], y = +args[2], mon = /^\d+$/.test(args[1]) ? +args[1] : BH.findIndex(b => b.toLowerCase().replace(/\s/g, '').startsWith(args[1].toLowerCase().replace(/\s/g, ''))) + 1
      if (!(mon >= 1 && mon <= 12) || d < 1 || d > 30 || y < 1300 || y > 1600) return reply(`✕ Format: ${prefix}hijri 1 ramadan 1448 (tanggal bulan tahun Hijriah)`)
      const key = fromHijri(d, mon, y); if (!key) return reply('✕ Tanggal Hijriah itu tidak ditemukan.')
      return reply(`✦ ${B('HIJRIAH → MASEHI')}\n\n${d} ${BH[mon - 1]} ${y} H\n= *${K.fmtTanggal(key)}*${note}`)
    }
    const key = args[0] ? K.parseTanggal(args[0]) : today
    if (!key) return reply(`✦ ${B('KALENDER HIJRIAH')}\n${prefix}hijri  (hari ini)\n${prefix}hijri 17-08-2026\n${prefix}hijri 1 ramadan 1448  (Hijriah → Masehi)`)
    const h = toHijri(key)
    let t = `✦ ${B('MASEHI → HIJRIAH')}\n\n${K.fmtTanggal(key)}\n= *${K.HARI[new Date(key + 'T00:00:00Z').getUTCDay()]}, ${h.d} ${BH[h.m - 1]} ${h.y} H*`
    if (key === today) {
      let ry = h.m <= 9 ? h.y : h.y + 1, r = fromHijri(1, 9, ry)
      if (r && r < today) { ry += 1; r = fromHijri(1, 9, ry) }
      if (r) t += `\n\n${B('1 Ramadan')} ${ry} H : *${Math.round((new Date(r) - new Date(today)) / 86400000)} hari lagi* (${K.fmtTanggal(r)})`
    }
    return reply(t + note)
  },
}
