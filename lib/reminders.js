// Pengingat: disimpan di data/db.json, dicek tiap 15 detik (tetap jalan setelah restart)
const db = require('./db')

const socks = []
let timer = null
const pick = jid => (socks.find(s => s.owns?.(jid)) || socks.find(s => !s.owns)) // sock yang memiliki chat itu

const list = () => db.get('reminders', [])

function add(r) {
  const all = list()
  all.push(r)
  db.set('reminders', all)
}

async function tick() {
  if (!socks.length) return
  const now = Date.now()
  const all = list()
  const due = all.filter(r => r.at <= now)
  if (!due.length) return
  db.set('reminders', all.filter(r => r.at > now))
  for (const r of due) {
    try {
      const sock = pick(r.jid)
      if (!sock) continue
      await sock.sendMessage(r.jid, { text: `⏰ *PENGINGAT* @${String(r.who).split('@')[0]}\n${r.text}`, mentions: [r.who] })
    } catch (e) {
      console.log('[reminder] gagal kirim:', e?.message || e)
    }
  }
}

function attach(s) {
  if (!socks.includes(s)) socks.push(s)
  if (!timer) timer = setInterval(() => tick().catch(() => {}), 15000)
}

function parseDuration(s) {
  const m = String(s || '').match(/^(\d+)\s*(detik|dtk|s|menit|mnt|m|jam|j|hari|h)$/i)
  if (!m) return 0
  const n = Number(m[1])
  const u = m[2].toLowerCase()
  if (['detik', 'dtk', 's'].includes(u)) return n * 1000
  if (['menit', 'mnt', 'm'].includes(u)) return n * 60000
  if (['jam', 'j'].includes(u)) return n * 3600000
  return n * 86400000
}

module.exports = { add, attach, parseDuration, list, tick }
