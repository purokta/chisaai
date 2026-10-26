/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Hubungan (affinity) pemain dengan NPC + NPC aktif
const fs = require('fs')
const path = require('path')
const FILE = path.join(global.dionyData, 'npc.json')
let db = { rel: {}, active: {} }
try { db = Object.assign(db, JSON.parse(fs.readFileSync(FILE, 'utf8'))) } catch {}
let timer = null
function save() { if (timer) return; timer = setTimeout(() => { timer = null; try { fs.writeFileSync(FILE, JSON.stringify(db)) } catch {} }, 2000) }
process.on('exit', () => { try { fs.writeFileSync(FILE, JSON.stringify(db)) } catch {} })

const LEVELS = [
  { min: 0,   name: 'Orang Asing',       tone: 'masih canggung dan sopan, belum akrab' },
  { min: 20,  name: 'Kenalan',           tone: 'mulai ramah dan terbuka' },
  { min: 60,  name: 'Teman',             tone: 'akrab seperti teman, boleh bercanda' },
  { min: 120, name: 'Sahabat',           tone: 'sangat akrab, peduli, sering bercanda dan mengingat hal kecil' },
  { min: 200, name: 'Orang Kepercayaan', tone: 'sangat dekat; kamu mempercayai pemain dan bicara lebih jujur serta personal' },
  { min: 320, name: 'Sahabat Sejati',    tone: 'ikatan terdalam, hangat, setia, dan selalu mendukung pemain' },
]
const levelOf = (pts) => { let i = 0; LEVELS.forEach((l, k) => { if (pts >= l.min) i = k }); return i }
const day = () => { try { return new Intl.DateTimeFormat('en-CA', { timeZone: global.settingsDefault?.timezone || 'Asia/Jakarta' }).format(new Date()) } catch { return new Date().toISOString().slice(0, 10) } }

function rec(jid, id) {
  const u = (db.rel[jid] = db.rel[jid] || {}); const r = (u[id] = u[id] || { pts: 0, day: '', t: 0, g: 0, talks: 0 })
  if (r.day !== day()) { r.day = day(); r.t = 0; r.g = 0 }
  return r
}
function get(jid, id) {
  const r = rec(jid, id), idx = levelOf(r.pts), nx = LEVELS[idx + 1]
  return { pts: r.pts, idx, name: LEVELS[idx].name, tone: LEVELS[idx].tone, next: nx ? nx.min : null, talks: r.talks }
}
// kind: 't' (obrolan/layanan, batas 25/hari) | 'g' (hadiah, batas 80/hari). Mengembalikan {gained, up}
function add(jid, id, n, kind = 't') {
  const r = rec(jid, id), cap = kind === 'g' ? 80 : 25, before = levelOf(r.pts)
  const g = Math.max(0, Math.min(n, cap - r[kind])); r[kind] += g; r.pts += g; if (kind === 't') r.talks++
  save(); const after = levelOf(r.pts)
  return { gained: g, up: after > before ? after : null, capped: g < n }
}
const lv = (jid, id) => get(jid, id).idx
const setActive = (jid, id) => { db.active[jid] = id; save() }
const getActive = (jid) => db.active[jid] || null
const all = (jid) => Object.entries(db.rel[jid] || {}).map(([id, r]) => ({ id, pts: r.pts, idx: levelOf(r.pts) })).sort((a, b) => b.pts - a.pts)

module.exports = { db, LEVELS, get, add, lv, setActive, getActive, all, levelOf }
