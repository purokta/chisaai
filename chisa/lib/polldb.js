/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Polling grup: simpan satu polling aktif per grup (lib/database/polls.json)
const fs = require('fs'), path = require('path')
const FILE = path.join(global.chisaData, 'polls.json')
const MAX_OPT = 10, MIN_OPT = 2

const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} } }
const write = (o) => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)) } catch (e) { console.log('[poll] gagal simpan:', e.message) } }
const tag = (j) => '@' + String(j).split('@')[0]

const UNIT = { m: 60e3, j: 3600e3, h: 3600e3, d: 86400e3 }
// ambil durasi "-30m" / "-2j" / "-1d" di akhir teks -> { text, ms }
function splitDuration(raw) {
  const m = String(raw || '').match(/\s-(\d{1,3})\s*(m|j|h|d)\s*$/i)
  if (!m) return { text: String(raw || '').trim(), ms: 0 }
  return { text: raw.slice(0, m.index).trim(), ms: Math.min(+m[1] * UNIT[m[2].toLowerCase()], 7 * 86400e3) }
}
function dur(ms) {
  const s = Math.max(1, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), mi = Math.floor(s % 3600 / 60)
  const out = [d && d + ' hari', h && h + ' jam', mi && mi + ' menit'].filter(Boolean)
  return out.length ? out.slice(0, 2).join(' ') : s + ' detik'
}

// tutup otomatis bila lewat batas waktu
function expire(db, gid) {
  const p = db[gid]
  if (p && !p.closed && p.endsAt && Date.now() >= p.endsAt) { p.closed = true; p.closedAt = p.endsAt; p.closedBy = 'waktu habis'; return true }
  return false
}
function get(gid) { const db = read(); const ch = expire(db, gid); if (ch) write(db); return db[gid] || null }

function create(gid, creator, title, options, ms) {
  const db = read()
  expire(db, gid)
  if (db[gid] && !db[gid].closed) return null
  db[gid] = { title, options, votes: {}, creator, createdAt: Date.now(), endsAt: ms ? Date.now() + ms : 0, closed: false }
  write(db); return db[gid]
}
// -> 'ok' | 'changed' | 'same' | null (tidak ada polling aktif)
function vote(gid, jid, idx) {
  const db = read(); expire(db, gid)
  const p = db[gid]
  if (!p || p.closed) { write(db); return null }
  const prev = p.votes[jid]
  p.votes[jid] = idx
  write(db)
  return prev === undefined ? 'ok' : prev === idx ? 'same' : 'changed'
}
function unvote(gid, jid) {
  const db = read(); expire(db, gid); const p = db[gid]
  if (!p || p.closed || p.votes[jid] === undefined) return false
  delete p.votes[jid]; write(db); return true
}
function close(gid, by) {
  const db = read(); expire(db, gid); const p = db[gid]
  if (!p || p.closed) return null
  p.closed = true; p.closedAt = Date.now(); p.closedBy = by; write(db); return p
}
const tally = (p) => { const c = p.options.map(() => 0); for (const v of Object.values(p.votes)) if (c[v] !== undefined) c[v]++; return c }
const bar = (pct) => '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10))

// teks hasil: daftar opsi + batang persentase + info status
function render(p, prefix, B) {
  const c = tally(p), total = c.reduce((a, b) => a + b, 0), top = Math.max(...c)
  const lines = p.options.map((o, i) => {
    const pct = total ? Math.round(c[i] / total * 100) : 0
    const crown = p.closed && total && c[i] === top ? ' ✦' : ''
    return `${i + 1}. ${o}${crown}\n   ${bar(pct)} ${pct}% (${c[i]} suara)`
  })
  const status = p.closed
    ? `✦ ${B('SELESAI')} • ${p.closedBy === 'waktu habis' ? 'waktu habis' : 'ditutup ' + tag(p.closedBy)}`
    : p.endsAt ? `✦ Sisa waktu: ${dur(p.endsAt - Date.now())}` : '✦ Tanpa batas waktu'
  const foot = p.closed ? '' : `\n\n_Pilih dengan ${prefix}vote <no> • lihat hasil ${prefix}hasilpoll_`
  const win = p.closed && total ? (() => { const w = p.options.filter((_, i) => c[i] === top); return `\n✦ ${B(w.length > 1 ? 'Seri' : 'Pemenang')}: ${w.join(' & ')}` })() : ''
  return `✦ ${B('POLLING')}\n━━━━━━━━━━━━━━━━━━━━\n${B(p.title)}\n\n${lines.join('\n')}\n\n✦ Total suara: ${total}\n${status}${win}${foot}`
}
module.exports = { MAX_OPT, MIN_OPT, splitDuration, dur, get, create, vote, unvote, close, tally, render, tag }
