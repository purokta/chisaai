/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .pph21 <gaji/bulan> [tk0|k1|...] [bonus=<nominal/tahun>] [nonpwp] — estimasi PPh 21 tahunan (tarif progresif UU HPP)
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const LAPIS = [[60e6, 0.05], [250e6, 0.15], [500e6, 0.25], [5e9, 0.30], [Infinity, 0.35]]
function pajak(pkp) { let sisa = pkp, bawah = 0, tot = 0; const rinci = []; for (const [batas, t] of LAPIS) { if (sisa <= 0) break; const lebar = Math.min(sisa, batas - bawah); tot += lebar * t; rinci.push([lebar, t, lebar * t]); sisa -= lebar; bawah = batas } return { tot, rinci } }
const ptkp = (kawin, n) => 54e6 + (kawin ? 4.5e6 : 0) + 4.5e6 * n
module.exports = {
  name: 'pph21', alias: ['pajakgaji', 'hitungpph'], category: 'praktis', noLimit: true, cmds: ['pph21'],
  desc: 'Estimasi PPh 21 tahunan karyawan: PTKP, biaya jabatan, tarif progresif',
  run: async ({ args, prefix, reply }) => {
    const gaji = K.parseNominal(args[0])
    const help = `✦ ${B('PPH 21 (ESTIMASI)')}\n${prefix}pph21 <gaji/bulan> [status] [bonus=<nominal>] [nonpwp]\nContoh: ${prefix}pph21 12jt k1 bonus=24jt\n_Status: tk0–tk3 (lajang) atau k0–k3 (menikah). Bonus/THR = total setahun._`
    if (!(gaji > 0)) return reply(help)
    let kawin = false, n = 0, bonus = 0, npwp = true
    for (const a of args.slice(1)) {
      const s = String(a).toLowerCase(); let mm
      if ((mm = s.match(/^(tk|k)\/?([0-3])$/))) { kawin = mm[1] === 'k'; n = +mm[2] }
      else if ((mm = s.match(/^bonus=(.+)$/))) { bonus = K.parseNominal(mm[1]); if (!(bonus >= 0)) return reply('✕ Nominal bonus tidak valid.') }
      else if (s === 'nonpwp') npwp = false
      else return reply(`✕ Argumen "${a}" tidak dikenali.\n\n${help}`)
    }
    const bruto = gaji * 12 + bonus, jabatan = Math.min(bruto * 0.05, 6e6), P = ptkp(kawin, n)
    const pkp = Math.max(0, Math.floor((bruto - jabatan - P) / 1000) * 1000), { tot, rinci } = pajak(pkp), akhir = npwp ? tot : tot * 1.2
    let t = `✦ ${B('PPH 21 (ESTIMASI)')}\n┣ Status : ${kawin ? 'K' : 'TK'}/${n}  •  ${npwp ? 'ber-NPWP' : 'tanpa NPWP (+20%)'}\n┣ Bruto setahun : ${K.rupiah(bruto)}\n┣ Biaya jabatan : ${K.rupiah(jabatan)}\n┣ PTKP : ${K.rupiah(P)}\n┗ ${B('PKP')} : ${K.rupiah(pkp)}\n`
    if (rinci.length) t += `\n${B('Lapisan tarif')}\n` + rinci.map(([l, r, p]) => `◆ ${K.rupiah(l)} × ${Math.round(r * 100)}% = ${K.rupiah(p)}`).join('\n') + '\n'
    t += `\n${B('Pajak setahun')} : *${K.rupiah(akhir)}*\n${B('Rata-rata/bulan')} : *${K.rupiah(akhir / 12)}*`
    return reply(t + `\n\n_Estimasi tahunan, belum memasukkan iuran pensiun/JHT dan skema TER bulanan. Untuk angka resmi tanyakan bagian HRD atau konsultan pajak._`)
  },
}
