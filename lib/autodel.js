// Hapus pesan bot otomatis (WhatsApp & Telegram). Durasi bisa diatur owner lewat #autodelete, tersimpan di data/db.json.
const db = require('./db')

const cfgOf = () => require('../config')
function load() {
  const d = db.get('autodel', {}) || {}
  const tg = cfgOf().telegram || {}
  return {
    wa: d.wa ?? 3600,
    tg: d.tg ?? (tg.autoDelete === false ? 0 : Number(tg.menuDeleteSec ?? 3600)),
    scope: d.scope === 'all' ? 'all' : 'menu' // WhatsApp: hanya menu, atau semua balasan bot
  }
}
const sec = p => Math.max(0, Number(load()[p === 'tg' || p === 'telegram' ? 'tg' : 'wa']) || 0)
const scope = () => load().scope
function set(patch) { db.set('autodel', { ...(db.get('autodel', {}) || {}), ...patch }) }

// "30" -> 30 menit, "45s", "10m", "2j"/"2h", "off" -> 0. Gagal -> null
function parse(s) {
  s = String(s || '').trim().toLowerCase()
  if (['off', 'mati', 'nonaktif', '0'].includes(s)) return 0
  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*(s|dtk|detik|m|mnt|menit|h|j|jam)?$/)
  if (!m) return null
  const n = parseFloat(m[1].replace(',', '.'))
  const u = m[2] || 'm'
  const mult = /^(s|dtk|detik)$/.test(u) ? 1 : /^(h|j|jam)$/.test(u) ? 3600 : 60
  const v = Math.round(n * mult)
  return v > 0 && v <= 7 * 86400 ? v : null
}
function fmt(s) {
  if (!s) return 'mati'
  if (s % 3600 === 0) return s / 3600 + ' jam'
  if (s % 60 === 0) return s / 60 + ' menit'
  return s + ' detik'
}

// jadwalkan penghapusan pesan WhatsApp milik bot
function schedule(sock, jid, key) {
  const s = sec('wa')
  if (!s || !key?.id) return
  const t = setTimeout(() => { sock.sendMessage(jid, { delete: key }).catch(() => {}) }, s * 1000)
  t.unref?.()
}

module.exports = { load, sec, scope, set, parse, fmt, schedule }
