/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KUMO — Pengamat Cuaca (Open-Meteo, gratis tanpa API key)
const axios = require('axios'), D = require('../../lib/daily'), NU = require('../../lib/npcutil'), P = require('../../lib/profiledb'), G = require('../../lib/geo')
const WMO = (c) => c === 0 ? ['Cerah', '☀️'] : c === 1 ? ['Cerah berawan', '🌤️'] : c === 2 ? ['Berawan sebagian', '⛅'] : c === 3 ? ['Mendung', '☁️'] : [45, 48].includes(c) ? ['Berkabut', '🌫️'] : c >= 51 && c <= 57 ? ['Gerimis', '🌦️'] : c >= 61 && c <= 65 ? ['Hujan', '🌧️'] : c === 66 || c === 67 ? ['Hujan es', '🌧️'] : c >= 71 && c <= 77 ? ['Salju', '❄️'] : c >= 80 && c <= 82 ? ['Hujan lebat', '🌧️'] : c === 85 || c === 86 ? ['Salju lebat', '❄️'] : c >= 95 ? ['Badai petir', '⛈️'] : ['Tidak diketahui', '🌡️']

async function forecast(c) {
  const r = await axios.get('https://api.open-meteo.com/v1/forecast', { timeout: 12000, params: { latitude: c.lat, longitude: c.lng, timezone: 'auto', forecast_days: 3, wind_speed_unit: 'kmh',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum' } })
  return r.data
}
const advice = (cur, d0) => {
  const a = []; const rain = d0.precipitation_probability_max[0]
  if (rain >= 60 || [95, 96, 99].includes(cur.weather_code)) a.push('Bawa payung/jas hujan' + ([95, 96, 99].includes(cur.weather_code) ? ' dan hindari tempat terbuka saat petir' : ''))
  else if (rain >= 35) a.push('Ada kemungkinan hujan, siapkan payung lipat')
  if (cur.apparent_temperature >= 33) a.push('Panas terik: minum cukup air & pakai tabir surya'); else if (cur.apparent_temperature <= 18) a.push('Cukup dingin, pakai jaket')
  if (cur.wind_speed_10m >= 35) a.push('Angin kencang, hati-hati berkendara')
  return a.length ? a.join('. ') + '.' : 'Cuaca bersahabat, selamat beraktivitas!'
}

module.exports = {
  name: 'cekcuaca',
  alias: ['cekcuaca', 'prakiraan'],
  category: 'dunia',
  cmds: [],
  desc: 'Cuaca sekarang & prakiraan 3 hari (Kumo)',
  run: async ({ m, text, prefix, reply }) => {
    const jid = m.sender, q = text.trim() || P.get(jid).city
    if (!q) return reply(`${NU.head('kumo', jid)}\n\nKota mana yang mau dicek?\nContoh: ${prefix}cuaca bandung\nSimpan kota default: ${prefix}setkota <kota>`)
    const c = await G.resolve(q); if (!c) return reply(`${NU.head('kumo', jid)}\n\nKota "${q}" tidak ketemu. Coba nama lain ya.`)
    let w; try { w = await forecast(c) } catch (e) { console.log('[cuaca]', e.message); return reply(`${NU.head('kumo', jid)}\n\nAwan-awanku lagi susah dihubungi (server cuaca tidak merespons). Coba lagi sebentar ya.`) }
    const cur = w.current, d = w.daily, [cn, ce] = WMO(cur.weather_code)
    const day = (i) => { const [n, e] = WMO(d.weather_code[i]), dt = d.time[i].split('-').map(Number); return `${e} *${i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : D.DAYS[D.dowOf(dt[0], dt[1], dt[2])]}* — ${n}, ${Math.round(d.temperature_2m_min[i])}–${Math.round(d.temperature_2m_max[i])}°C, hujan ${d.precipitation_probability_max[i] ?? 0}%` }
    return reply(`${NU.head('kumo', jid)}\n\n*CUACA — ${c.name}*\n\n${ce} *${cn}* ${Math.round(cur.temperature_2m)}°C (terasa ${Math.round(cur.apparent_temperature)}°C)\n💧 Kelembapan ${cur.relative_humidity_2m}%  •  💨 Angin ${Math.round(cur.wind_speed_10m)} km/j  •  🌧️ ${cur.precipitation} mm\n\n${day(0)}\n${day(1)}\n${day(2)}\n\n🧥 ${advice(cur, d)}\n\n_Data: Open-Meteo. Untuk peringatan resmi cek BMKG._${NU.bump(jid, 'kumo', 2)}`)
  },
}
