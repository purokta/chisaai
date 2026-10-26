/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .mesinwaktu <tanggal> — mesin waktu: semua tentang satu tanggal (hari, weton, Hijriah, zodiak, shio, fase Bulan, usia sampai detik)
//   .mesinwaktu 17-08-1945    .mesinwaktu 2000-01-01    .mesinwaktu 25 desember 2030    .mesinwaktu hariini
const K = require('../../lib/praktis'), D = require('../../lib/daily'), A = require('../../lib/astro'), { B } = require('../../lib/style')
const BLN = K.BULAN.map(b => b.toLowerCase())
function parse(args) {
  const s = args.join(' ').trim().toLowerCase(); if (!s) return null
  const k = K.parseTanggal(args[0]); if (k && args.length === 1) return k
  const m = s.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/); if (m) { const mo = BLN.findIndex(b => b.startsWith(m[2].slice(0, 3)) && b.startsWith(m[2])) + 1; if (mo) return K.parseTanggal(`${m[3]}-${String(mo).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`) }
  return null
}
const jdn = (o) => Math.round(Date.UTC(o.y, o.m - 1, o.d) / 864e5) + 2440588
const gen = (y) => y >= 2013 ? 'Generasi Alpha' : y >= 1997 ? 'Gen Z' : y >= 1981 ? 'Milenial (Gen Y)' : y >= 1965 ? 'Gen X' : y >= 1946 ? 'Baby Boomer' : y >= 1928 ? 'Generasi Silent' : 'Generasi Terdahulu'
function age(a, b) { let y = b.y - a.y, m = b.m - a.m, d = b.d - a.d; if (d < 0) { m--; d += new Date(Date.UTC(b.y, b.m - 1, 0)).getUTCDate() } if (m < 0) { y--; m += 12 } return { y, m, d } }
function nextBirthday(o, t) {
  const ok = (y) => (o.m === 2 && o.d === 29 && !D.isLeap(y)) ? { y, m: 3, d: 1 } : { y, m: o.m, d: o.d }
  let n = ok(t.y); if (D.diffDays(t, n) < 0) n = ok(t.y + 1); return n
}
module.exports = {
  name: 'mesinwaktu', alias: ['timemachine', 'tanggalku', 'ceknanggal'], category: 'ajaib', noLimit: true, cmds: ['mesinwaktu'],
  desc: 'Mesin waktu: hari, weton, Hijriah, zodiak, shio, fase Bulan, usia sampai detik, ulang tahun berikutnya untuk tanggal mana pun',
  run: async ({ args, prefix, reply }) => {
    const key = parse(args)
    if (!key) return reply(`✦ ${B('MESIN WAKTU')}\nMasukkan tanggal apa pun (tahun 1600–2400):\n${prefix}mesinwaktu 17-08-1945\n${prefix}mesinwaktu 2000-01-01\n${prefix}mesinwaktu 25 desember 2030\n${prefix}mesinwaktu hariini`)
    const o = { y: +key.slice(0, 4), m: +key.slice(5, 7), d: +key.slice(8, 10) }
    if (o.y < 1600 || o.y > 2400) return reply('✕ Rentang tahun: 1600–2400.')
    const t = D.now(), diff = D.diffDays(o, t), w = D.weton(o), z = D.zodiak(o), sh = D.shio(o)
    let hj = ''; try { hj = D.hijri(o).text } catch { hj = '—' }
    const noon = new Date(Date.UTC(o.y, o.m - 1, o.d, 5, 0)), ph = A.phase(noon), mo = A.moon(noon)
    const sakral = ['Kliwon'].includes(w.pasaran) && ['Jumat', 'Selasa'].includes(w.hari)
    const L = [`✦ ${B('MESIN WAKTU')}`, `*${K.fmtTanggal(key)}*`, '']
    L.push(`${B('Weton')}  ${w.hari} ${w.pasaran} (neptu ${w.neptu} = ${w.nh}+${w.np})${sakral ? ' — dianggap hari sakral dalam tradisi Jawa' : ''}`)
    L.push(`${B('Hijriah')}  ${hj}`)
    L.push(`${B('Zodiak')}  ${z.name} • ${B('Shio')} ${sh.name}${sh.edge ? ' (perkiraan, batas Imlek)' : ''}`)
    L.push(`${B('Bulan')}  ${A.phaseName(ph.elong)}, ${Math.round(ph.illum * 100)}% terang, umur ${(ph.elong / 360 * 29.53).toFixed(1)} hari`)
    L.push(`${B('Kalender')}  hari ke-${D.dayOfYear(o)} • minggu ISO ${D.isoWeek(o)} • ${D.isLeap(o.y) ? 'tahun kabisat' : 'bukan kabisat'} • JDN ${jdn(o)}`)
    L.push(`${B('Generasi')}  ${gen(o.y)}`, '')
    if (diff > 0) {
      const a = age(o, t), hrs = diff * 24
      L.push(`${B('Sudah berlalu')}  ${a.y} tahun ${a.m} bulan ${a.d} hari`, `= ${diff.toLocaleString('id-ID')} hari ≈ ${hrs.toLocaleString('id-ID')} jam ≈ ${(hrs * 3600).toLocaleString('id-ID')} detik`)
      const nb = nextBirthday(o, t), dn = D.diffDays(t, nb), dw = D.DAYS[D.dowOf(nb.y, nb.m, nb.d)]
      L.push(`${B('Ulang tahun berikutnya')}  ${dn === 0 ? 'HARI INI!' : `${dn} hari lagi (${dw}, ${nb.d} ${K.BULAN[nb.m - 1]} ${nb.y}, usia ${nb.y - o.y})`}`)
    } else if (diff === 0) L.push(`${B('Hari ini')}  tanggal ini adalah hari ini`)
    else L.push(`${B('Masih di masa depan')}  ${(-diff).toLocaleString('id-ID')} hari lagi (${Math.floor(-diff / 7)} minggu ${(-diff) % 7} hari)`)
    L.push('', `_Weton memakai patokan 17-8-1945 = Jumat Legi. Hijriah memakai kalender Umm al-Qura. Fase Bulan dihitung astronomis (pukul 12:00 WIB)._`)
    return reply(L.join('\n'))
  },
}
