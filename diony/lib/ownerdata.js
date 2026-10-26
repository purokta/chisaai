/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Dionysus Owner Insights — agregasi aktivitas tanpa menyimpan isi pesan.
// Menyimpan: hitungan pesan/perintah, tren harian, jam sibuk, profil ringkas per-user (nama, pertama/terakhir terlihat,
// perintah favorit), error plugin, serta catatan & tag yang ditulis owner. Isi percakapan TIDAK pernah disimpan.
const fs = require('fs')
const path = require('path')
const FILE = path.join(global.dionyData, 'ownerdata.json')
const CATS = ['group', 'game', 'rpg', 'fun', 'other']
const DAY = 86400000
const KEEP_DAYS = 60            // riwayat harian yang disimpan
const KEEP_ERRORS = 40          // error terakhir yang disimpan
const MAX_USER_CMDS = 25        // perintah favorit per user (yang terkecil dibuang)
const TZ = () => (global.settingsDefault && global.settingsDefault.timezone) || 'Asia/Jakarta'

const blank = () => ({
  version: 2, since: Date.now(),
  totals: { messages: 0, commands: 0, errors: 0 },
  categories: { group: 0, game: 0, rpg: 0, fun: 0, other: 0 },
  hours: Array(24).fill(0), days: {}, groups: {}, users: {}, commands: {}, errors: [],
})
let db, timer

function load() {
  if (db) return db
  try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { db = blank() }
  const b = blank()
  db.version = 2
  db.since = db.since || b.since
  db.totals = Object.assign({ messages: 0, commands: 0, errors: 0 }, db.totals || {})
  db.categories = Object.assign({ group: 0, game: 0, rpg: 0, fun: 0, other: 0 }, db.categories || {})
  if (!Array.isArray(db.hours) || db.hours.length !== 24) db.hours = b.hours
  db.days = db.days || {}; db.groups = db.groups || {}; db.users = db.users || {}; db.commands = db.commands || {}
  db.errors = Array.isArray(db.errors) ? db.errors : []
  return db
}
function flush() {
  if (!db) return
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    const tmp = FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(db))
    fs.renameSync(tmp, FILE)
  } catch (e) { console.log('[ownerdata] gagal simpan:', e.message) }
}
function saveSoon() { clearTimeout(timer); timer = setTimeout(flush, 1200); if (timer.unref) timer.unref() }

// ── waktu (zona waktu bot) ──
const dayKey = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA', { timeZone: TZ() })          // YYYY-MM-DD
const hourOf = (t = Date.now()) => Number(new Date(t).toLocaleString('en-GB', { timeZone: TZ(), hour: '2-digit', hour12: false })) % 24
function today() {
  const d = load(), k = dayKey()
  const r = d.days[k] || (d.days[k] = { m: 0, c: 0, e: 0, n: 0, u: {} })   // m pesan, c perintah, e error, n user baru, u user aktif
  return r
}
function prune() {
  const d = load(), keys = Object.keys(d.days).sort()
  while (keys.length > KEEP_DAYS) delete d.days[keys.shift()]
}

function user(jid) {
  const d = load()
  if (!d.users[jid]) { d.users[jid] = { messages: 0, commands: 0, categories: {}, last: 0, first: Date.now(), name: '', cmds: {}, tag: '', note: '', groups: 0 }; today().n++ }
  const u = d.users[jid]
  if (!u.first) u.first = u.last || Date.now()
  if (!u.cmds) u.cmds = {}
  return u
}
function group(gid) {
  const d = load()
  return d.groups[gid] || (d.groups[gid] = { messages: 0, commands: 0, last: 0 })
}

const GAME_WORDS = /^(gd|gdlive|dashlive|tictactoe|ttt|xo|oxo|tebak|tebakgambar|tebakbendera|tebakwarna|tebakangka|hangman|mastermind|cepatketik|hilo|bj|blackjack|werewolf|wwcreate|wwjoin|wwstart|wwplayers|wwvote|mathrace|archery|reflex|leaderboardgame|topgame|skorku|games?|gamelive|tetris|mines|wordle|memory|flappy|breakout|dino|pin|geodash|pomo|pianolive|slot|roulette|anagram|mathrush|sambungkata|kuis|siapakahaku|gambarlucu|hitungbenda)$/i
function categoryOf(plug, command) {
  const cat = String(plug && plug.category || '').toLowerCase()
  const cmd = String(command || plug && plug.name || '').toLowerCase()
  if (cat === 'group') return 'group'
  if (cat === 'rpg') return 'rpg'
  if (cat === 'fun' && GAME_WORDS.test(cmd)) return 'game'
  if (cat === 'live' && GAME_WORDS.test(cmd)) return 'game'
  if (cat === 'ekstra' && GAME_WORDS.test(cmd)) return 'game'
  if (cat === 'fun') return 'fun'
  return 'other'
}

// ── PENCATATAN ──
function message(m, isGroup) {
  if (!m || !m.sender || m.key && m.key.fromMe) return
  const d = load(), now = Date.now(), u = user(m.sender), t = today()
  u.messages++; u.last = now; d.totals.messages++
  if (m.pushName && m.pushName !== 'no name') u.name = String(m.pushName).slice(0, 40)
  t.m++; t.u[m.sender] = 1; d.hours[hourOf(now)]++
  if (isGroup && m.chat && String(m.chat).endsWith('@g.us')) { const g = group(m.chat); g.messages++; g.last = now }
  saveSoon()
}
function hit({ m, command, plug }) {
  if (!m || !m.sender || m.key && m.key.fromMe) return
  const d = load(), now = Date.now(), cat = categoryOf(plug, command), cmd = String(command || plug && plug.name || 'unknown').toLowerCase()
  d.totals.commands++; d.categories[cat] = (d.categories[cat] || 0) + 1
  const u = user(m.sender); u.commands++; u.last = now; u.categories[cat] = (u.categories[cat] || 0) + 1
  u.cmds[cmd] = (u.cmds[cmd] || 0) + 1
  const ks = Object.keys(u.cmds)
  if (ks.length > MAX_USER_CMDS) { const lo = ks.sort((a, b) => u.cmds[a] - u.cmds[b])[0]; if (lo !== cmd) delete u.cmds[lo] }
  const c = d.commands[cmd] || (d.commands[cmd] = { count: 0, category: cat, last: 0, users: 0 })
  c.count++; c.category = cat; c.last = now
  today().c++
  if (m.chat && String(m.chat).endsWith('@g.us')) { const g = group(m.chat); g.commands++; g.last = now }
  prune(); saveSoon()
}
function error({ m, command, plug, err }) {
  const d = load(); d.totals.errors = (d.totals.errors || 0) + 1; today().e++
  d.errors.push({ t: Date.now(), cmd: String(command || plug && plug.name || '?').toLowerCase(), msg: String(err && err.message || err || '').slice(0, 160), who: m && m.sender || '' })
  if (d.errors.length > KEEP_ERRORS) d.errors.splice(0, d.errors.length - KEEP_ERRORS)
  saveSoon()
}

// ── PEMBACAAN ──
function overview() {
  const d = load(), t = d.days[dayKey()] || { m: 0, c: 0, e: 0, n: 0, u: {} }
  return {
    since: d.since, totals: { ...d.totals }, categories: { ...d.categories },
    groups: Object.keys(d.groups).length,
    groupMessages: Object.values(d.groups).reduce((n, g) => n + (g.messages || 0), 0),
    groupCommands: Object.values(d.groups).reduce((n, g) => n + (g.commands || 0), 0),
    users: Object.keys(d.users).length,
    today: { messages: t.m, commands: t.c, errors: t.e, newUsers: t.n, activeUsers: Object.keys(t.u).length },
  }
}
function topCommands(category, limit = 8) {
  return Object.entries(load().commands).filter(([, v]) => !category || v.category === category).sort((a, b) => b[1].count - a[1].count).slice(0, limit).map(([name, v]) => ({ name, ...v }))
}
function topGroups(limit = 8) {
  return Object.entries(load().groups).sort((a, b) => b[1].messages - a[1].messages).slice(0, limit).map(([id, v]) => ({ id, ...v }))
}
function topUsers(limit = 8, by = 'commands') {
  return Object.entries(load().users).sort((a, b) => (b[1][by] || 0) - (a[1][by] || 0)).slice(0, limit).map(([id, v]) => ({ id, ...v }))
}
// n hari terakhir (lama → baru), hari kosong tetap muncul dengan nilai 0
function trend(n = 7) {
  const d = load(), out = []
  for (let i = n - 1; i >= 0; i--) {
    const k = dayKey(Date.now() - i * DAY), r = d.days[k]
    out.push({ day: k, messages: r ? r.m : 0, commands: r ? r.c : 0, errors: r ? r.e : 0, newUsers: r ? r.n : 0, active: r ? Object.keys(r.u).length : 0 })
  }
  return out
}
function hourly() { return load().hours.slice() }
// pertumbuhan: n hari terakhir dibanding n hari sebelumnya
function growth(n = 7) {
  const t = trend(n * 2), sum = (a, k) => a.reduce((s, x) => s + x[k], 0), cur = t.slice(n), prev = t.slice(0, n)
  const pct = (a, b) => b ? Math.round((a - b) / b * 100) : (a ? 100 : 0)
  const o = {}
  for (const k of ['messages', 'commands', 'newUsers']) o[k] = { cur: sum(cur, k), prev: sum(prev, k), pct: pct(sum(cur, k), sum(prev, k)) }
  return o
}
// segmentasi pengguna berdasarkan terakhir aktif & intensitas
function segments() {
  const d = load(), now = Date.now(), s = { active24h: 0, active7d: 0, active30d: 0, dormant: 0, lost: 0, newWeek: 0, power: 0, silent: 0, total: 0 }
  for (const u of Object.values(d.users)) {
    s.total++
    const age = now - (u.last || 0)
    if (age <= DAY) s.active24h++
    if (age <= 7 * DAY) s.active7d++
    if (age <= 30 * DAY) s.active30d++
    if (age > 14 * DAY && age <= 30 * DAY) s.dormant++
    if (age > 30 * DAY) s.lost++
    if (now - (u.first || now) <= 7 * DAY) s.newWeek++
    if ((u.commands || 0) >= 50) s.power++
    if ((u.messages || 0) > 0 && !(u.commands || 0)) s.silent++
  }
  return s
}
function listUsers(kind, limit = 10) {
  const d = load(), now = Date.now()
  let rows = Object.entries(d.users).map(([id, v]) => ({ id, ...v }))
  if (kind === 'new') rows = rows.filter(u => now - (u.first || now) <= 7 * DAY).sort((a, b) => b.first - a.first)
  else if (kind === 'dormant') rows = rows.filter(u => now - (u.last || 0) > 14 * DAY).sort((a, b) => (b.commands || 0) - (a.commands || 0))
  else if (kind === 'power') rows = rows.filter(u => (u.commands || 0) >= 50).sort((a, b) => b.commands - a.commands)
  else if (kind === 'tagged') rows = rows.filter(u => u.tag || u.note).sort((a, b) => (b.last || 0) - (a.last || 0))
  else rows = rows.sort((a, b) => (b.last || 0) - (a.last || 0))
  return rows.slice(0, limit)
}
const digits = (s) => String(s || '').replace(/\D/g, '')
function findUser(q) {
  const d = load(), s = String(q || '').trim(); if (!s) return null
  const num = digits(s)
  if (num.length >= 6) { const jid = Object.keys(d.users).find(j => digits(j.split('@')[0]).endsWith(num.replace(/^0/, '62')) || digits(j.split('@')[0]) === num); if (jid) return { id: jid, ...d.users[jid] } }
  const low = s.toLowerCase(), jid = Object.keys(d.users).find(j => String(d.users[j].name || '').toLowerCase().includes(low))
  return jid ? { id: jid, ...d.users[jid] } : null
}
function userProfile(jid) {
  const d = load(), u = d.users[jid]; if (!u) return null
  const favs = Object.entries(u.cmds || {}).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const cats = Object.entries(u.categories || {}).sort((a, b) => b[1] - a[1])
  return { id: jid, ...u, favs, cats }
}
function command(name) {
  const d = load(), k = String(name || '').toLowerCase().replace(/^[.!#/]/, ''), c = d.commands[k]
  if (!c) return null
  const users = Object.entries(d.users).filter(([, u]) => u.cmds && u.cmds[k]).sort((a, b) => b[1].cmds[k] - a[1].cmds[k])
  return { name: k, ...c, users: users.length, top: users.slice(0, 3).map(([id, u]) => ({ id, name: u.name, n: u.cmds[k] })) }
}
function searchCommands(q, limit = 10) {
  const s = String(q || '').toLowerCase().replace(/^[.!#/]/, '')
  return Object.entries(load().commands).filter(([k]) => k.includes(s)).sort((a, b) => b[1].count - a[1].count).slice(0, limit).map(([name, v]) => ({ name, ...v }))
}
// perintah yang pernah dipakai tapi sudah lama tidak disentuh
function coldCommands(days = 14, limit = 10) {
  const now = Date.now()
  return Object.entries(load().commands).filter(([, v]) => now - (v.last || 0) > days * DAY).sort((a, b) => a[1].last - b[1].last).slice(0, limit).map(([name, v]) => ({ name, ...v }))
}
function recentErrors(limit = 10) { return load().errors.slice(-limit).reverse() }
function errorStats() {
  const m = {}; for (const e of load().errors) m[e.cmd] = (m[e.cmd] || 0) + 1
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([cmd, n]) => ({ cmd, n }))
}
// skor kesehatan 0-100: keaktifan 7 hari, rasio error, pertumbuhan
function health() {
  const s = segments(), o = overview(), g = growth(7)
  const act = s.total ? Math.min(100, Math.round(s.active7d / s.total * 100)) : 0
  const errRate = o.totals.commands ? o.totals.errors / (o.totals.commands + o.totals.errors) : 0
  const errScore = Math.max(0, Math.round(100 - errRate * 800))
  const grow = Math.max(0, Math.min(100, 50 + g.commands.pct / 2))
  const score = Math.round(act * 0.45 + errScore * 0.35 + grow * 0.2)
  return { score, act, errScore, grow: Math.round(grow), errRate: +(errRate * 100).toFixed(2) }
}

// ── OWNER: catatan, tag, ekspor ──
function setNote(jid, note) { const u = load().users[jid]; if (!u) return false; u.note = String(note || '').slice(0, 200); saveSoon(); return true }
function setTag(jid, tag) { const u = load().users[jid]; if (!u) return false; u.tag = String(tag || '').slice(0, 24); saveSoon(); return true }
function exportAll() {
  const d = load(), out = path.join(global.dionyData, `crm-export-${dayKey()}.json`)
  const safe = { exportedAt: new Date().toISOString(), overview: overview(), segments: segments(), trend: trend(30), hours: d.hours, commands: d.commands, groups: d.groups, users: d.users, errors: d.errors }
  fs.writeFileSync(out, JSON.stringify(safe, null, 2)); return out
}
function reset() { db = blank(); flush(); return true }

// pengguna yang dulu cukup aktif (>=8 perintah) tapi mulai sepi (10-45 hari tanpa aktivitas) — kandidat disapa ulang sebelum benar hilang
function atRisk(limit = 12) {
  const d = load(), now = Date.now()
  return Object.entries(d.users)
    .map(([id, u]) => ({ id, ...u, idleDays: Math.floor((now - (u.last || 0)) / DAY) }))
    .filter(u => (u.commands || 0) >= 8 && u.idleDays >= 10 && u.idleDays <= 45)
    .sort((a, b) => (b.commands || 0) - (a.commands || 0))
    .slice(0, limit)
}
// stickiness: rasio pengguna aktif harian/mingguan terhadap basis bulanan (DAU/MAU, WAU/MAU) — indikator seberapa lengket bot dipakai
function stickiness() {
  const o = overview(), s = segments()
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0
  return { dau: o.today.activeUsers, wau: s.active7d, mau: s.active30d, dauMau: pct(o.today.activeUsers, s.active30d), wauMau: pct(s.active7d, s.active30d) }
}
// retensi minggu berjalan: dari user yang SUDAH ada sebelum 7 hari lalu, berapa % masih terlihat 7 hari terakhir
function retention() {
  const d = load(), now = Date.now()
  let base = 0, kept = 0
  for (const u of Object.values(d.users)) {
    if ((u.first || now) > now - 7 * DAY) continue   // hanya user lama (bukan yang baru minggu ini)
    base++
    if ((u.last || 0) >= now - 7 * DAY) kept++
  }
  return { base, kept, pct: base ? Math.round(kept / base * 100) : 0 }
}

process.on('exit', flush)
module.exports = {
  CATS, message, hit, error, overview, topCommands, topGroups, topUsers, trend, hourly, growth, segments, listUsers, findUser, userProfile,
  command, searchCommands, coldCommands, recentErrors, errorStats, health, setNote, setTag, exportAll, reset, flush, categoryOf, dayKey,
  atRisk, stickiness, retention,
}
