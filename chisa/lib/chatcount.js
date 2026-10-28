/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Penghitung pesan per anggota per grup (untuk .topchat). Disimpan di lib/database/chatcount.json (disimpan tiap 30 detik).
const fs = require('fs'), path = require('path')
const FILE = path.join(global.chisaData, 'chatcount.json')
let db = null, dirty = false, timer = null
const load = () => { if (db) return db; try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { db = {} } return db }
function flush() { if (!dirty) return; dirty = false; try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)) } catch (e) { console.log('[chatcount] gagal simpan:', e.message) } }
function hit(chat, jid) {
  const d = load(), g = (d[chat] = d[chat] || {}), u = (g[jid] = g[jid] || { n: 0, t: 0 })
  u.n++; u.t = Date.now(); dirty = true
  if (!timer) { timer = setInterval(flush, 30000); if (timer.unref) timer.unref() }
}
const top = (chat, n = 10) => Object.entries(load()[chat] || {}).sort((a, b) => b[1].n - a[1].n).slice(0, n).map(([jid, v]) => ({ jid, n: v.n, t: v.t }))
const total = (chat) => Object.values(load()[chat] || {}).reduce((s, v) => s + v.n, 0)
const reset = (chat) => { const d = load(); const had = !!d[chat]; delete d[chat]; dirty = true; flush(); return had }
process.on('exit', flush)
module.exports = { hit, top, total, reset, flush }
