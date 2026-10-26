/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// lib/menuinfo.js — blok "INFO LIVE" di bawah thumbnail .menu (v4.17):
// cuaca kota + tanggal & jam Indonesia (WIB/WITA/WIT) + Hijriah. Bentuknya sengaja ringkas, seperti strip
// "Dionysus ✓ • Status" di atas thumbnail.
//
// Pengaman: cuaca diambil dari Open-Meteo (gratis, tanpa key) dengan batas waktu 3 detik dan cache 15 menit per kota.
// Bila jaringan gagal, baris cuaca memakai cache lama atau dihilangkan — .menu TIDAK PERNAH tertahan atau gagal karenanya.
// Kota: kota tersimpan milik pengguna (.setkota) -> setting `menucity` -> Jakarta. Matikan: .set menuinfo off
const D = require('./daily')

const TTL = 15 * 60 * 1000, TIMEOUT = 3000
const cache = new Map(), inflight = new Map()

const WMO = (c) => c === 0 ? ['Cerah', '☀️'] : c === 1 ? ['Cerah berawan', '🌤️'] : c === 2 ? ['Berawan', '⛅'] : c === 3 ? ['Mendung', '☁️'] : [45, 48].includes(c) ? ['Berkabut', '🌫️']
  : c >= 51 && c <= 57 ? ['Gerimis', '🌦️'] : (c >= 61 && c <= 67) || (c >= 80 && c <= 82) ? ['Hujan', '🌧️'] : c >= 71 && c <= 77 ? ['Salju', '❄️'] : c >= 95 ? ['Badai petir', '⛈️'] : ['Cuaca', '🌡️']

const ZONES = [['WIB', 'Asia/Jakarta'], ['WITA', 'Asia/Makassar'], ['WIT', 'Asia/Jayapura']]
const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function pickCity(name) {
  const tried = [name, safeSetting('menucity'), 'Jakarta']
  for (const q of tried) { const c = q && D.findCity(q); if (c) return c }
  return D.findCity('jakarta')
}
function safeSetting(k) { try { return require('./settingsdb').get(k) } catch { return undefined } }
function userCity(jid) { try { return jid ? require('./profiledb').get(jid).city : undefined } catch { return undefined } }

async function fetchWeather(c) {
  const axios = require('axios')
  const r = await axios.get('https://api.open-meteo.com/v1/forecast', { timeout: TIMEOUT, params: { latitude: c.lat, longitude: c.lng, timezone: 'auto', wind_speed_unit: 'kmh',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m', daily: 'precipitation_probability_max', forecast_days: 1 } })
  const cur = r.data && r.data.current; if (!cur || typeof cur.temperature_2m !== 'number') throw new Error('data cuaca kosong')
  return { temp: cur.temperature_2m, feels: cur.apparent_temperature, hum: cur.relative_humidity_2m, wind: cur.wind_speed_10m, code: cur.weather_code,
    rain: r.data.daily && r.data.daily.precipitation_probability_max ? r.data.daily.precipitation_probability_max[0] : null, at: Date.now() }
}
// -> data cuaca | null. Tidak pernah melempar error dan tidak pernah lebih lama dari ±TIMEOUT.
async function weather(c) {
  const hit = cache.get(c.key)
  if (hit && Date.now() - hit.at < TTL) return hit
  if (!inflight.has(c.key)) inflight.set(c.key, fetchWeather(c).then(w => { cache.set(c.key, w); return w }).catch(e => { console.log('[menuinfo] cuaca gagal:', e.message); return null }).finally(() => inflight.delete(c.key)))
  const w = await inflight.get(c.key)
  return w || hit || null   // gagal -> pakai cache lama (kalau ada)
}

const hm = (p) => `${D.pad(p.hh)}.${D.pad(p.mm)}`
function weatherLines(c, w) {
  if (!w) return []
  const [name, emo] = WMO(w.code), r = (v) => Math.round(v)
  const extra = [`💧 ${r(w.hum)}%`, `💨 ${r(w.wind)} km/j`]; if (typeof w.rain === 'number') extra.push(`🌧️ ${r(w.rain)}%`)
  return [`${emo} ${r(w.temp)}°C ${name} • terasa ${r(w.feels)}°C`, extra.join(' • ')]
}
// teks sinkron untuk bagian waktu (dipisah agar mudah diuji)
function timeLines(date = new Date()) {
  const tz = D.tzOf(), p = D.parts(date, tz), o = { y: p.y, m: p.m, d: p.d }
  const lines = [`🇮🇩 ${D.DAYS[p.dow]}, ${p.d} ${SHORT_MONTH[p.m - 1]} ${p.y}`, '🕙 ' + ZONES.map(([n, z]) => `${hm(D.parts(date, z))} ${n}`).join(' • ')]
  try { lines.push(`🌙 ${D.hijri(o).text}`) } catch {}
  return lines
}

// teks blok siap pakai (tanpa kutipan '>' — pembungkus kutipan dipasang oleh menuui.caption)
async function block({ jid, city } = {}) {
  const c = pickCity(city || userCity(jid)), w = await weather(c)
  const title = `╭━━〔 INFO LIVE ✓ • ${c.name.toUpperCase()} 〕`
  return [title, ...[...weatherLines(c, w), ...timeLines()].map(l => '┃ ' + l), '╰━━━━━━━━━━━━━━━━━━'].join('\n')
}
module.exports = { block, weather, weatherLines, timeLines, pickCity, WMO, _cache: cache }
