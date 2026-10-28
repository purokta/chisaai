/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kalkulator keuangan lanjutan: nabung, bunga, inflasi, bep, margin, hargajual, danadarurat
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const num = (s) => { const n = parseFloat(String(s ?? '').replace(',', '.').replace('%', '')); return Number.isFinite(n) ? n : NaN }
const Rp = K.rupiah
const row = (k, v) => `┣ ${B(k)} : ${v}`

module.exports = {
  name: 'nabung', alias: ['bunga', 'inflasi', 'bep', 'margin', 'hargajual', 'danadarurat'], category: 'praktis', noLimit: true,
  cmds: ['nabung', 'bunga', 'inflasi', 'bep', 'margin', 'hargajual', 'danadarurat'],
  desc: 'Keuangan: nabung, bunga majemuk, inflasi, BEP, margin, harga jual, dana darurat',
  run: async ({ command, args, prefix, reply }) => {
    const bad = (u) => reply(`✕ Format salah.\nContoh: ${prefix}${u}`)
    switch (command) {
      case 'nabung': {   // target, bulan, [bunga %/tahun]
        const T = K.parseNominal(args[0]), n = parseInt(args[1], 10), r = args[2] ? num(args[2]) : 0
        if (!(T > 0) || !(n > 0) || n > 1200 || !(r >= 0)) return bad('nabung 50jt 24 5   (target, jumlah bulan, bunga %/tahun - opsional)')
        const i = r / 100 / 12, pmt = i ? T * i / (Math.pow(1 + i, n) - 1) : T / n
        return reply(`${B('RENCANA MENABUNG')}\n${row('Target', Rp(T))}\n${row('Jangka', n + ' bulan')}\n${row('Bunga', r + '%/tahun')}\n┗ ${B('Setor per bulan')} : *${Rp(pmt)}*\n\n_Total setoran ${Rp(pmt * n)}${i ? `, bunga sekitar ${Rp(T - pmt * n)}` : ''}._`)
      }
      case 'bunga': {    // pokok, %/tahun, tahun, [harian|bulanan|tahunan]
        const P = K.parseNominal(args[0]), r = num(args[1]), t = num(args[2]), per = (args[3] || 'bulanan').toLowerCase()
        const m = { harian: 365, bulanan: 12, kuartal: 4, tahunan: 1 }[per]
        if (!(P > 0) || !(r >= 0) || !(t > 0) || !m) return bad('bunga 10jt 6 5 bulanan   (pokok, %/tahun, tahun, harian|bulanan|kuartal|tahunan)')
        const A = P * Math.pow(1 + r / 100 / m, m * t), S = P * (1 + r / 100 * t)
        return reply(`${B('BUNGA MAJEMUK')}\n${row('Pokok', Rp(P))}\n${row('Bunga', r + '%/tahun, ' + per)}\n${row('Waktu', t + ' tahun')}\n${row('Nilai akhir', '*' + Rp(A) + '*')}\n┗ ${B('Untung')} : ${Rp(A - P)}\n\n_Bunga tunggal (tanpa berbunga lagi): ${Rp(S)}_`)
      }
      case 'inflasi': {  // nominal, %/tahun, tahun
        const P = K.parseNominal(args[0]), r = num(args[1]), t = num(args[2])
        if (!(P > 0) || !(r >= 0) || !(t > 0)) return bad('inflasi 100jt 4 10   (nominal, inflasi %/tahun, tahun)')
        const f = Math.pow(1 + r / 100, t)
        return reply(`${B('DAMPAK INFLASI')} ${r}%/tahun, ${t} tahun\n${row('Uang ' + Rp(P) + ' nanti setara', '*' + Rp(P / f) + '* hari ini')}\n┗ ${B('Agar daya beli sama butuh')} : *${Rp(P * f)}*\n\n_Kehilangan daya beli ${((1 - 1 / f) * 100).toFixed(1)}%._`)
      }
      case 'bep': {      // biaya tetap, harga/unit, biaya variabel/unit
        const F = K.parseNominal(args[0]), p = K.parseNominal(args[1]), v = K.parseNominal(args[2])
        if (!(F >= 0) || !(p > 0) || !(v >= 0)) return bad('bep 5jt 25rb 10rb   (biaya tetap, harga jual/unit, biaya variabel/unit)')
        if (p <= v) return reply('✕ Harga jual harus lebih besar dari biaya variabel per unit.')
        const q = Math.ceil(F / (p - v))
        return reply(`${B('TITIK IMPAS (BEP)')}\n${row('Margin kontribusi/unit', Rp(p - v))}\n${row('BEP unit', '*' + q.toLocaleString('id-ID') + ' unit*')}\n┗ ${B('BEP rupiah')} : *${Rp(q * p)}*\n\n_Jual di atas ${q.toLocaleString('id-ID')} unit baru mulai untung._`)
      }
      case 'margin': {   // modal, jual
        const c = K.parseNominal(args[0]), s = K.parseNominal(args[1])
        if (!(c > 0) || !(s >= 0)) return bad('margin 80rb 100rb   (modal, harga jual)')
        return reply(`${B('MARGIN & MARKUP')}\n${row('Laba', Rp(s - c))}\n${row('Margin', ((s - c) / s * 100).toFixed(1) + '% dari harga jual')}\n┗ ${B('Markup')} : ${((s - c) / c * 100).toFixed(1)}% dari modal`)
      }
      case 'hargajual': { // modal, margin %
        const c = K.parseNominal(args[0]), g = num(args[1])
        if (!(c > 0) || !(g >= 0) || g >= 100) return bad('hargajual 80rb 25   (modal, margin % dari harga jual)')
        return reply(`${B('HARGA JUAL')}\n${row('Modal', Rp(c))}\n${row('Target margin', g + '%')}\n┗ ${B('Harga jual')} : *${Rp(c / (1 - g / 100))}*\n\n_Dengan markup ${g}% dari modal: ${Rp(c * (1 + g / 100))}_`)
      }
      case 'danadarurat': { // pengeluaran bulanan, status
        const e = K.parseNominal(args[0]), st = (args[1] || 'lajang').toLowerCase()
        const [a, b] = { lajang: [3, 6], menikah: [6, 9], keluarga: [9, 12], anak: [9, 12] }[st] || []
        if (!(e > 0) || !a) return bad('danadarurat 4jt lajang   (pengeluaran/bulan, status: lajang|menikah|keluarga)')
        return reply(`${B('DANA DARURAT')} (${st})\n${row('Pengeluaran/bulan', Rp(e))}\n${row('Ideal', a + '-' + b + ' bulan')}\n┗ ${B('Target')} : *${Rp(e * a)}* sampai *${Rp(e * b)}*\n\n_Simpan di tempat yang mudah dicairkan dan tidak berisiko (tabungan/deposito/reksa dana pasar uang)._`)
      }
    }
  },
}
