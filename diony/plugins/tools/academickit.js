/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kit akademik & validasi format: skor → huruf, konversi nilai angka↔huruf, konversi SKS↔jam belajar,
// validasi format email, validasi format nomor HP Indonesia, validasi format NPWP.
const { B } = require('../../lib/style')
const num = (s) => { const n = parseFloat(String(s).replace(',', '.')); return Number.isFinite(n) ? n : NaN }

const CMDS = ['skorhuruf', 'konversinilaiakademik', 'sksconv', 'emailvalidasi', 'nomorhpvalidasi', 'npwpvalidasi']
const GRADE = [[85, 'A', 4.0], [80, 'A-', 3.7], [75, 'B+', 3.3], [70, 'B', 3.0], [65, 'B-', 2.7], [60, 'C+', 2.3], [55, 'C', 2.0], [40, 'D', 1.0], [0, 'E', 0]]
const LETTER_TO_POINT = { a: 4.0, 'a-': 3.7, 'b+': 3.3, b: 3.0, 'b-': 2.7, 'c+': 2.3, c: 2.0, d: 1.0, e: 0 }
const OPERATORS = [
  [/^08(11|12|13|21|22|23|51|52|53)/, 'Telkomsel'], [/^0(8[1][4-9]|85[0-9]|87[0-8])/, 'Indosat/Tri'],
  [/^08(31|32|33|81|82|83|85|88|89)/, 'XL Axiata'], [/^0(895|896|897|898|899)/, 'Tri'], [/^08(89|81)/, 'Smartfren'],
]

module.exports = {
  name: 'academickit', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'Kit akademik & validasi: skor ke huruf, konversi nilai, SKS, validasi email/HP/NPWP',
  run: async ({ command, args, text, prefix, reply }) => {
    const p = prefix
    if (command === 'skorhuruf') {
      const n = num(args[0])
      if (!Number.isFinite(n) || n < 0 || n > 100) return reply(`${B('SKOR → HURUF')}\nFormat: ${p}skorhuruf <0-100>\nContoh: ${p}skorhuruf 82`)
      const g = GRADE.find(([min]) => n >= min)
      return reply(`${B('SKOR → HURUF')}\nSkor ${fmtN(n)} = huruf *${g[1]}* (bobot ${g[2].toFixed(1)})\n\n_Skala: A≥85 A-≥80 B+≥75 B≥70 B-≥65 C+≥60 C≥55 D≥40 E<40_`)
    }
    if (command === 'konversinilaiakademik') {
      const a = (args[0] || '').toLowerCase()
      if (/^[0-9.]+$/.test(a)) {
        const n = num(a)
        if (!Number.isFinite(n) || n < 0 || n > 4) return reply(`${B('NILAI ANGKA → HURUF')}\nFormat: ${p}konversinilaiakademik <bobot 0-4 | huruf>\nContoh: ${p}konversinilaiakademik 3.5\n       ${p}konversinilaiakademik B+`)
        let best = 'E', diff = Infinity
        for (const [L, v] of Object.entries(LETTER_TO_POINT)) if (Math.abs(v - n) < diff) { diff = Math.abs(v - n); best = L }
        return reply(`${B('NILAI → HURUF')}\nBobot ${n.toFixed(2)} ≈ huruf *${best.toUpperCase()}*`)
      }
      const v = LETTER_TO_POINT[a]
      if (v === undefined) return reply(`${B('NILAI HURUF → ANGKA')}\nFormat: ${p}konversinilaiakademik <huruf | bobot>\nContoh: ${p}konversinilaiakademik A-`)
      return reply(`${B('NILAI → ANGKA')}\nHuruf *${a.toUpperCase()}* = bobot *${v.toFixed(1)}*`)
    }
    if (command === 'sksconv') {
      const sks = num(args[0])
      if (!Number.isFinite(sks) || sks <= 0 || sks > 24) return reply(`${B('KONVERSI SKS')}\nFormat: ${p}sksconv <jumlah sks>\nContoh: ${p}sksconv 3\n_Mengikuti acuan 1 SKS = 50 menit tatap muka + 60 menit terstruktur + 60 menit mandiri per minggu._`)
      const tm = sks * 50, pt = sks * 60, bm = sks * 60, total = tm + pt + bm
      return reply(`${B('KONVERSI SKS')} (${sks} SKS / minggu)\n┣ Tatap muka    : ${tm} menit\n┣ Tugas terstruktur : ${pt} menit\n┣ Belajar mandiri   : ${bm} menit\n┗ Total  : ${total} menit (≈ ${(total / 60).toFixed(1)} jam) per minggu`)
    }
    if (command === 'emailvalidasi') {
      const e = (text || '').trim()
      if (!e) return reply(`${B('VALIDASI EMAIL')}\nContoh: ${p}emailvalidasi nama@contoh.com`)
      const ok = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e)
      const domain = e.split('@')[1] || '-'
      return reply(`${B('VALIDASI EMAIL')}\n${e}\n\nFormat valid : *${ok ? 'Ya ✓' : 'Tidak ✕'}*${ok ? `\nDomain       : ${domain}` : ''}\n_Ini hanya mengecek format penulisan, bukan apakah alamatnya benar-benar aktif._`)
    }
    if (command === 'nomorhpvalidasi') {
      const raw = (text || '').replace(/[\s\-()]/g, '')
      if (!raw) return reply(`${B('VALIDASI NOMOR HP')}\nContoh: ${p}nomorhpvalidasi 081234567890`)
      const norm = raw.replace(/^\+?62/, '0').replace(/^62/, '0')
      const ok = /^08[0-9]{8,12}$/.test(norm)
      if (!ok) return reply(`${B('VALIDASI NOMOR HP')}\n${raw}\n\nFormat valid : *Tidak ✕*\n_Nomor Indonesia harus diawali 08 dan 10-13 digit._`)
      const op = (OPERATORS.find(([re]) => re.test(norm)) || [, 'Tidak terdeteksi'])[1]
      return reply(`${B('VALIDASI NOMOR HP')}\n${raw}\n\nFormat valid : *Ya ✓*\nFormat 62    : ${norm.replace(/^0/, '62')}\nOperator (perkiraan) : ${op}\n_Deteksi operator berdasar pola prefix publik, bisa meleset karena portabilitas nomor._`)
    }
    if (command === 'npwpvalidasi') {
      const raw = (text || '').replace(/[.\-\s]/g, '')
      if (!raw) return reply(`${B('VALIDASI FORMAT NPWP')}\nContoh: ${p}npwpvalidasi 01.234.567.8-901.000`)
      const ok = /^\d{15,16}$/.test(raw)
      return reply(`${B('VALIDASI FORMAT NPWP')}\n${text.trim()}\n\nJumlah digit : ${raw.length}\nFormat valid : *${ok ? 'Ya ✓ (15-16 digit)' : 'Tidak ✕ (NPWP standar 15 digit, format baru 16 digit/NIK)'}*\n_Ini hanya mengecek jumlah & format digit, bukan validasi ke sistem DJP._`)
    }
  },
}
function fmtN(n) { return Number.isInteger(n) ? String(n) : n.toFixed(2) }
