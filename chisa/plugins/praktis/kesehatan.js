/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kalkulator kesehatan umum: bmi, air, tdee, detak, tidur. Hanya perkiraan, bukan saran medis.
const { B } = require('../../lib/style')
const num = (s) => { const n = parseFloat(String(s ?? '').replace(',', '.')); return Number.isFinite(n) ? n : NaN }
const FOOT = '\n\n_Perkiraan umum, bukan pengganti saran dokter/ahli gizi._'
const hhmm = (min) => { min = ((min % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0') }
const ACT = { 1: ['Jarang bergerak', 1.2], 2: ['Olahraga ringan 1-3x/minggu', 1.375], 3: ['Olahraga sedang 3-5x/minggu', 1.55], 4: ['Olahraga berat 6-7x/minggu', 1.725], 5: ['Sangat aktif / kerja fisik', 1.9] }

module.exports = {
  name: 'bmi', alias: ['air', 'tdee', 'detak', 'tidur', 'kalori'], category: 'praktis', noLimit: true, cmds: ['bmi', 'air', 'tdee', 'detak', 'tidur'],
  desc: 'Kesehatan: bmi, kebutuhan air, tdee, zona detak jantung, jam tidur ideal',
  run: async ({ command, args, prefix, reply }) => {
    const bad = (u) => reply(`✕ Format salah.\nContoh: ${prefix}${u}`)
    if (command === 'bmi') {
      const w = num(args[0]), h = num(args[1])
      if (!(w >= 10 && w <= 400) || !(h >= 80 && h <= 250)) return bad('bmi 60 170   (berat kg, tinggi cm)')
      const v = w / Math.pow(h / 100, 2), cat = v < 18.5 ? 'Berat kurang' : v < 25 ? 'Normal' : v < 30 ? 'Berat berlebih' : 'Obesitas'
      const lo = 18.5 * Math.pow(h / 100, 2), hi = 24.9 * Math.pow(h / 100, 2)
      return reply(`${B('BMI')}\nBMI kamu : *${v.toFixed(1)}* (${cat})\nBerat ideal (BMI normal): ${lo.toFixed(1)} - ${hi.toFixed(1)} kg\n_Kategori WHO. Otot padat bisa membuat BMI tinggi tanpa kelebihan lemak._${FOOT}`)
    }
    if (command === 'air') {
      const w = num(args[0]); if (!(w >= 10 && w <= 300)) return bad('air 60   (berat kg)')
      return reply(`${B('KEBUTUHAN AIR')}\nBerat ${w} kg → sekitar *${(w * 0.033).toFixed(1)} liter*/hari (±${Math.round(w * 0.033 * 1000 / 250)} gelas 250 ml)\n_Tambah saat cuaca panas, olahraga, atau sakit demam._${FOOT}`)
    }
    if (command === 'tdee' || command === 'kalori') {
      const sx = (args[0] || '').toLowerCase()[0], age = num(args[1]), w = num(args[2]), h = num(args[3]), ac = ACT[parseInt(args[4], 10) || 2]
      if (!['l', 'p'].includes(sx) || !(age >= 15 && age <= 90) || !(w >= 30 && w <= 300) || !(h >= 120 && h <= 230))
        return bad('tdee l 25 65 170 3   (l/p, usia, berat kg, tinggi cm, aktivitas 1-5)\n1 jarang bergerak • 2 ringan • 3 sedang • 4 berat • 5 sangat aktif')
      const bmr = 10 * w + 6.25 * h - 5 * age + (sx === 'l' ? 5 : -161), tdee = bmr * ac[1]
      return reply(`${B('KEBUTUHAN ENERGI')} (Mifflin-St Jeor)\n┣ ${B('BMR')} : ${Math.round(bmr)} kkal/hari\n┣ ${B('Aktivitas')} : ${ac[0]}\n┗ ${B('TDEE')} : *${Math.round(tdee)} kkal/hari*\n\nUntuk menjaga berat badan konsumsi sekitar angka TDEE. Perubahan target sebaiknya bertahap dan dikonsultasikan dengan ahli gizi.${FOOT}`)
    }
    if (command === 'detak') {
      const a = num(args[0]); if (!(a >= 5 && a <= 100)) return bad('detak 25   (usia)')
      const mx = 220 - a, z = (lo, hi) => `${Math.round(mx * lo)}-${Math.round(mx * hi)} bpm`
      return reply(`${B('ZONA DETAK JANTUNG')} (usia ${a})\nMaks perkiraan: *${mx} bpm*\n┣ Zona 1 pemanasan (50-60%): ${z(.5, .6)}\n┣ Zona 2 pembakaran lemak (60-70%): ${z(.6, .7)}\n┣ Zona 3 aerobik (70-80%): ${z(.7, .8)}\n┣ Zona 4 ambang (80-90%): ${z(.8, .9)}\n┗ Zona 5 maksimal (90-100%): ${z(.9, 1)}${FOOT}`)
    }
    // tidur: .tidur 05:30 -> jam tidur;  .tidur sekarang -> jam bangun bila tidur sekarang
    const arg = (args[0] || '').toLowerCase()
    if (arg === 'sekarang' || arg === 'now') {
      const d = new Date(Date.now() + 7 * 3600e3), nowMin = d.getUTCHours() * 60 + d.getUTCMinutes()
      return reply(`${B('TIDUR SEKARANG')} (${hhmm(nowMin)} WIB)\nSiklus tidur ±90 menit, butuh ±15 menit untuk terlelap. Bangun di salah satu jam ini terasa lebih segar:\n` + [4, 5, 6].map(c => `• ${hhmm(nowMin + 15 + c * 90)}  (${c} siklus = ${c * 1.5} jam)`).join('\n') + FOOT)
    }
    const mt = arg.match(/^(\d{1,2})[:.](\d{2})$/)
    if (!mt || +mt[1] > 23 || +mt[2] > 59) return bad('tidur 05:30   (jam bangun)  atau  ' + prefix + 'tidur sekarang')
    const wake = +mt[1] * 60 + +mt[2]
    return reply(`${B('JAM TIDUR IDEAL')} (bangun ${arg})\nSiklus ±90 menit + 15 menit untuk terlelap. Mulai tidur sekitar:\n` + [6, 5, 4].map(c => `• ${hhmm(wake - 15 - c * 90)}  (${c} siklus = ${c * 1.5} jam)`).join('\n') + '\n_Dewasa umumnya butuh 7-9 jam._' + FOOT)
  },
}
