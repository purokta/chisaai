/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Helper bersama alat praktis: penyimpanan per-user (lib/database/praktis.json), tanggal WIB, nominal, rupiah
const fs = require('fs'), path = require('path')
const FILE = path.join(global.dionyData, 'praktis.json')
let db = {}; try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch {}
let t = null
const flush = () => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)) } catch {} }
const save = () => { if (t) return; t = setTimeout(() => { t = null; flush() }, 1500) }
process.on('exit', flush)

const get = (jid, key, fb) => (db[jid] && db[jid][key] !== undefined ? db[jid][key] : fb)
const set = (jid, key, val) => { (db[jid] = db[jid] || {})[key] = val; save(); return val }
const all = () => db

const TZ = 'Asia/Jakarta'
const dayKey = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const addDays = (k, n) => { const d = new Date(k + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const fmtTanggal = (k) => { const d = new Date(k + 'T00:00:00Z'); return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}` }

function parseTanggal(str) {
  if (!str) return null
  const s = String(str).trim().toLowerCase()
  if (s === 'hariini') return dayKey()
  if (s === 'besok') return addDays(dayKey(), 1)
  if (s === 'kemarin') return addDays(dayKey(), -1)
  let y, mo, d, m
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) [, y, mo, d] = m
  else if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) [, d, mo, y] = m
  else return null
  y = +y; mo = +mo; d = +d
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d ? dt.toISOString().slice(0, 10) : null
}

// 5jt, 500rb, 2,5jt, 1.500.000, 25k, 1m(iliar)
function parseNominal(str) {
  if (str === undefined || str === null) return NaN
  let s = String(str).toLowerCase().replace(/rp\.?|\s/g, ''), mult = 1
  const suf = s.match(/(juta|jt|ribu|rb|k|miliar|m)$/)
  if (suf) { mult = { juta: 1e6, jt: 1e6, ribu: 1e3, rb: 1e3, k: 1e3, miliar: 1e9, m: 1e9 }[suf[1]]; s = s.slice(0, -suf[1].length) }
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); else s = s.replace(/,/g, '.')
  const n = parseFloat(s)
  return Number.isFinite(n) && /^[\d.]+$/.test(s) ? n * mult : NaN
}
const rupiah = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID')
const bar = (f, len = 10) => { const on = Math.round(Math.max(0, Math.min(1, f)) * len); return '█'.repeat(on) + '░'.repeat(len - on) }
const quotedText = (m) => ((m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
const mentions = (m) => [...new Set([...(m.msg?.contextInfo?.mentionedJid || []), ...(m.mentionedJid || [])])]

module.exports = { get, set, all, dayKey, addDays, fmtTanggal, parseTanggal, parseNominal, rupiah, bar, quotedText, mentions, BULAN, HARI }
