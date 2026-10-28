/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kalkulator pace lari: pace per km/mil, laju km/jam, dan prediksi jarak lain (rumus Riegel). Perkiraan umum.
//   .pace <jarak> <waktu>     contoh: .pace 5 28:30  •  .pace 10k 55:10  •  .pace 21k 1:59:30
const { B } = require('../../lib/style')
const pad = (n) => String(Math.floor(n)).padStart(2, '0')
const fmt = (sec) => { sec = Math.round(sec); const h = Math.floor(sec / 3600), mn = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${h}:${pad(mn)}:${pad(s)}` : `${mn}:${pad(s)}` }
const DIST = { '5k': 5, '10k': 10, '21k': 21.0975, hm: 21.0975, half: 21.0975, '42k': 42.195, fm: 42.195, full: 42.195, maraton: 42.195, marathon: 42.195 }
function parseDist(s) { s = String(s || '').toLowerCase().replace(',', '.'); if (DIST[s]) return DIST[s]; const m = s.match(/^(\d+(?:\.\d+)?)(km|k)?$/); return m ? parseFloat(m[1]) : NaN }
function parseTime(s) {
  s = String(s || '').toLowerCase().replace(/\s/g, ''); let m
  if ((m = s.match(/^(\d+):(\d{1,2}):(\d{1,2})$/))) return +m[1] * 3600 + +m[2] * 60 + +m[3]
  if ((m = s.match(/^(\d+):(\d{1,2})$/))) return +m[1] * 60 + +m[2]
  if ((m = s.match(/^(?:(\d+)j)?(?:(\d+)m)?(?:(\d+)s)?$/)) && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0)
  return NaN
}
module.exports = {
  name: 'pace', alias: ['lari', 'fitnes'], category: 'praktis', noLimit: true, cmds: ['pace'],
  desc: 'Kalkulator pace lari: pace per km/mil, laju km/jam, dan prediksi 5K/10K/HM/Marathon',
  run: async ({ args, prefix, reply }) => {
    const d = parseDist(args[0]), t = parseTime(args[1])
    if (!(d > 0 && d <= 500) || !(t > 0)) return reply(`🏃 ${B('PACE LARI')}\n${prefix}pace 5 28:30\n${prefix}pace 10k 55:10\n${prefix}pace 21k 1:59:30\n_Jarak: angka km, 5k, 10k, 21k/hm, 42k/fm. Waktu: mm:ss, j:mm:ss, atau 28m30s._`)
    const pk = t / d, kmh = d / (t / 3600)
    let out = `🏃 ${B('PACE LARI')}\n┣ Jarak : ${+d.toFixed(3)} km\n┣ Waktu : ${fmt(t)}\n┣ Pace  : *${fmt(pk)} /km*  (${fmt(pk * 1.609344)} /mil)\n┗ Laju  : ${kmh.toFixed(2)} km/jam\n\n${B('Prediksi (rumus Riegel)')}\n`
    for (const [n, km] of [['5K', 5], ['10K', 10], ['Half Marathon', 21.0975], ['Marathon', 42.195]]) if (Math.abs(km - d) > 0.05) out += `• ${n.padEnd(14)} ${fmt(t * Math.pow(km / d, 1.06))}\n`
    return reply(out + '_Perkiraan kasar; hasil nyata bergantung latihan, medan, dan cuaca._')
  },
}
