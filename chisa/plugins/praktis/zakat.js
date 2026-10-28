/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kalkulator zakat: penghasilan, maal, emas, fitrah
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const NISAB = 85, RATE = 0.025
module.exports = {
  name: 'zakat', alias: ['hitungzakat', 'kalkulatorzakat'], category: 'praktis', noLimit: true, cmds: ['zakat'],
  desc: 'Kalkulator zakat: penghasilan, maal (harta), emas, dan fitrah',
  run: async ({ args, prefix, reply }) => {
    const jenis = (args[0] || '').toLowerCase(), R = K.rupiah
    const help = `✦ ${B('KALKULATOR ZAKAT')}\n\n${prefix}zakat penghasilan 8jt 1500000\n┗ gaji/bulan, harga emas/gram\n${prefix}zakat maal 200jt 1500000\n┗ total harta setahun, harga emas/gram\n${prefix}zakat emas 100 1500000\n┗ gram emas, harga emas/gram\n${prefix}zakat fitrah 4 15000\n┗ jumlah jiwa, harga beras/kg\n\n_Harga emas diisi manual agar sesuai harga terbaru (cek Antam/BAZNAS)._`
    if (!jenis) return reply(help)
    const note = `\n\n_Perkiraan berdasar ketentuan umum (nisab 85 gram emas, kadar 2,5%). Untuk kepastian, tanyakan ke BAZNAS/LAZ atau ustaz terpercaya._`
    if (jenis === 'fitrah') {
      const jiwa = parseInt(args[1], 10), harga = K.parseNominal(args[2]); if (!(jiwa >= 1) || !(harga > 0)) return reply(help)
      return reply(`✦ ${B('ZAKAT FITRAH')}\n\n${B('Jiwa')} : ${jiwa}\n${B('Per jiwa')} : 2,5 kg beras\n\n┣ Beras total : *${jiwa * 2.5} kg*\n┣ Setara uang : *${R(jiwa * 2.5 * harga)}* (@ ${R(harga)}/kg)\n┗ Per jiwa : ${R(2.5 * harga)}\n\n_Ukuran 2,5 kg mengikuti BAZNAS; sebagian ulama memakai 3,5 liter. Tanyakan ke lembaga zakat setempat._`)
    }
    const x = K.parseNominal(args[1]), emas = K.parseNominal(args[2])
    if (!(x > 0) || !(emas > 0) || !['penghasilan', 'maal', 'emas'].includes(jenis)) return reply(help)
    const nisab = NISAB * emas
    if (jenis === 'penghasilan') {
      const nb = nisab / 12, ok = x >= nb
      return reply(`✦ ${B('ZAKAT PENGHASILAN')}\n\n${B('Penghasilan/bln')} : ${R(x)}\n${B('Nisab/bulan')} : ${R(nb)}\n_(85 gr emas ÷ 12 @ ${R(emas)})_\n\n${ok ? `✦ Sudah mencapai nisab\n┣ Zakat/bulan : *${R(x * RATE)}*\n┗ Per tahun : ${R(x * RATE * 12)}` : `✕ Belum mencapai nisab — belum wajib zakat (kurang ${R(nb - x)}).\nTetap boleh bersedekah kapan saja.`}${note}`)
    }
    if (jenis === 'maal') {
      const ok = x >= nisab
      return reply(`✦ ${B('ZAKAT MAAL')}\n\n${B('Total harta')} : ${R(x)}\n${B('Nisab')} : ${R(nisab)}\n_(85 gr emas @ ${R(emas)})_\n\n${ok ? `✦ Mencapai nisab (jika sudah dimiliki 1 tahun/haul)\n┗ Zakat : *${R(x * RATE)}*` : `✕ Belum mencapai nisab (kurang ${R(nisab - x)}).`}${note}`)
    }
    const ok = x >= NISAB
    return reply(`✦ ${B('ZAKAT EMAS')}\n\n${B('Emas')} : ${x} gram (${R(x * emas)})\n${B('Nisab')} : ${NISAB} gram\n\n${ok ? `✦ Mencapai nisab (jika sudah 1 tahun/haul)\n┗ Zakat : *${(x * RATE).toFixed(2)} gram* ≈ ${R(x * emas * RATE)}` : `✕ Belum mencapai nisab (kurang ${(NISAB - x).toFixed(1)} gram).`}${note}`)
  },
}
