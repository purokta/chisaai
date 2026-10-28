/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// LIMIT HARIAN BERBASIS STATUS (reset otomatis tengah malam sesuai zona waktu)
//   Free = 7/hari • Premium = 30/hari • Owner/Dev = tak terbatas (∞)   → atur lewat .set limitfree / .set limitprem (0 = tanpa batas)
// Data limit disimpan DI DALAM data user register (lib/database/register.json → users[jid].lim = { d, n, b, inf }).
//   Untuk nomor yang belum register (mis. saat wajibdaftar dimatikan) dipakai cadangan lib/database/limit.json.
//   d = tanggal pemakaian • n = terpakai hari ini • b = ENERGI BONUS (tidak hangus saat ganti hari) • inf = energi tak terbatas (Dev)
// Limit habis → SEMUA fitur terkunci kecuali plugin bertanda alwaysAllow (.profile). Penghitungan ada di Chisa.js.
const fs = require('fs'), path = require('path')
const FILE = path.join(global.chisaData, 'limit.json')
const S = () => require('./settingsdb')
const REG = () => require('./regdb')

const readFB = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} } }
const writeFB = (o) => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o)) } catch (e) { console.log('[limit] gagal simpan:', e.message) } }
const tz = () => { try { return S().get('timezone') || 'Asia/Jakarta' } catch { return 'Asia/Jakarta' } }
const today = () => { try { return new Date().toLocaleDateString('en-CA', { timeZone: tz() }) } catch { return new Date().toISOString().slice(0, 10) } }
const fresh = () => ({ d: today(), n: 0, b: 0 })

const cap = (key, def) => { const v = Number(S().get(key)); return Number.isFinite(v) && v >= 0 ? Math.floor(v) : def }
// batas harian per status. owner / 0 = tanpa batas (dikembalikan 0)
const max = (tier = 'free') => tier === 'owner' ? 0 : tier === 'premium' ? cap('limitprem', 30) : cap('limitfree', 7)
const tierName = (tier) => ({ owner: 'Owner', premium: 'Premium', free: 'Free' }[tier] || 'Free')

// rekaman limit satu user (objek hidup) + fungsi simpan
function load(jid) {
  const u = REG().getUser(jid)
  if (u) {
    if (!u.lim) u.lim = fresh()
    if (u.lim.d !== today()) { u.lim.d = today(); u.lim.n = 0 }
    return { r: u.lim, save: () => REG().save(), reg: true }
  }
  const db = readFB(), r = db[jid] || fresh()
  if (r.d !== today()) { r.d = today(); r.n = 0 }
  db[jid] = r
  return { r, save: () => writeFB(db), reg: false }
}

const used = (jid) => load(jid).r.n
const bonus = (jid) => { const b = load(jid).r.b; return b > 0 ? b : 0 }
const infinite = (jid) => !!load(jid).r.inf
const unlimited = (jid, tier) => tier === 'owner' || max(tier) <= 0 || infinite(jid)
const left = (jid, tier = 'free') => unlimited(jid, tier) ? Infinity : Math.max(0, max(tier) - used(jid)) + bonus(jid)
const canUse = (jid, tier = 'free') => left(jid, tier) > 0

// pakai 1 jatah; false bila habis
function take(jid, tier = 'free') {
  if (unlimited(jid, tier)) return true
  const M = max(tier), h = load(jid), r = h.r
  if (r.n < M) r.n++
  else if (r.b > 0) r.b--
  else return false
  h.save(); return true
}
// kembalikan 1 jatah (dipakai bila perintah error)
function refund(jid, tier = 'free') {
  if (unlimited(jid, tier)) return
  const h = load(jid); if (h.r.n > 0) { h.r.n--; h.save() }
}
function reset(jid) {
  if (jid) { const h = load(jid); h.r.n = 0; h.r.d = today(); h.save(); return }
  const reg = REG().allUsers(); for (const k of Object.keys(reg)) { reg[k].lim = Object.assign(reg[k].lim || fresh(), { n: 0, d: today() }) }
  REG().save()
  const db = readFB(); for (const k of Object.keys(db)) { db[k].n = 0; db[k].d = today() } writeFB(db)
}
// ── dipakai Dev ──
function addBonus(jid, n) { const h = load(jid); h.r.b = Math.max(0, (h.r.b || 0) + n); h.save(); return h.r.b }
function setBonus(jid, n) { const h = load(jid); h.r.b = Math.max(0, n); h.save(); return h.r.b }
function setInfinite(jid, on) { const h = load(jid); if (on) h.r.inf = true; else delete h.r.inf; h.save(); return !!h.r.inf }
function addBonusAll(jids, n) { for (const j of jids) { const h = load(j); h.r.b = Math.max(0, (h.r.b || 0) + n); h.save() } return jids.length }

// detik sampai tengah malam (zona waktu bot) + teks "3 jam 12 menit"
function resetSeconds() {
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz(), hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
    const g = (t) => Number((p.find(x => x.type === t) || {}).value) || 0
    return Math.max(1, 86400 - (g('hour') * 3600 + g('minute') * 60 + g('second')))
  } catch { return 3600 }
}
function resetText() { const s = resetSeconds(), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} jam ${m} menit` : `${Math.max(1, m)} menit` }

// ringkasan satu user (untuk .profile / .limit)
function info(jid, tier = 'free') {
  const inf = unlimited(jid, tier), M = max(tier), b = bonus(jid), u = used(jid)
  return { tier, name: tierName(tier), unlimited: inf, max: M, used: u, bonus: b, left: inf ? Infinity : Math.max(0, M - u) + b, daily: inf ? Infinity : Math.max(0, M - u) }
}
// teks untuk menu: "7/7" atau "∞"
const label = (jid, tier = 'free') => { if (unlimited(jid, tier)) return '∞'; const i = info(jid, tier); return `${i.daily}/${i.max}${i.bonus ? ` (+${i.bonus})` : ''}` }

module.exports = { used, left, take, refund, canUse, reset, max, label, bonus, infinite, unlimited, tierName, info, fresh, resetText, resetSeconds, addBonus, setBonus, setInfinite, addBonusAll }
