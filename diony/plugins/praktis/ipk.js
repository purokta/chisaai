/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .ipk <nilai sks, ...>  •  .ipk target <ipk> <sks> <target> <sks depan>  •  .nilai (nilai akhir berbobot)
const { B } = require('../../lib/style')
const BOBOT = { A: 4, 'A-': 3.7, AB: 3.5, 'B+': 3.3, B: 3, 'B-': 2.7, BC: 2.5, 'C+': 2.3, C: 2, D: 1, E: 0 }
const f2 = (x) => x.toFixed(2).replace('.', ',')
const predikat = (x) => (x >= 3.51 ? 'Sangat memuaskan / berpotensi cum laude' : x >= 2.76 ? 'Sangat memuaskan' : x >= 2 ? 'Memuaskan' : 'Di bawah syarat lulus umum (2,00)')
module.exports = {
  name: 'ipk', alias: ['ips', 'nilai', 'nilaiakhir'], category: 'praktis', noLimit: true, cmds: ['ipk', 'ips', 'nilai'],
  desc: 'Hitung IPS/IPK, target IPS, dan nilai akhir berbobot',
  run: async ({ args, text, command, prefix, reply }) => {
    if (command === 'nilai') {
      const parts = String(text || '').split('|').map(s => s.trim()).filter(Boolean), help = `✦ ${B('NILAI AKHIR')}\n${prefix}nilai tugas 80 20 | uts 70 30 | uas 85 50\n_Tiap komponen: nama, nilai, bobot (%). Kosongkan nilai komponen belum keluar dengan tanda ?  contoh: uas ? 50 — bot hitung nilai minimum yang dibutuhkan._`
      if (!parts.length) return reply(help)
      let got = 0, w = 0, unk = null, rows = ''
      for (const p of parts) { const [n, v, b] = p.split(/\s+/), bw = parseFloat(String(b).replace(',', '.')); if (!n || !(bw > 0)) return reply(`✕ Komponen "${p}" tidak valid.\n\n${help}`)
        w += bw; if (v === '?') { if (unk) return reply('✕ Hanya satu komponen yang boleh bertanda ?'); unk = { n, bw }; rows += `◇ ${n}: ? (${bw}%)\n` } else { const vv = parseFloat(String(v).replace(',', '.')); if (!(vv >= 0 && vv <= 100)) return reply(`✕ Nilai "${v}" harus 0–100.`); got += vv * bw / 100; rows += `◆ ${n}: ${vv} (${bw}%) → ${f2(vv * bw / 100)}\n` } }
      if (Math.abs(w - 100) > 0.01) return reply(`✕ Total bobot harus 100% (sekarang ${w}%).`)
      if (!unk) return reply(`✦ ${B('NILAI AKHIR')}\n${rows}\n${B('Nilai akhir')} : *${f2(got)}*`)
      const need = (t) => (t - got) / unk.bw * 100, tb = [['A', 80], ['B', 70], ['C', 60], ['D', 50]]
      return reply(`✦ ${B('NILAI AKHIR')}\n${rows}\nSaat ini terkumpul ${f2(got)} poin. Butuh nilai *${unk.n}* minimal:\n` + tb.map(([g, t]) => { const n = need(t); return `◆ untuk ${g} (≥${t}): ${n <= 0 ? 'sudah aman' : n > 100 ? 'tidak mungkin tercapai' : f2(n)}` }).join('\n') + '\n_Batas huruf A=80, B=70, C=60, D=50 hanyalah contoh; sesuaikan dengan kampus/sekolahmu._')
    }
    if ((args[0] || '').toLowerCase() === 'target') {
      const [cur, sks, tgt, nx] = args.slice(1).map(x => parseFloat(String(x).replace(',', '.')))
      if (![cur, sks, tgt, nx].every(Number.isFinite) || cur < 0 || cur > 4 || tgt < 0 || tgt > 4 || sks < 0 || nx <= 0) return reply(`✦ ${B('TARGET IPK')}\n${prefix}ipk target <IPK sekarang> <SKS sekarang> <IPK target> <SKS semester depan>\nContoh: ${prefix}ipk target 3,4 60 3,5 20`)
      const need = (tgt * (sks + nx) - cur * sks) / nx
      return reply(`✦ ${B('TARGET IPK')}\nUntuk IPK *${f2(tgt)}* setelah ${sks + nx} SKS, IPS semester depan harus minimal *${f2(need)}*.\n${need > 4 ? '_Mustahil di skala 4,00; turunkan target atau ambil lebih banyak SKS._' : need < 0 ? '_Target sudah pasti tercapai._' : '_Skala 4,00._'}`)
    }
    const items = String(text || '').split(/[,;\n|]+/).map(s => s.trim()).filter(Boolean), help = `✦ ${B('IPK / IPS')}\n${prefix}ipk A 3, B+ 2, B 4, AB 3\n${prefix}ipk target 3,4 60 3,5 20\n_Format: <huruf atau angka 0–4> <SKS>. Huruf: ${Object.keys(BOBOT).join(' ')}_`
    if (!items.length) return reply(help)
    let sks = 0, poin = 0, rows = ''
    for (const [i, it] of items.slice(0, 40).entries()) { const [g, s] = it.split(/\s+/), key = String(g).toUpperCase(), b = key in BOBOT ? BOBOT[key] : parseFloat(String(g).replace(',', '.')), c = parseFloat(String(s).replace(',', '.'))
      if (!(b >= 0 && b <= 4) || !(c > 0 && c <= 10)) return reply(`✕ Mata kuliah ${i + 1} ("${it}") tidak valid.\n\n${help}`)
      sks += c; poin += b * c; rows += `${i + 1}. ${key in BOBOT ? key : g} × ${c} SKS = ${f2(b * c)}\n` }
    const x = poin / sks
    return reply(`✦ ${B('INDEKS PRESTASI')}\n${rows}\n┣ Total SKS : ${sks}\n┣ Total mutu : ${f2(poin)}\n┗ ${B('Indeks')} : *${f2(x)}*\n_${predikat(x)} (kriteria umum, kampusmu bisa berbeda)_`)
  },
}
