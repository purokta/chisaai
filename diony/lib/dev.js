/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// HELPER DEV — dipakai plugins/owner/dev.js (kontrol ekonomi, level, energi, premium, backup)
const fs = require('fs'), path = require('path')
const DBDIR = global.dionyData
const jdb = require('./jsondb')
const J = require('./jid')
const clean = (s) => String(s || '').replace(/[^0-9]/g, '')

// ── angka: 1000 | 5k | 25rb | 2jt | 1m (miliar) | 1t (triliun) | -500 ──
const MULT = { k: 1e3, rb: 1e3, ribu: 1e3, jt: 1e6, juta: 1e6, m: 1e9, miliar: 1e9, t: 1e12, triliun: 1e12 }
function parseAmount(s) {
  const x = String(s ?? '').trim().toLowerCase().replace(/,/g, '.').match(/^(-?\d+(?:\.\d+)?)\s*([a-z]*)$/)
  if (!x) return NaN
  const mult = x[2] ? MULT[x[2]] : 1; if (!mult) return NaN
  const n = Math.round(parseFloat(x[1]) * mult)
  return Number.isFinite(n) && Math.abs(n) <= 1e12 ? n : NaN
}
// ── durasi: 30d | 12j | 2w | 1bln | 90m(enit) | perm ──
function parseDuration(s) {
  const t = String(s || '').trim().toLowerCase()
  if (!t || ['perm', 'permanen', 'selamanya', 'forever'].includes(t)) return 0
  const x = t.match(/^(\d+)\s*(d|h|hari|j|jam|w|mg|minggu|bln|bulan|mnt|menit)$/); if (!x) return NaN
  const n = +x[1], u = x[2]
  const ms = ['d', 'h', 'hari'].includes(u) ? 864e5 : ['j', 'jam'].includes(u) ? 36e5 : ['w', 'mg', 'minggu'].includes(u) ? 6048e5 : ['bln', 'bulan'].includes(u) ? 2592e6 : 6e4
  return n * ms
}
const durLabel = (ms) => { if (!ms) return 'permanen'; const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); return [d && d + ' hari', h && h + ' jam', !d && m && m + ' menit'].filter(Boolean).join(' ') || '<1 menit' }

// ── target: mention / reply / nomor / me / all. Mengembalikan { jids, all, rest } ──
function resolve(m, args) {
  const ctx = (m.msg && m.msg.contextInfo) || {}, rest = [], hasMention = (ctx.mentionedJid || []).length > 0
  const jids = new Set((ctx.mentionedJid || []).map(j => J.toPn(j))); let all = false   // mention bisa berupa LID → ubah ke nomor
  if (m.quoted && m.quoted.sender) jids.add(J.toPn(m.quoted.sender))
  for (const w of args) {
    const lw = String(w).toLowerCase()
    if (['me', 'saya', 'aku', 'gua', 'gue'].includes(lw)) { jids.add(m.sender); continue }
    if (['all', 'semua'].includes(lw)) { all = true; continue }
    if (w.startsWith('@') && hasMention) continue           // teks mention, jidnya sudah diambil dari contextInfo
    const n = clean(w); if (n.length >= 8 && n.length <= 15 && /^[@+]?\d+$/.test(w)) { jids.add(n + '@s.whatsapp.net'); continue }
    rest.push(w)
  }
  return { jids: [...jids], all, rest }
}

// ── log aksi Dev ──
const LOG = () => jdb('devlog')
function log(by, act, detail) {
  const L = LOG(); L.data.list = L.data.list || []
  L.data.list.push({ t: Date.now(), by: String(by).split('@')[0], act, detail: String(detail || '').slice(0, 160) })
  if (L.data.list.length > 300) L.data.list = L.data.list.slice(-300)
  L.save()
}
const lastLogs = (n = 15) => ((LOG().data.list) || []).slice(-n).reverse()

// ── premium berjangka ──
const PREM = path.join(DBDIR, 'premium.json')
const readPrem = () => { try { return JSON.parse(fs.readFileSync(PREM, 'utf8')) } catch { return [] } }
const writePrem = (a) => fs.writeFileSync(PREM, JSON.stringify(a, null, 2))
const EXP = () => { const d = jdb('premexp'); return d }
function addPremium(jid, ms) {
  const list = readPrem(); if (!list.includes(jid)) { list.push(jid); writePrem(list) }
  const E = EXP(); let until = 0
  if (ms > 0) { const cur = E.data[jid] > Date.now() ? E.data[jid] : Date.now(); until = cur + ms; E.data[jid] = until } else delete E.data[jid]
  E.save(); return until
}
function delPremium(jid) {
  const list = readPrem(), had = list.includes(jid); if (had) writePrem(list.filter(x => x !== jid))
  const E = EXP(); delete E.data[jid]; E.save(); return had
}
let lastSweep = 0
function sweepPremium(force) {
  if (!force && Date.now() - lastSweep < 30000) return 0
  lastSweep = Date.now()
  const E = EXP(), now = Date.now(), dead = Object.keys(E.data).filter(j => E.data[j] <= now); if (!dead.length) return 0
  writePrem(readPrem().filter(j => !dead.includes(j))); for (const j of dead) delete E.data[j]; E.save(); return dead.length
}
const premInfo = () => { const E = EXP().data; return readPrem().map(j => ({ jid: j, until: E[j] || 0 })) }

// ── RPG: level, heal ──
function setLevel(RPG, u, lv) {
  lv = Math.max(1, Math.min(RPG.MAXLV, Math.floor(lv))); const old = u.level
  u.pts = Math.max(0, (u.pts || 0) + (lv - old) * 3); u.level = lv; u.exp = 0
  const s = RPG.stats(u); u.hp = s.maxhp; u.mp = s.maxmp; RPG.save(); return { old, lv }
}
function fullHeal(RPG, u) { const s = RPG.stats(u); u.hp = s.maxhp; u.mp = s.maxmp; RPG.save() }

// ── level XP grup (plugins/group/level.js memakai jsondb 'level' yang sama) ──
const xpFor = (lv) => 100 * lv * lv
const grpLevel = (chat) => { const d = jdb('level'); return (d.data[chat] = d.data[chat] || { on: true, u: {} }) }

module.exports = { clean, parseAmount, parseDuration, durLabel, resolve, log, lastLogs, addPremium, delPremium, sweepPremium, premInfo, setLevel, fullHeal, xpFor, grpLevel, DBDIR }
