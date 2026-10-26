/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// FINANSIAL: .thr <gaji> <masa kerja bulan>  •  .laba <modal> <harga jual>   (PPN sudah ada di .ppn milik plugin diskon)
// Angka boleh 5k / 250rb / 2jt. Hasil perkiraan, bukan nasihat pajak resmi.
const { B } = require('../../lib/style'), DV = require('../../lib/dev')
const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID')

module.exports = {
  name: 'thr', alias: ['laba', 'untung', 'labarugi'], category: 'praktis', cmds: ['thr', 'laba'], noLimit: true,
  desc: 'Hitung THR (sesuai masa kerja) dan laba/margin penjualan',
  run: async ({ reply, args, prefix, command }) => {
    if (command === 'thr') {
      const g = DV.parseAmount(args[0]), mk = Number(args[1])
      if (!Number.isFinite(g) || g <= 0 || !Number.isFinite(mk) || mk < 0) return reply(`Contoh: ${prefix}thr 5jt 8  (gaji 5 juta, masa kerja 8 bulan)`)
      if (mk < 1) return reply('Masa kerja kurang dari 1 bulan belum berhak atas THR.')
      const thr = mk >= 12 ? g : g * mk / 12
      return reply(`${B('THR')}\nGaji + tunjangan tetap : ${rp(g)}\nMasa kerja             : ${mk} bulan\n${mk >= 12 ? 'Masa kerja ≥ 12 bulan → 1× gaji' : `Proporsional → ${mk}/12 × gaji`}\n\nPerkiraan THR : *${rp(thr)}*\n_Rumus umum Permenaker 6/2016; aturan perusahaan bisa berbeda._`)
    }
    // laba
    const m = DV.parseAmount(args[0]), j = DV.parseAmount(args[1])
    if (!Number.isFinite(m) || !Number.isFinite(j) || m <= 0 || j < 0) return reply(`Contoh: ${prefix}laba 80rb 100rb  (modal 80 ribu, jual 100 ribu)\nOpsional jumlah barang: ${prefix}laba 80rb 100rb 50`)
    const qty = Math.max(1, Math.floor(Number(args[2]) || 1)), p = j - m
    return reply(`${B('LABA / RUGI')}\nModal / unit : ${rp(m)}\nJual / unit  : ${rp(j)}\n${p >= 0 ? 'Laba' : 'Rugi'} / unit  : *${rp(Math.abs(p))}*\nMargin       : ${(p / j * 100 || 0).toFixed(1)}% dari harga jual\nMarkup       : ${(p / m * 100).toFixed(1)}% dari modal${qty > 1 ? `\n\nUntuk ${qty} unit:\nModal ${rp(m * qty)} • Omzet ${rp(j * qty)}\n${p >= 0 ? 'Laba' : 'Rugi'} total : *${rp(Math.abs(p) * qty)}*` : ''}`)
  },
}
