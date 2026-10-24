// Info waktu, bot, dan server untuk menu / #status
const os = require('os')
const fs = require('fs')
const config = require('../config')

const start = Date.now()

function fmtDur(sec) {
  sec = Math.floor(sec)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (d) return `${d} hari ${h} jam`
  if (h) return `${h} jam ${m} mnt`
  if (m) return `${m} mnt ${s} dtk`
  return `${s} dtk`
}

function now() {
  const tz = config.menu?.timezone || 'Asia/Jakarta'
  const lbl = config.menu?.tzLabel || 'WIB'
  const d = new Date()
  const tanggal = new Intl.DateTimeFormat('id-ID', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  const jam = new Intl.DateTimeFormat('id-ID', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d).replace('.', ':')
  const pendek = new Intl.DateTimeFormat('id-ID', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(d).replace('.', '')
  return { tanggal, pendek, jam: `${jam} ${lbl}` }
}

function memInfo() {
  let total = os.totalmem()
  let free = os.freemem()
  try {
    const t = fs.readFileSync('/proc/meminfo', 'utf8')
    const g = k => Number((t.match(new RegExp(k + ':\\s+(\\d+)')) || [])[1]) * 1024
    if (g('MemTotal')) total = g('MemTotal')
    if (g('MemAvailable')) free = g('MemAvailable')
  } catch {}
  return { total, used: total - free }
}

const gb = n => (n / 1024 ** 3).toFixed(1) + ' GB'
const mb = n => Math.round(n / 1024 ** 2) + ' MB'

function server() {
  const mem = memInfo()
  const pct = Math.round((mem.used / mem.total) * 100)
  const isTermux = !!process.env.TERMUX_VERSION || String(process.env.PREFIX || '').includes('termux')
  const plat = isTermux ? 'Termux (Android)' : os.type()
  return {
    platform: plat,
    ram: `${gb(mem.used)} / ${gb(mem.total)} (${pct}%)`,
    ramPct: pct,
    node: process.version,
    botRam: mb(process.memoryUsage().rss),
    cpu: (os.cpus() || []).length + ' core',
    up: fmtDur(os.uptime())
  }
}

// cuaca singkat untuk menu (cache 15 menit, gagal = diam saja)
const http = require('./http')
const WMO = { 0: 'Cerah ☀️', 1: 'Cerah berawan 🌤️', 2: 'Berawan ⛅', 3: 'Mendung ☁️', 45: 'Berkabut 🌫️', 48: 'Berkabut 🌫️', 51: 'Gerimis 🌦️', 53: 'Gerimis 🌦️', 55: 'Gerimis 🌦️', 61: 'Hujan ringan 🌧️', 63: 'Hujan 🌧️', 65: 'Hujan lebat 🌧️', 80: 'Hujan lokal 🌦️', 81: 'Hujan lokal 🌧️', 82: 'Hujan deras ⛈️', 95: 'Badai petir ⛈️', 96: 'Badai petir ⛈️', 99: 'Badai petir ⛈️' }
let wCache = { at: 0, city: '', text: '', short: '' }
let wFail = 0 // kalau gagal, jangan coba lagi sampai waktu ini
let wBusy = null
async function weather() {
  const city = config.menu?.city || 'Jakarta'
  if (wCache.city === city && Date.now() - wCache.at < 15 * 60000) return wCache.text
  if (Date.now() < wFail) return wCache.city === city ? wCache.text : ''
  if (wBusy) return wBusy
  wBusy = fetchWeather(city).finally(() => { wBusy = null })
  return wBusy
}
async function fetchWeather(city) {
  try {
    const g = await http.getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id`, { timeout: 4000 })
    const p = g.results?.[0]
    if (!p) return ''
    const w = await http.getJson(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,weather_code&timezone=auto`, { timeout: 4000 })
    const c = w.current
    const desc = WMO[c.weather_code] || 'Cuaca'
    const icon = (desc.match(/\p{Extended_Pictographic}\uFE0F?/u) || ['🌡️'])[0]
    wCache = { at: Date.now(), city, text: `${p.name}: ${desc} ${Math.round(c.temperature_2m)}°C`, short: `${icon} ${Math.round(c.temperature_2m)}°C` }
    return wCache.text
  } catch {
    wFail = Date.now() + 5 * 60000 // gagal: istirahat 5 menit, menu tidak ikut menunggu
    return wCache.city === city ? wCache.text : ''
  }
}

// segarkan di belakang layar (tidak ditunggu)
const refreshWeather = () => { weather().catch(() => {}) }

const botUptime = () => fmtDur((Date.now() - start) / 1000)

const cachedWeather = () => wCache.text
const cachedWeatherShort = () => wCache.short
const _reset = () => { wCache = { at: 0, city: '', text: '', short: '' }; wFail = 0; wBusy = null }
module.exports = { _reset, refreshWeather, cachedWeatherShort, cachedWeather, now, server, botUptime, fmtDur, weather }
