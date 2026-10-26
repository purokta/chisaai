/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kit finansial, kesehatan & perjalanan tambahan:
//   Keuangan  : bunga majemuk, diskon berjenjang, rasio keuangan pribadi, titik impas (BEP), margin, ROI, simulasi deposito
//   Kesehatan : kalori harian (Mifflin-St Jeor), BMR, kebutuhan air minum, kalori olahraga, kebutuhan tidur
//   Perjalanan: jarak dua koordinat (haversine), estimasi waktu tempuh, kecepatan rata-rata
const { B } = require('../../lib/style'), K = require('../../lib/praktis')
const num = (s) => { const n = parseFloat(String(s).replace(',', '.')); return Number.isFinite(n) ? n : NaN }
const R = K.rupiah

const CMDS = ['bungahitung', 'diskonberjenjang', 'rasiokeuangan', 'hitungbep', 'margincalc', 'roicalc', 'simpledeposito', 'hitungkalori', 'hitungbmr', 'hitungairminum', 'hitungolahraga', 'hitungtidur', 'jarakdua', 'estimasiwaktu', 'kecepatanrata']

const AKTIVITAS = { santai: 1.2, ringan: 1.375, sedang: 1.55, aktif: 1.725, berat: 1.9 }
const MET = { jalan: 3.5, jogging: 7, lari: 9.8, sepeda: 7.5, renang: 8, yoga: 2.5, angkatbeban: 5, zumba: 6.5, basket: 6.5, futsal: 7 }

module.exports = {
  name: 'financekit2', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'Kit tambahan: bunga, diskon berjenjang, rasio keuangan, BEP, margin, ROI, deposito, kalori, BMR, air minum, jarak & kecepatan',
  run: async ({ command, args, text, prefix, reply }) => {
    const p = prefix
    if (command === 'bungahitung') {
      const [pokok, persen, tahun, jenis] = [K.parseNominal(args[0]), num(args[1]), num(args[2]), (args[3] || 'majemuk').toLowerCase()]
      if (![pokok, persen, tahun].every(Number.isFinite) || pokok <= 0 || tahun <= 0) return reply(`${B('BUNGA')}\nFormat: ${p}bungahitung <pokok> <persen/thn> <tahun> [majemuk|tunggal]\nContoh: ${p}bungahitung 10jt 5 3 majemuk`)
      const hasil = jenis === 'tunggal' ? pokok * (1 + (persen / 100) * tahun) : pokok * Math.pow(1 + persen / 100, tahun)
      return reply(`${B('BUNGA ' + jenis.toUpperCase())}\nPokok : ${R(pokok)}\nBunga : ${persen}%/tahun selama ${tahun} tahun\n\nHasil akhir : *${R(hasil)}*\nTotal bunga : ${R(hasil - pokok)}`)
    }
    if (command === 'diskonberjenjang') {
      const harga = K.parseNominal(args[0]), disk = args.slice(1).map(num)
      if (!Number.isFinite(harga) || harga <= 0 || !disk.length || disk.some(x => !Number.isFinite(x) || x < 0 || x > 100)) return reply(`${B('DISKON BERJENJANG')}\nFormat: ${p}diskonberjenjang <harga> <%1> [%2] [%3...]\nContoh: ${p}diskonberjenjang 500rb 20 10  (diskon 20% lalu 10% dari sisa)`)
      let h = harga; const steps = []
      for (const d of disk) { const potong = h * d / 100; h -= potong; steps.push(`− ${d}% = ${R(potong)} → sisa ${R(h)}`) }
      return reply(`${B('DISKON BERJENJANG')}\nHarga awal : ${R(harga)}\n${steps.join('\n')}\n\nHarga akhir : *${R(h)}*\nTotal hemat : ${R(harga - h)} (${(100 - h / harga * 100).toFixed(1)}%)`)
    }
    if (command === 'rasiokeuangan') {
      const [pemasukan, pengeluaran, cicilan, tabungan] = [K.parseNominal(args[0]), K.parseNominal(args[1]), K.parseNominal(args[2] || 0), K.parseNominal(args[3] || 0)]
      if (![pemasukan, pengeluaran].every(Number.isFinite) || pemasukan <= 0) return reply(`${B('RASIO KEUANGAN')}\nFormat: ${p}rasiokeuangan <pemasukan> <pengeluaran> [cicilan] [tabungan]\nContoh: ${p}rasiokeuangan 10jt 6jt 2jt 1jt`)
      const utang = pengeluaran > 0 ? cicilan / pemasukan * 100 : 0, nabung = tabungan / pemasukan * 100, sisa = pemasukan - pengeluaran - cicilan - tabungan
      const statusUtang = utang <= 30 ? 'Sehat' : utang <= 40 ? 'Waspada' : 'Berisiko (idealnya ≤30%)'
      return reply(`${B('RASIO KEUANGAN')}\nPemasukan   : ${R(pemasukan)}\nPengeluaran : ${R(pengeluaran)}\nCicilan     : ${R(cicilan)}\nTabungan    : ${R(tabungan)}\n\n┣ Rasio cicilan/pemasukan : ${utang.toFixed(1)}% — ${statusUtang}\n┣ Rasio menabung          : ${nabung.toFixed(1)}%${nabung < 10 ? ' (idealnya ≥10%)' : ''}\n┗ Sisa arus kas           : ${R(sisa)}${sisa < 0 ? ' ⚠ defisit' : ''}`)
    }
    if (command === 'hitungbep') {
      const [biayaTetap, hargaJual, biayaVariabel] = [K.parseNominal(args[0]), K.parseNominal(args[1]), K.parseNominal(args[2])]
      if (![biayaTetap, hargaJual, biayaVariabel].every(Number.isFinite) || hargaJual <= biayaVariabel) return reply(`${B('TITIK IMPAS (BEP)')}\nFormat: ${p}hitungbep <biaya tetap> <harga jual/unit> <biaya variabel/unit>\nContoh: ${p}hitungbep 5jt 50rb 30rb\n_Harga jual harus lebih besar dari biaya variabel._`)
      const marginKontribusi = hargaJual - biayaVariabel, unitBep = Math.ceil(biayaTetap / marginKontribusi), rupiahBep = unitBep * hargaJual
      return reply(`${B('TITIK IMPAS (BEP)')}\nBiaya tetap        : ${R(biayaTetap)}\nMargin kontribusi  : ${R(marginKontribusi)}/unit\n\nBEP dalam unit  : *${unitBep.toLocaleString('id-ID')} unit*\nBEP dalam rupiah: *${R(rupiahBep)}*`)
    }
    if (command === 'margincalc') {
      const [modal, jual] = [K.parseNominal(args[0]), K.parseNominal(args[1])]
      if (![modal, jual].every(Number.isFinite) || modal <= 0) return reply(`${B('MARGIN & MARKUP')}\nFormat: ${p}margincalc <modal> <harga jual>\nContoh: ${p}margincalc 20rb 30rb`)
      const laba = jual - modal, margin = laba / jual * 100, markup = laba / modal * 100
      return reply(`${B('MARGIN & MARKUP')}\nModal      : ${R(modal)}\nHarga jual : ${R(jual)}\nLaba       : ${R(laba)}\n\n┣ Margin (laba/harga jual) : ${margin.toFixed(1)}%\n┗ Markup (laba/modal)      : ${markup.toFixed(1)}%`)
    }
    if (command === 'roicalc') {
      const [modal, hasil] = [K.parseNominal(args[0]), K.parseNominal(args[1])]
      if (![modal, hasil].every(Number.isFinite) || modal <= 0) return reply(`${B('ROI — RETURN ON INVESTMENT')}\nFormat: ${p}roicalc <modal investasi> <hasil akhir>\nContoh: ${p}roicalc 10jt 13jt`)
      const untung = hasil - modal, roi = untung / modal * 100
      return reply(`${B('ROI')}\nModal : ${R(modal)}\nHasil : ${R(hasil)}\nLaba/Rugi : ${R(untung)}\n\nROI : *${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%*`)
    }
    if (command === 'simpledeposito') {
      const [pokok, persenTahun, bulan] = [K.parseNominal(args[0]), num(args[1]), num(args[2])]
      if (![pokok, persenTahun, bulan].every(Number.isFinite) || pokok <= 0 || bulan <= 0) return reply(`${B('SIMULASI DEPOSITO')}\nFormat: ${p}simpledeposito <pokok> <bunga%/thn> <tenor bulan>\nContoh: ${p}simpledeposito 10jt 4.5 12\n_Perhitungan kasar, bunga tunggal pro-rata, belum potong pajak 20%._`)
      const bungaKotor = pokok * (persenTahun / 100) * (bulan / 12), pajak = bungaKotor * 0.2, bungaBersih = bungaKotor - pajak
      return reply(`${B('SIMULASI DEPOSITO')}\nPokok  : ${R(pokok)}\nBunga  : ${persenTahun}%/tahun × ${bulan} bulan\n\n┣ Bunga kotor      : ${R(bungaKotor)}\n┣ Pajak bunga (20%): ${R(pajak)}\n┣ Bunga bersih      : ${R(bungaBersih)}\n┗ Total cair        : *${R(pokok + bungaBersih)}*\n_Estimasi kasar, abaikan jika tenor/bunga promo berbeda._`)
    }
    if (command === 'hitungkalori') {
      const [jk, berat, tinggi, umur, aktivitas] = [(args[0] || '').toLowerCase(), num(args[1]), num(args[2]), num(args[3]), (args[4] || 'ringan').toLowerCase()]
      if (!['l', 'p'].includes(jk) || ![berat, tinggi, umur].every(Number.isFinite) || !AKTIVITAS[aktivitas]) return reply(`${B('KEBUTUHAN KALORI HARIAN')}\nFormat: ${p}hitungkalori <l/p> <berat kg> <tinggi cm> <umur> <aktivitas>\nAktivitas: santai, ringan, sedang, aktif, berat\nContoh: ${p}hitungkalori l 70 170 25 sedang`)
      const bmr = jk === 'l' ? 10 * berat + 6.25 * tinggi - 5 * umur + 5 : 10 * berat + 6.25 * tinggi - 5 * umur - 161
      const tdee = bmr * AKTIVITAS[aktivitas]
      return reply(`${B('KEBUTUHAN KALORI HARIAN')} (Mifflin-St Jeor)\nBMR (istirahat) : ${Math.round(bmr)} kkal\nAktivitas       : ${aktivitas}\n\nKebutuhan harian : *${Math.round(tdee)} kkal*\n┣ Menurunkan BB (defisit 500) : ${Math.round(tdee - 500)} kkal\n┗ Menaikkan BB (surplus 500)  : ${Math.round(tdee + 500)} kkal`)
    }
    if (command === 'hitungbmr') {
      const [jk, berat, tinggi, umur] = [(args[0] || '').toLowerCase(), num(args[1]), num(args[2]), num(args[3])]
      if (!['l', 'p'].includes(jk) || ![berat, tinggi, umur].every(Number.isFinite)) return reply(`${B('BMR')}\nFormat: ${p}hitungbmr <l/p> <berat kg> <tinggi cm> <umur>\nContoh: ${p}hitungbmr p 55 160 23`)
      const bmr = jk === 'l' ? 10 * berat + 6.25 * tinggi - 5 * umur + 5 : 10 * berat + 6.25 * tinggi - 5 * umur - 161
      return reply(`${B('BMR — BASAL METABOLIC RATE')}\nKalori yang tubuhmu bakar saat istirahat total:\n\n*${Math.round(bmr)} kkal/hari*`)
    }
    if (command === 'hitungairminum') {
      const berat = num(args[0]), aktif = (args[1] || '').toLowerCase() === 'aktif'
      if (!Number.isFinite(berat) || berat <= 0) return reply(`${B('KEBUTUHAN AIR MINUM')}\nFormat: ${p}hitungairminum <berat kg> [aktif]\nContoh: ${p}hitungairminum 60 aktif`)
      const ml = berat * 33 + (aktif ? 500 : 0)
      return reply(`${B('KEBUTUHAN AIR MINUM')}\nBerat badan : ${berat} kg\n\nKebutuhan harian : *${(ml / 1000).toFixed(1)} liter* (≈ ${Math.round(ml / 250)} gelas 250ml)\n_Patokan umum 33ml/kg berat badan, tambah bila aktivitas tinggi atau cuaca panas._`)
    }
    if (command === 'hitungolahraga') {
      const [jenis, berat, menit] = [(args[0] || '').toLowerCase(), num(args[1]), num(args[2])]
      if (!MET[jenis] || !Number.isFinite(berat) || !Number.isFinite(menit) || berat <= 0 || menit <= 0) return reply(`${B('KALORI OLAHRAGA')}\nFormat: ${p}hitungolahraga <jenis> <berat kg> <menit>\nJenis: ${Object.keys(MET).join(', ')}\nContoh: ${p}hitungolahraga lari 65 30`)
      const kalori = MET[jenis] * 3.5 * berat / 200 * menit
      return reply(`${B('KALORI OLAHRAGA')}\n${jenis} selama ${menit} menit (berat ${berat}kg)\n\nKalori terbakar (perkiraan MET) : *${Math.round(kalori)} kkal*`)
    }
    if (command === 'hitungtidur') {
      const umur = num(args[0])
      if (!Number.isFinite(umur) || umur <= 0 || umur > 120) return reply(`${B('KEBUTUHAN TIDUR')}\nFormat: ${p}hitungtidur <umur tahun>\nContoh: ${p}hitungtidur 25`)
      const r = umur <= 2 ? [11, 14] : umur <= 5 ? [10, 13] : umur <= 13 ? [9, 11] : umur <= 17 ? [8, 10] : umur <= 64 ? [7, 9] : [7, 8]
      return reply(`${B('KEBUTUHAN TIDUR')} (rekomendasi umum)\nUmur ${umur} tahun → *${r[0]}–${r[1]} jam per hari*\n_Patokan umum, kebutuhan tiap orang bisa berbeda._`)
    }
    if (command === 'jarakdua') {
      const [lat1, lon1, lat2, lon2] = args.map(num)
      if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return reply(`${B('JARAK DUA TITIK')}\nFormat: ${p}jarakdua <lat1> <lon1> <lat2> <lon2>\nContoh: ${p}jarakdua -6.2 106.8 -7.0 110.4  (Jakarta - Semarang, kira-kira)`)
      const Rm = 6371, toRad = (d) => d * Math.PI / 180
      const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
      const jarak = Rm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return reply(`${B('JARAK DUA TITIK')} (garis lurus)\n(${lat1}, ${lon1}) → (${lat2}, ${lon2})\n\nJarak : *${jarak.toFixed(1)} km*\n_Jarak udara (haversine), bukan jarak tempuh jalan._`)
    }
    if (command === 'estimasiwaktu') {
      const [jarak, kecepatan] = [num(args[0]), num(args[1])]
      if (!Number.isFinite(jarak) || !Number.isFinite(kecepatan) || jarak <= 0 || kecepatan <= 0) return reply(`${B('ESTIMASI WAKTU TEMPUH')}\nFormat: ${p}estimasiwaktu <jarak km> <kecepatan km/jam>\nContoh: ${p}estimasiwaktu 120 60`)
      const jam = jarak / kecepatan, h = Math.floor(jam), mn = Math.round((jam - h) * 60)
      return reply(`${B('ESTIMASI WAKTU TEMPUH')}\nJarak ${jarak} km @ ${kecepatan} km/jam\n\nEstimasi : *${h > 0 ? h + ' jam ' : ''}${mn} menit*`)
    }
    if (command === 'kecepatanrata') {
      const [jarak, jam] = [num(args[0]), num(args[1])]
      if (!Number.isFinite(jarak) || !Number.isFinite(jam) || jarak <= 0 || jam <= 0) return reply(`${B('KECEPATAN RATA-RATA')}\nFormat: ${p}kecepatanrata <jarak km> <waktu jam>\nContoh: ${p}kecepatanrata 150 2.5`)
      return reply(`${B('KECEPATAN RATA-RATA')}\nJarak ${jarak} km ditempuh dalam ${jam} jam\n\nKecepatan rata-rata : *${(jarak / jam).toFixed(1)} km/jam*`)
    }
  },
}
