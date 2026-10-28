/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Statistik grup Chisa (.grupstatistic)
// Mencatat diam-diam: pesan per anggota per grup, waktu online/offline (lewat presence WhatsApp),
// peristiwa admin (promote / demote / kick / ubah pengaturan), lalu menyusun analisis keamanan,
// risiko kudeta admin, dan profil sifat tiap orang. Data: lib/database/grupstat.json
//
// CATATAN JUJUR: presence online/offline hanya terdeteksi bila (1) bot sedang hidup,
// (2) bot sudah subscribe ke orang itu, (3) orang itu tidak menyembunyikan "terakhir dilihat/online".
// Orang yang menyembunyikannya tampil "belum terpantau". Bot tidak bisa membaca masa lalu: data dihitung sejak bot merekam.
const fs = require('fs'), path = require('path')
const { cls } = require('./flowui')
const J = require('./jid')
const FILE = path.join(global.chisaData, 'grupstat.json')
const HR = 3600e3, DAY = 86400e3

let db = null, dirty = false, timer = null
const blank = () => ({ since: Date.now(), alias: {}, people: {}, groups: {} })
function load() {
  if (db) return db
  try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { db = blank() }
  db.alias = db.alias || {}; db.people = db.people || {}; db.groups = db.groups || {}
  // bot baru menyala: status presence lama tidak boleh dihitung (bot mati = tidak memantau)
  for (const p of Object.values(db.people)) { p.ps = null; p.pt = 0 }
  return db
}
function flush() {
  if (!db) return
  const now = Date.now(); for (const p of Object.values(db.people)) tally(p, now)
  if (!dirty) return; dirty = false
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)) } catch (e) { console.log('[grupstat] gagal simpan:', e.message) }
}
function arm() { if (!timer) { timer = setInterval(flush, 30000); if (timer.unref) timer.unref() } dirty = true }
process.setMaxListeners(Math.max(process.getMaxListeners(), 30)); process.on('exit', flush)

// ── util ──
const num = (j) => String(j || '').split('@')[0].split(':')[0]
function norm(j) { if (!j) return ''; j = J.pnOf(j); const d = load(); j = String(j).replace(/:\d+@/, '@'); return J.toPn(d.alias[j] || j) }
function learnAlias(meta) {
  J.learnMeta(meta)
  const d = load()
  for (const p of (meta && meta.participants) || []) {
    const id = String(p.id || ''), pn = p.phoneNumber, lid = p.lid
    if (id.endsWith('@lid') && pn) d.alias[id] = pn
    if (lid && pn) d.alias[lid] = pn
    else if (lid && id.endsWith('@s.whatsapp.net')) d.alias[lid] = id
  }
}
const person = (j) => { const d = load(); return d.people[j] || (d.people[j] = { name: '', on: 0, off: 0, ses: 0, ps: null, pt: 0, lo: 0, lf: 0, seen: Date.now() }) }
const grp = (gid) => { const d = load(); return d.groups[gid] || (d.groups[gid] = { name: '', since: Date.now(), users: {}, act: {}, events: [], snap: null }) }
const nameOf = (j) => { const p = load().people[j]; return (p && p.name) || J.label(j, 'Anggota') }
const jl = (j) => J.label(j, '-')   // nomor tampil: +628xxx, atau '-' bila hanya LID yang diketahui
const tzOf = () => { try { return require('./settingsdb').get('timezone') || 'Asia/Jakarta' } catch { return 'Asia/Jakarta' } }
const hourOf = (ts) => { try { return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tzOf(), hour: '2-digit', hour12: false }).format(ts)) % 24 } catch { return new Date(ts).getHours() } }
const dayKey = (ts) => { try { return new Intl.DateTimeFormat('en-CA', { timeZone: tzOf() }).format(ts) } catch { return new Date(ts).toISOString().slice(0, 10) } }
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }, HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const dowOf = (ts) => { try { return DOW[new Intl.DateTimeFormat('en-US', { timeZone: tzOf(), weekday: 'short' }).format(ts)] } catch { return new Date(ts).getDay() } }
const fmtDate = (ts) => ts ? new Date(ts).toLocaleString('id-ID', { timeZone: tzOf(), day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
function dur(ms) {
  if (!ms || ms < 1000) return '0 mnt'
  const d = Math.floor(ms / DAY), h = Math.floor(ms % DAY / HR), m = Math.floor(ms % HR / 60000)
  const o = [d && d + ' hr', h && h + ' jam', m && m + ' mnt'].filter(Boolean)
  return (o.length ? o.slice(0, 2).join(' ') : '< 1 mnt')
}
const ago = (ts) => ts ? dur(Date.now() - ts) + ' lalu' : '-'

// ── presence: hitung durasi online / offline ──
function tally(p, now) {
  if (p.ps && p.pt) { const dt = Math.max(0, now - p.pt); if (p.ps === 'on') p.on += dt; else p.off += dt; dirty = true }
  p.pt = now
}
function setState(p, st, now) {
  if (p.ps === st) return
  tally(p, now)
  if (st === 'on') { p.ses++; p.lo = now } else p.lf = now
  p.ps = st; p.pt = now; arm()
}
function onPresence(ev) {
  const now = Date.now()
  for (const [raw, v] of Object.entries((ev && ev.presences) || {})) {
    const j = norm(raw); if (!/@(s\.whatsapp\.net|lid)$/.test(j)) continue
    const s = v && v.lastKnownPresence; if (!s) continue
    const p = person(j)
    if (s === 'available' || s === 'composing' || s === 'recording') setState(p, 'on', now)
    else if (s === 'unavailable') setState(p, 'off', now)
  }
}

// ── pesan ──
const LINK = /(https?:\/\/|www\.|chat\.whatsapp\.com|\.(com|net|id|me|xyz|io)\b)/i
function msg(m, meta, text) {
  if (!m || !m.chat || !String(m.chat).endsWith('@g.us') || (m.key && m.key.fromMe)) return
  const t = m.mtype
  if (['protocolMessage', 'reactionMessage', 'senderKeyDistributionMessage', 'pollUpdateMessage'].includes(t)) return
  const j = norm(m.sender); if (!j) return
  const now = Date.now()
  learnAlias(meta); if (meta) snap(m.chat, meta)
  const g = grp(m.chat)
  const u = g.users[j] || (g.users[j] = { first: now, last: 0, n: 0, ch: 0, md: 0, st: 0, rp: 0, mt: 0, ln: 0, q: 0, hr: new Array(24).fill(0) })
  const body = String(text || '')
  u.n++; u.last = now; u.ch += body.length; u.hr[hourOf(now)]++
  const dk = dayKey(now); g.days = g.days || {}; g.days[dk] = (g.days[dk] || 0) + 1
  const dks = Object.keys(g.days); if (dks.length > 40) for (const k of dks.sort().slice(0, dks.length - 40)) delete g.days[k]
  g.dow = g.dow || new Array(7).fill(0); g.dow[dowOf(now)]++
  if (t === 'stickerMessage') u.st++
  else if (/^(image|video|audio|document)Message$/.test(t) || t === 'ptvMessage') u.md++
  const c = (m.msg && m.msg.contextInfo) || {}
  if (c.stanzaId || c.quotedMessage) u.rp++
  if (c.mentionedJid && c.mentionedJid.length) u.mt++
  if (body && LINK.test(body)) u.ln++
  if (body.includes('?')) u.q++
  const p = person(j); if (m.pushName) p.name = m.pushName; p.seen = now
  if (p.ps !== 'on') setState(p, 'on', now)    // kirim pesan = pasti sedang online
  arm()
}

// ── snapshot metadata + peristiwa ──
function logEv(g, type, by, to, extra) { g.events.push({ t: Date.now(), type, by: by || '', to: to || [], x: extra || '' }); if (g.events.length > 200) g.events.splice(0, g.events.length - 200); arm() }
const actOf = (g, j) => g.act[j] || (g.act[j] = { kick: 0, kickAdm: 0, demote: 0, promote: 0, set: 0, add: 0, promotedAt: 0, promotedBy: '', demotedAt: 0 })
function snap(gid, meta) {
  if (!meta) return
  learnAlias(meta)
  const g = grp(gid), parts = meta.participants || [], admins = {}
  for (const p of parts) if (p.admin) admins[norm(p.id)] = p.admin
  const prev = g.snap
  if (prev && prev.admins) {   // perubahan admin yang terjadi saat bot tidak melihat (bot mati / belum jadi anggota)
    const here = new Set(parts.map(p => norm(p.id)))
    for (const j of Object.keys(admins)) if (!prev.admins[j]) { logEv(g, 'promote', '', [j], 'tidak terpantau'); actOf(g, j).promotedAt = Date.now() }
    for (const j of Object.keys(prev.admins)) if (!admins[j] && here.has(j)) logEv(g, 'demote', '', [j], 'tidak terpantau')
  }
  g.name = meta.subject || g.name
  g.snap = { size: parts.length, admins, announce: !!meta.announce, restrict: !!meta.restrict, add: meta.memberAddMode, appr: meta.joinApprovalMode, eph: meta.ephemeralDuration || 0, owner: norm(meta.owner || ''), desc: !!meta.desc, creation: meta.creation || 0 }
  arm()
}
function onParticipants(ev) {
  if (!ev || !ev.id || !String(ev.id).endsWith('@g.us')) return
  const g = grp(ev.id), by = norm(ev.author), now = Date.now()
  const tos = (ev.participants || []).map(norm).filter(Boolean)
  const adm = (g.snap && g.snap.admins) || {}
  const a = by ? actOf(g, by) : null
  if (ev.action === 'promote') {
    if (a) a.promote += tos.length
    for (const t of tos) { const x = actOf(g, t); x.promotedAt = now; x.promotedBy = by; if (g.snap) g.snap.admins[t] = 'admin' }
  } else if (ev.action === 'demote') {
    if (a) a.demote += tos.length
    for (const t of tos) { actOf(g, t).demotedAt = now; if (g.snap) delete g.snap.admins[t] }
  } else if (ev.action === 'remove') {
    const kicked = tos.filter(t => t !== by)
    if (a && kicked.length) { a.kick += kicked.length; a.kickAdm += kicked.filter(t => adm[t]).length }
    for (const t of tos) if (g.snap) delete g.snap.admins[t]
    if (!kicked.length) { logEv(g, 'leave', by, tos); return }
    logEv(g, 'kick', by, kicked); return
  } else if (ev.action === 'add') { if (a && by && !tos.includes(by)) a.add += tos.length; logEv(g, tos.includes(by) || !by ? 'join' : 'add', by, tos); return }
  logEv(g, ev.action, by, tos)
}
function onGroups(ups) {
  for (const u of ups || []) {
    if (!u || !u.id || !String(u.id).endsWith('@g.us')) continue
    const g = grp(u.id), by = norm(u.author)
    const ch = []
    if (u.subject !== undefined) { ch.push('nama grup'); g.name = u.subject }
    if (u.desc !== undefined) ch.push('deskripsi')
    if (u.announce !== undefined) ch.push(u.announce ? 'hanya admin yang boleh kirim pesan' : 'semua boleh kirim pesan')
    if (u.restrict !== undefined) ch.push(u.restrict ? 'hanya admin yang boleh edit info' : 'semua boleh edit info')
    if (u.memberAddMode !== undefined) ch.push('mode tambah anggota')
    if (u.joinApprovalMode !== undefined) ch.push('persetujuan bergabung')
    if (!ch.length) continue
    if (by) actOf(g, by).set++
    if (g.snap) { if (u.announce !== undefined) g.snap.announce = !!u.announce; if (u.restrict !== undefined) g.snap.restrict = !!u.restrict; if (u.memberAddMode !== undefined) g.snap.add = u.memberAddMode; if (u.joinApprovalMode !== undefined) g.snap.appr = u.joinApprovalMode }
    logEv(g, 'setting', by, [], ch.join(', '))
  }
}

// ── pemantau presence (subscribe berkala; langganan WA bisa kedaluwarsa) ──
let running = false
async function subscribeAll(sock) {
  if (running) return; running = true
  try {
    const all = await sock.groupFetchAllParticipating().catch(() => ({}))
    const jids = new Set(); const me = sock.decodeJid ? sock.decodeJid(sock.user.id) : ''
    for (const [gid, meta] of Object.entries(all)) { try { snap(gid, meta) } catch {} for (const p of meta.participants || []) { const j = norm(p.id); if (j && j !== me && j.endsWith('@s.whatsapp.net')) jids.add(j) } }
    let n = 0
    for (const j of jids) { if (n++ > 2000) break; await sock.presenceSubscribe(j).catch(() => {}); await new Promise(r => setTimeout(r, 600)) }
  } catch (e) { console.log('[grupstat] subscribe:', e.message) }
  running = false
}
function start(sock) {
  load()
  setTimeout(() => subscribeAll(sock), 20000)
  const iv = setInterval(() => subscribeAll(sock), 25 * 60 * 1000); if (iv.unref) iv.unref()
}

// ── analisis ──
function traits(u, p, total, rank, nUsers) {
  const out = [], n = u ? u.n : 0
  const track = p ? p.on + p.off : 0, onR = track > 0 ? p.on / track : null
  if (u && n >= 5) {
    const avg = u.ch / n, night = (u.hr.slice(0, 5).reduce((a, b) => a + b, 0)) / n, morning = (u.hr.slice(5, 10).reduce((a, b) => a + b, 0)) / n
    if (total && n / total >= 0.2) out.push('Penggerak obrolan')
    if (night >= 0.3) out.push('Burung hantu'); else if (morning >= 0.45) out.push('Si pagi')
    if (u.st / n >= 0.35) out.push('Kolektor stiker')
    if (u.md / n >= 0.4) out.push('Tukang media')
    if (avg >= 120) out.push('Penulis panjang'); else if (avg <= 15) out.push('Singkat padat')
    if (u.ln / n >= 0.15) out.push('Penyebar tautan')
    if (u.q / n >= 0.25) out.push('Penanya')
    if (u.rp / n >= 0.4) out.push('Suka membalas')
    if (u.mt / n >= 0.25) out.push('Suka menyebut orang')
  } else if (u) out.push('Baru terlihat')
  if (onR !== null && track >= 2 * HR) { if (onR >= 0.6) out.push('Hampir selalu online'); else if (onR <= 0.1 && (!u || n < 5)) out.push('Hantu (jarang muncul)') }
  if (!u && onR === null) out.push('Belum terpantau')
  return out.length ? out.slice(0, 3) : ['Anggota biasa']
}
const LEVEL = (s) => s >= 80 ? 'KRITIS' : s >= 60 ? 'TINGGI' : s >= 35 ? 'WASPADA' : 'AMAN'
function adminRisk(g, j, role, now) {
  const a = g.act[j] || {}, u = g.users[j], notes = []
  if (role === 'superadmin') return { score: 0, level: 'PEMILIK', notes: ['Pemilik grup: tidak bisa diturunkan atau dikeluarkan admin lain'] }
  let s = 20; notes.push('Bisa menurunkan admin lain dan mengeluarkan anggota')
  const kA = a.kickAdm || 0, dm = a.demote || 0
  if (kA) { s += Math.min(25, kA * 12); notes.push(`Pernah mengeluarkan ${kA} admin`) }
  if (dm) { s += Math.min(25, dm * 10); notes.push(`Pernah menurunkan ${dm} admin`) }
  if (a.kick) s += Math.min(10, a.kick * 2)
  if (a.set) { s += Math.min(10, a.set * 3); notes.push(`Mengubah pengaturan grup ${a.set}x`) }
  if (a.promote >= 2) { s += 10; notes.push(`Mengangkat ${a.promote} admin (berpotensi membangun blok)`) }
  if (a.promotedAt && now - a.promotedAt < 3 * DAY) { s += 12; notes.push('Baru diangkat < 3 hari') }
  const last = u ? u.last : 0
  if (last && now - last > 30 * DAY) { s += 10; notes.push('Admin tidak aktif > 30 hari (rawan akun diambil alih)') }
  else if (!last) { s += 4; notes.push('Belum pernah terlihat mengirim pesan') }
  return { score: Math.min(100, s), level: LEVEL(Math.min(100, s)), notes }
}

function analyze(gid, meta, sock) {
  load(); learnAlias(meta); snap(gid, meta)
  const g = grp(gid), sn = g.snap, now = Date.now(), parts = meta.participants || []
  const me = sock && sock.decodeJid && sock.user ? norm(sock.decodeJid(sock.user.id)) : ''
  const S = (() => { try { return require('./settingsdb') } catch { return { get: () => false } } })()
  const total = Object.values(g.users).reduce((s, u) => s + u.n, 0)
  const ranking = Object.entries(g.users).sort((a, b) => b[1].n - a[1].n).map(([j]) => j)

  // admin
  const admins = parts.filter(p => p.admin).map(p => {
    const j = norm(p.id), r = adminRisk(g, j, p.admin, now)
    return { jid: j, role: p.admin, ...r, act: g.act[j] || {}, u: g.users[j], p: load().people[j], isBot: j === me }
  }).sort((a, b) => b.score - a.score)
  const hasOwner = admins.some(a => a.role === 'superadmin')
  const coupers = admins.filter(a => a.score >= 60 && a.role !== 'superadmin')
  const recent = g.events.filter(e => now - e.t < 7 * DAY && (e.type === 'promote' || e.type === 'demote')).length
  const adminKicked = g.events.filter(e => e.type === 'kick' && now - e.t < 30 * DAY).length

  // keamanan
  const sec = []; let score = 100
  const add = (name, status, note, pen) => { sec.push([name, status, note]); score -= pen || 0 }
  const size = parts.length, ratio = size ? admins.length / size : 0
  const isBotAdmin = parts.some(p => norm(p.id) === me && p.admin)
  add('Bot berstatus admin', isBotAdmin ? 'OK' : 'INFO', isBotAdmin ? 'Bot dapat menindak pelanggar' : 'Bot bukan admin: antilink / kick tidak bisa dijalankan', isBotAdmin ? 0 : 5)
  add('Siapa boleh edit info grup', sn.restrict ? 'OK' : 'RISIKO', sn.restrict ? 'Hanya admin' : 'Semua anggota bisa mengubah nama, foto, dan deskripsi', sn.restrict ? 0 : 10)
  add('Siapa boleh kirim pesan', sn.announce ? 'INFO' : 'OK', sn.announce ? 'Hanya admin (grup dikunci)' : 'Semua anggota', 0)
  const addAll = sn.add === 'all_member_add' || sn.add === true
  add('Siapa boleh menambah anggota', addAll ? 'RISIKO' : 'OK', addAll ? 'Semua anggota bisa menambah orang' : 'Hanya admin', addAll ? 8 : 0)
  const appr = sn.appr === 'on' || sn.appr === true
  add('Persetujuan admin untuk bergabung', appr ? 'OK' : 'RISIKO', appr ? 'Aktif' : 'Nonaktif: siapa pun dengan tautan langsung masuk', appr ? 0 : 10)
  add('Rasio admin', ratio > 0.3 ? 'RISIKO' : ratio > 0.15 ? 'WASPADA' : 'OK', `${admins.length} admin dari ${size} anggota (${(ratio * 100).toFixed(1)}%)`, ratio > 0.3 ? 20 : ratio > 0.15 ? 10 : 0)
  add('Pemilik (superadmin) di dalam grup', hasOwner ? 'OK' : 'RISIKO', hasOwner ? 'Ada' : 'Tidak ada superadmin: siapa pun admin bisa menguasai grup', hasOwner ? 0 : 12)
  add('Admin berpotensi kudeta', coupers.length ? 'RISIKO' : 'OK', coupers.length ? `${coupers.length} admin skor >= 60` : 'Tidak ada yang melewati ambang', Math.min(24, coupers.length * 8))
  const dormant = admins.filter(a => a.role !== 'superadmin' && a.u && now - a.u.last > 14 * DAY).length
  add('Admin tidak aktif > 14 hari', dormant ? 'WASPADA' : 'OK', dormant ? `${dormant} admin` : 'Tidak ada', Math.min(9, dormant * 3))
  add('Pergantian admin 7 hari terakhir', recent >= 3 ? 'WASPADA' : 'OK', `${recent} kali promote/demote`, recent >= 3 ? 8 : 0)
  add('Anggota dikeluarkan 30 hari terakhir', adminKicked >= 5 ? 'WASPADA' : 'OK', `${adminKicked} kali`, adminKicked >= 5 ? 6 : 0)
  add('Bot: antilink', S.get('antilink') ? 'OK' : 'INFO', S.get('antilink') ? 'Aktif' : 'Nonaktif', S.get('antilink') ? 0 : 5)
  add('Bot: antitoxic', S.get('antitoxic') ? 'OK' : 'INFO', S.get('antitoxic') ? 'Aktif' : 'Nonaktif', S.get('antitoxic') ? 0 : 3)
  // statistik aktivitas grup
  const hrAll = new Array(24).fill(0), types = { n: 0, ch: 0, md: 0, st: 0, ln: 0, q: 0, rp: 0, mt: 0 }
  for (const u of Object.values(g.users)) { u.hr.forEach((v, i) => { hrAll[i] += v }); for (const k of Object.keys(types)) types[k] += u[k] || 0 }
  const mx = Math.max(...hrAll), peakH = mx ? hrAll.indexOf(mx) : -1, dow = g.dow || new Array(7).fill(0), dmx = Math.max(...dow)
  const days = g.days || {}, k7 = dayKey(now - 6 * DAY), last7 = Object.entries(days).filter(([k]) => k >= k7).reduce((x, [, v]) => x + v, 0)
  const bd = Object.entries(days).sort((x, y) => y[1] - x[1])[0]
  const nDays = Math.max(1, Object.keys(days).length)
  const joins7 = g.events.filter(e => (e.type === 'join' || e.type === 'add') && now - e.t < 7 * DAY).reduce((x, e) => x + e.to.length, 0)
  const leaves7 = g.events.filter(e => (e.type === 'leave' || e.type === 'kick') && now - e.t < 7 * DAY).reduce((x, e) => x + e.to.length, 0)
  const ccs = {}; let phoneN = 0
  for (const p of parts) { const pn = String(p.phoneNumber || p.id || ''); if (!pn.endsWith('@s.whatsapp.net')) continue; const n = num(pn); phoneN++; const c = n.slice(0, 2); ccs[c] = (ccs[c] || 0) + 1 }
  const dom = Object.entries(ccs).sort((x, y) => y[1] - x[1])[0], foreignPct = phoneN && dom ? Math.round((phoneN - dom[1]) / phoneN * 100) : 0
  const spike = size ? joins7 / size : 0
  add('Lonjakan anggota baru (7 hari)', spike >= 0.2 ? 'WASPADA' : 'OK', `${joins7} masuk, ${leaves7} keluar (${(spike * 100).toFixed(1)}% dari anggota)`, spike >= 0.2 ? 6 : 0)
  add('Anggota berkode negara berbeda', foreignPct > 35 ? 'WASPADA' : 'OK', phoneN ? `${foreignPct}% bukan +${dom[0]}` : 'Tidak terbaca (nomor disembunyikan)', foreignPct > 35 ? 5 : 0)
  add('Pesan sementara', sn.eph ? 'INFO' : 'OK', sn.eph ? `Aktif (${Math.round(sn.eph / 86400)} hari)` : 'Nonaktif', 0)
  score = Math.max(0, Math.min(100, score))
  const ADV = { 'Siapa boleh edit info grup': 'Setelan grup > Edit info grup > hanya admin', 'Siapa boleh menambah anggota': 'Setelan grup > Tambah anggota > hanya admin', 'Persetujuan admin untuk bergabung': 'Aktifkan Setujui anggota baru', 'Rasio admin': 'Kurangi admin yang tidak perlu', 'Pemilik (superadmin) di dalam grup': 'Pastikan pemilik asli masih di grup atau serahkan ke orang tepercaya', 'Admin berpotensi kudeta': 'Turunkan atau awasi admin skor tinggi; aktifkan .grupstatistic antikudeta auto', 'Admin tidak aktif > 14 hari': 'Turunkan admin yang tidak aktif (akun mudah diambil alih)', 'Pergantian admin 7 hari terakhir': 'Periksa log: .grupstatistic log', 'Anggota dikeluarkan 30 hari terakhir': 'Periksa siapa pelakunya: .grupstatistic log', 'Bot berstatus admin': 'Jadikan bot admin', 'Bot: antilink': 'Aktifkan antilink di pengaturan bot', 'Bot: antitoxic': 'Aktifkan antitoxic di pengaturan bot', 'Lonjakan anggota baru (7 hari)': 'Cek apakah ada serangan spam atau bot', 'Anggota berkode negara berbeda': 'Periksa nomor asing dengan .osint nomor' }
  for (const r of sec) r[3] = r[1] === 'OK' ? '' : (ADV[r[0]] || '')
  const grade = score >= 85 ? 'AMAN' : score >= 65 ? 'CUKUP' : score >= 45 ? 'RENTAN' : 'BAHAYA'

  // member
  const members = parts.map(p => {
    const j = norm(p.id), u = g.users[j], pp = load().people[j], rank = ranking.indexOf(j) + 1
    const track = pp ? pp.on + pp.off : 0
    return { jid: j, role: p.admin || '', u, p: pp, rank, track, onR: track > 0 ? pp.on / track : null, traits: traits(u, pp, total, rank, ranking.length) }
  }).sort((a, b) => (b.u ? b.u.n : 0) - (a.u ? a.u.n : 0) || (b.p ? b.p.on : 0) - (a.p ? a.p.on : 0))
  const tracked = members.filter(m => m.track > 0).length
  return { hrAll, peakH, dow, dmx, last7, bd, nDays, joins7, leaves7, types, foreignPct, gid, g, sn, size, total, score, grade, sec, admins, coupers, members, tracked, events: g.events.slice(-25).reverse(), now, hasOwner, since: Math.min(g.since, load().since), me }
}

// ── tampilan: kumpulan "sections" (tabel) untuk FL.renderSections ──
const EV = { promote: 'Dijadikan admin', demote: 'Diturunkan dari admin', kick: 'Dikeluarkan', leave: 'Keluar sendiri', join: 'Bergabung', add: 'Ditambahkan', setting: 'Ubah pengaturan' }
const roleTxt = (r) => r === 'superadmin' ? 'Pemilik' : r === 'admin' ? 'Admin' : 'Member'
const KV = ['Data', 'Nilai'], hh = (h) => String(h).padStart(2, '0') + ':00'
const bar = (v, mx) => mx ? '█'.repeat(Math.max(v ? 1 : 0, Math.round(v / mx * 12))) : ''
const pct = (v, t) => t ? Math.round(v / t * 100) + '%' : '0%'

function secRingkas(a) {
  const name = a.g.name || 'Grup', t = a.types
  return { h: 'Ringkasan grup', head: KV, min: 300, rows: [
    ['Nama grup', name], ['Anggota / admin', `${a.size} / ${a.admins.length}`], ['Dibuat', a.sn.creation ? fmtDate(a.sn.creation * 1000) : '-'],
    ['Bot merekam sejak', fmtDate(a.since)], ['Total pesan terekam', String(a.total)], ['Pesan 7 hari terakhir', String(a.last7)],
    ['Rata-rata pesan per hari', String(Math.round(a.total / a.nDays))], ['Jam tersibuk', a.peakH >= 0 ? hh(a.peakH) + ' - ' + hh((a.peakH + 1) % 24) : '-'],
    ['Hari tersibuk (kalender)', a.bd ? `${a.bd[0]} (${a.bd[1]} pesan)` : '-'], ['Hari paling ramai (mingguan)', a.dmx ? HARI[a.dow.indexOf(a.dmx)] : '-'],
    ['Anggota baru / keluar (7 hari)', `${a.joins7} / ${a.leaves7}`], ['Anggota terpantau online', `${a.tracked} dari ${a.size}`], ['Skor keamanan', `${a.score} / 100 (${a.grade})`]] }
}
function secKomposisi(a) {
  const t = a.types, teks = Math.max(0, t.n - t.md - t.st)
  return { h: 'Komposisi pesan', head: ['Jenis', 'Jumlah', 'Porsi'], min: 300, rows: [['Teks', String(teks), pct(teks, t.n)], ['Media (foto/video/audio/dokumen)', String(t.md), pct(t.md, t.n)], ['Stiker', String(t.st), pct(t.st, t.n)], ['Membalas pesan', String(t.rp), pct(t.rp, t.n)], ['Mengandung tautan', String(t.ln), pct(t.ln, t.n)], ['Mengandung tanda tanya', String(t.q), pct(t.q, t.n)], ['Menyebut orang', String(t.mt), pct(t.mt, t.n)], ['Rata-rata huruf per pesan', String(t.n ? Math.round(t.ch / t.n) : 0), '-']] }
}
const secKeamanan = (a, tips) => ({ h: 'Pemeriksaan keamanan', head: tips ? ['Pemeriksaan', 'Status', 'Keterangan', 'Saran'] : ['Pemeriksaan', 'Status', 'Keterangan'], min: tips ? 640 : 480, rows: a.sec.map(r => tips ? [r[0], cls(r[1]), r[2], r[3] || '-'] : [r[0], cls(r[1]), r[2]]) })
const secAdmin = (a, n) => ({ h: 'Admin dan potensi kudeta', note: 'Skor 0-100: makin tinggi makin besar peluang admin itu mengambil alih grup. Rekam aksi = kick / kick admin / demote / promote / ubah pengaturan.', head: ['Admin', 'Peran', 'Skor', 'Level', 'Rekam aksi', 'Chat terakhir', 'Catatan'], min: 760,
  rows: a.admins.slice(0, n || 10).map(x => [nameOf(x.jid) + (x.isBot ? ' (bot)' : ''), roleTxt(x.role), { t: String(x.score), c: 'n ' + x.level }, cls(x.level), `${x.act.kick || 0}/${x.act.kickAdm || 0}/${x.act.demote || 0}/${x.act.promote || 0}/${x.act.set || 0}`, x.u ? ago(x.u.last) : 'belum terlihat', x.notes.slice(1, 4).join('; ') || x.notes[0]]) })
const memRow = (m, i, full) => full
  ? [String(i + 1), nameOf(m.jid), jl(m.jid), roleTxt(m.role), { t: m.u ? String(m.u.n) : '0', c: 'n' }, m.u && m.u.n ? String(Math.round(m.u.ch / m.u.n)) : '-', m.u ? `${m.u.md}/${m.u.st}/${m.u.ln}` : '-', m.p && m.track ? dur(m.p.on) : '-', m.p && m.track ? dur(m.p.off) : '-', m.onR === null ? '-' : Math.round(m.onR * 100) + '%', m.p && m.p.ses ? String(m.p.ses) : '-', m.u ? fmtDate(m.u.first) : '-', m.u ? ago(m.u.last) : '-', m.traits.join(', ')]
  : [String(i + 1), nameOf(m.jid), roleTxt(m.role), { t: m.u ? String(m.u.n) : '0', c: 'n' }, m.p && m.track ? dur(m.p.on) : '-', m.p && m.track ? dur(m.p.off) : '-', m.onR === null ? '-' : Math.round(m.onR * 100) + '%', m.u ? ago(m.u.last) : '-', m.traits.join(', ')]
const secMember = (a, n) => ({ h: `Aktivitas dan sifat member (${Math.min(n, a.members.length)} teratas dari ${a.members.length})`, note: 'Urut jumlah pesan. Online/offline dihitung sejak bot memantau. Lihat semuanya: .grupstatistic member 2, 3, dst.', head: ['#', 'Nama', 'Peran', 'Pesan', 'Online', 'Offline', '% On', 'Chat terakhir', 'Sifat'], min: 780, rows: a.members.slice(0, n).map((m, i) => memRow(m, i, false)) })
const secLog = (a, n) => ({ h: 'Log peristiwa terakhir', head: ['Waktu', 'Peristiwa', 'Oleh', 'Target', 'Rincian'], min: 560, rows: a.g.events.slice(-n).reverse().map(e => [fmtDate(e.t), EV[e.type] || e.type, e.by ? nameOf(e.by) : '-', e.to.slice(0, 3).map(nameOf).join(', ') || '-', e.x || '']) })

const sectionsFull = (a) => [secRingkas(a), secKomposisi(a), secKeamanan(a), secAdmin(a, 10), secMember(a, 25), secLog(a, 8)]
const sectionsLog = (a) => [secLog(a, 40)]
const sectionsKeamanan = (a) => [{ ...secRingkas(a), rows: secRingkas(a).rows.filter((_, i) => i === 0 || i === 1 || i >= 10) }, secKeamanan(a, true), secAdmin(a, 8)]
function sectionsAdmin(a) {
  return [
    { h: 'Rekam aksi admin', head: ['Admin', 'Nomor', 'Peran', 'Skor', 'Level', 'Kick', 'Kick admin', 'Demote', 'Promote', 'Ubah', 'Diangkat', 'Chat terakhir', 'Online terakhir'], min: 1080,
      rows: a.admins.slice(0, 20).map(x => [nameOf(x.jid) + (x.isBot ? ' (bot)' : ''), jl(x.jid), roleTxt(x.role), { t: String(x.score), c: 'n ' + x.level }, cls(x.level), String(x.act.kick || 0), String(x.act.kickAdm || 0), String(x.act.demote || 0), String(x.act.promote || 0), String(x.act.set || 0), x.act.promotedAt ? fmtDate(x.act.promotedAt) + (x.act.promotedBy ? ' oleh ' + nameOf(x.act.promotedBy) : '') : '-', x.u ? ago(x.u.last) : 'belum terlihat', x.p && x.p.lo ? ago(x.p.lo) : '-']) },
    { h: 'Alasan skor tiap admin', head: ['Admin', 'Faktor'], min: 480, rows: a.admins.slice(0, 20).map(x => [nameOf(x.jid), x.notes.join('; ')]) },
    { h: 'Cara membaca skor', head: ['Faktor', 'Poin'], min: 360, rows: [['Admin biasa (bisa menurunkan admin & mengeluarkan anggota)', '+20'], ['Pernah mengeluarkan admin', '+12 per kejadian (maks 25)'], ['Pernah menurunkan admin', '+10 per kejadian (maks 25)'], ['Mengeluarkan anggota', '+2 per orang (maks 10)'], ['Mengubah pengaturan grup', '+3 per kali (maks 10)'], ['Mengangkat 2 admin atau lebih', '+10'], ['Baru diangkat kurang dari 3 hari', '+12'], ['Tidak aktif lebih dari 30 hari', '+10'], ['Pemilik grup (superadmin)', 'kebal, skor 0']] },
    secLog(a, 12)]
}
function sectionsMember(a, page) {
  const per = 12, pages = Math.max(1, Math.ceil(a.members.length / per)), p = Math.min(Math.max(1, page || 1), pages), from = (p - 1) * per
  return { p, pages, sections: [{ h: `Detail member, halaman ${p} dari ${pages}`, note: 'Media/Stiker/Tautan = jumlah pesan jenis itu. Ketik .grupstatistic member <halaman> untuk halaman lain.', head: ['#', 'Nama', 'Nomor', 'Peran', 'Pesan', 'Rata2 huruf', 'Media/Stiker/Tautan', 'Online', 'Offline', '% On', 'Sesi', 'Pertama terlihat', 'Chat terakhir', 'Sifat'], min: 1250, rows: a.members.slice(from, from + per).map((m, i) => memRow(m, from + i, true)) }] }
}
function sectionsJam(a) {
  const mx = Math.max(...a.hrAll), tot = a.hrAll.reduce((x, y) => x + y, 0), dmx = a.dmx
  const days = Object.entries(a.g.days || {}).sort().slice(-14).reverse(), dm = Math.max(0, ...days.map(d => d[1]))
  return [
    { h: 'Aktivitas per jam', note: 'Zona waktu bot. Dihitung dari pesan yang terekam.', head: ['Jam', 'Pesan', 'Porsi', 'Grafik'], min: 380, rows: a.hrAll.map((v, i) => [hh(i), String(v), pct(v, tot), bar(v, mx)]) },
    { h: 'Aktivitas per hari dalam seminggu', head: ['Hari', 'Pesan', 'Grafik'], min: 320, rows: HARI.map((n, i) => [n, String(a.dow[i]), bar(a.dow[i], dmx)]) },
    { h: '14 hari terakhir', head: ['Tanggal', 'Pesan', 'Grafik'], min: 320, rows: days.map(([k, v]) => [k, String(v), bar(v, dm)]) }]
}
function sectionsJejak(a, j) {
  const me = a.members.find(x => x.jid === j); if (!me) return null
  const u = me.u, p = me.p, act = a.g.act[j] || {}, pi = personInfo(j), role = roleTxt(me.role)
  const hr = u ? u.hr : new Array(24).fill(0), tot = hr.reduce((x, y) => x + y, 0) || 1
  const blk = [['00-03', 0, 4], ['04-07', 4, 8], ['08-11', 8, 12], ['12-15', 12, 16], ['16-19', 16, 20], ['20-23', 20, 24]].map(([n, s, e]) => { const c = hr.slice(s, e).reduce((x, y) => x + y, 0); return [n, String(c), pct(c, tot)] })
  const ad = a.admins.find(x => x.jid === j)
  return { me, ad, role, sections: [
    { h: 'Profil', head: KV, min: 300, rows: [['Nama', nameOf(j)], ['Nomor', jl(j)], ['Peran', role], ['Peringkat chat', me.rank ? '#' + me.rank + ' dari ' + a.members.length : '-'], ['Sifat', me.traits.join(', ')], ['Pertama terlihat', u ? fmtDate(u.first) : '-'], ['Terakhir chat', u ? ago(u.last) : '-']] },
    { h: 'Kebiasaan chat', head: KV, min: 300, rows: u ? [['Total pesan', String(u.n)], ['Rata-rata huruf per pesan', String(Math.round(u.ch / Math.max(1, u.n)))], ['Media', String(u.md)], ['Stiker', String(u.st)], ['Membalas pesan orang', String(u.rp)], ['Menyebut orang', String(u.mt)], ['Mengirim tautan', String(u.ln)], ['Bertanya (tanda tanya)', String(u.q)]] : [['Chat', 'Belum ada pesan terekam']] },
    { h: 'Jam aktif (zona waktu bot)', head: ['Jam', 'Pesan', 'Porsi'], min: 300, rows: u ? blk : [] },
    { h: 'Online dan offline', note: 'Hanya sejak bot memantau dan bila terakhir dilihat tidak disembunyikan.', head: KV, min: 300, rows: p && me.track ? [['Total online', dur(p.on)], ['Total offline', dur(p.off)], ['Persen online', Math.round(me.onR * 100) + '%'], ['Jumlah sesi online', String(p.ses || 0)], ['Terakhir online', p.lo ? ago(p.lo) : '-'], ['Terakhir offline', p.lf ? ago(p.lf) : '-']] : [['Status', 'Belum terpantau']] },
    { h: 'Rekam aksi admin', head: KV, min: 300, rows: me.role ? [['Mengeluarkan anggota', `${act.kick || 0} (admin: ${act.kickAdm || 0})`], ['Menurunkan admin', String(act.demote || 0)], ['Mengangkat admin', String(act.promote || 0)], ['Mengubah pengaturan grup', String(act.set || 0)], ['Diangkat', act.promotedAt ? fmtDate(act.promotedAt) + (act.promotedBy ? ' oleh ' + nameOf(act.promotedBy) : '') : '-'], ['Skor risiko kudeta', ad ? `${ad.score} (${ad.level})` : '-']] : [] },
    { h: 'Terlihat di grup lain yang dipantau bot', head: ['Grup', 'Pesan', 'Terakhir'], min: 360, rows: pi.groups.filter(g => g.gid !== a.gid).slice(0, 10).map(g => [g.name + (g.admin ? ' (admin)' : ''), String(g.n), ago(g.last)]) }] }
}

// teks penjelasan (digabung ke pesan kartu)
const HINT = 'Rincian lain: .grupstatistic keamanan | admin | member 2 | jam | log | jejak @orang | antikudeta on/auto/off'
function renderText(a) {
  const name = a.g.name || 'Grup', top = a.members.find(m => m.u && m.u.n), onTop = a.members.filter(m => m.p && m.track).sort((x, y) => y.p.on - x.p.on)[0]
  const l = [`✦ STATISTIK GRUP : ${name}`, '━━━━━━━━━━━━━━━━━━━━']
  l.push(`Anggota ${a.size}, admin ${a.admins.length}. Skor keamanan ${a.score}/100 (${a.grade}).`)
  const risk = a.sec.filter(r => r[1] === 'RISIKO' || r[1] === 'WASPADA')
  l.push(risk.length ? `Temuan: ${risk.map(r => r[0].toLowerCase()).slice(0, 4).join('; ')}.` : 'Tidak ada temuan keamanan yang menonjol.')
  if (a.coupers.length) l.push(`Admin paling berpotensi kudeta: ${a.coupers.slice(0, 3).map(x => `${nameOf(x.jid)} (${x.score})`).join(', ')}.`)
  else l.push('Tidak ada admin yang melewati ambang risiko kudeta.')
  if (!a.hasOwner) l.push('Peringatan: tidak ada superadmin terdeteksi di grup ini.')
  if (a.peakH >= 0) l.push(`Grup paling ramai jam ${hh(a.peakH)}, ${a.last7} pesan dalam 7 hari terakhir.`)
  if (top) l.push(`Paling banyak chat: ${nameOf(top.jid)} (${top.u.n} pesan, ${top.traits.join(', ')}).`)
  if (onTop) l.push(`Paling lama online: ${nameOf(onTop.jid)} (${dur(onTop.p.on)}).`)
  l.push(`Online/offline baru terpantau untuk ${a.tracked} dari ${a.size} anggota (yang menyembunyikan terakhir dilihat tidak bisa dipantau). Bot hanya merekam sejak ${fmtDate(a.since)}.`)
  l.push('Sifat tiap orang hanya perkiraan dari kebiasaan chat.', '', HINT)
  return l.join('\n')
}

// data satu orang (global): dipakai .osint nomor dan .jejak
function personInfo(j) {
  const d = load(); j = norm(j); const p = d.people[j], groups = []
  for (const [gid, g] of Object.entries(d.groups)) { const u = g.users[j]; if (u) groups.push({ gid, name: g.name || gid, n: u.n, last: u.last, admin: !!(g.snap && g.snap.admins && g.snap.admins[j]) }) }
  return { jid: j, p, groups: groups.sort((a, b) => b.n - a.n) }
}
function reset(gid) { const d = load(); const had = !!d.groups[gid]; delete d.groups[gid]; dirty = true; flush(); return had }
module.exports = { msg, snap, onPresence, onParticipants, onGroups, start, analyze, sectionsFull, sectionsKeamanan, sectionsAdmin, sectionsMember, sectionsJam, sectionsJejak, sectionsLog, renderText, reset, flush, dur, norm, nameOf, fmtDate, ago, personInfo, num, HARI }
