/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Info tanggal: hari ke-berapa dalam setahun, tahun kabisat, jumlah hari dalam bulan.
//   .harike [tanggal] • .kabisat <tahun> • .jumlahhari <bulan> <tahun>
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const dim = (y, mo) => [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1]
function isoWeek(key) { const d = new Date(key + 'T00:00:00Z'), day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return { week: 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7), year: d.getUTCFullYear() } }
const BLN = K.BULAN.map(b => b.toLowerCase())
module.exports = {
  name: 'harike', alias: ['kabisat', 'jumlahhari'], category: 'praktis', noLimit: true, cmds: ['harike', 'kabisat', 'jumlahhari'],
  desc: 'Info tanggal: hari ke-berapa dalam setahun, tahun kabisat, jumlah hari dalam bulan',
  run: async ({ command, args, prefix, reply }) => {
    if (command === 'kabisat') {
      const y = parseInt(args[0], 10); if (!(y >= 1 && y <= 9999)) return reply(`${B('TAHUN KABISAT')}\n${prefix}kabisat 2028`)
      let nx = y + 1; while (!leap(nx)) nx++
      return reply(`📆 ${B('TAHUN KABISAT')}\n${y} ${leap(y) ? '*adalah* tahun kabisat (366 hari, Februari 29 hari)' : '*bukan* tahun kabisat (365 hari)'}.\nTahun kabisat berikutnya setelah ${y}: *${nx}*`)
    }
    if (command === 'jumlahhari') {
      const mo = /^\d+$/.test(args[0] || '') ? parseInt(args[0], 10) : BLN.findIndex(b => b.startsWith(String(args[0] || 'zzz').toLowerCase().slice(0, 3))) + 1, y = parseInt(args[1], 10) || parseInt(K.dayKey().slice(0, 4), 10)
      if (!(mo >= 1 && mo <= 12) || !(y >= 1 && y <= 9999)) return reply(`${B('JUMLAH HARI')}\n${prefix}jumlahhari februari 2028\n${prefix}jumlahhari 10 2026`)
      return reply(`📆 ${K.BULAN[mo - 1]} ${y} memiliki *${dim(y, mo)} hari*.`)
    }
    const key = args[0] ? K.parseTanggal(args[0]) : K.dayKey(); if (!key) return reply(`✕ Tanggal tidak valid.\n${prefix}harike 2026-12-25\n${prefix}harike 25-12-2026`)
    const y = +key.slice(0, 4), n = Math.round((new Date(key + 'T00:00:00Z') - new Date(Date.UTC(y, 0, 1))) / 86400000) + 1, total = leap(y) ? 366 : 365, w = isoWeek(key), q = Math.ceil(+key.slice(5, 7) / 3)
    return reply(`📆 ${B('HARI KE-BERAPA')}\n${K.fmtTanggal(key)}\n┣ Hari ke : *${n}* dari ${total}\n┣ Minggu  : ke-${w.week} (ISO ${w.year})\n┣ Kuartal : Q${q}\n┣ Sisa    : ${total - n} hari lagi di tahun ${y}\n┗ ${K.bar(n / total)} ${Math.round(n / total * 100)}%`)
  },
}
