/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
/*
✦ CHISA AI — by SHIPUR
Helper pusat ID WhatsApp.

Masalah yang diselesaikan: WhatsApp kini memakai dua jenis ID untuk satu orang —
  • nomor telepon  : 628xxxx@s.whatsapp.net
  • LID (anonim)   : 1234567890123@lid   (angkanya BUKAN nomor telepon)
Di grup berbasis LID, daftar peserta, pengirim pesan, dan mention bisa berupa LID, sehingga
  - bot tidak menemukan dirinya di daftar admin ("jadikan bot admin dulu" padahal sudah admin)
  - nomor yang tampil di welcome / out / grupstatistic / canvas salah (yang tampil angka LID)
Modul ini menyimpan peta LID -> nomor, lalu menormalkan semuanya ke nomor telepon.
*/
const fs = require('fs'), path = require('path')
const FILE = path.join(global.chisaData, 'lidmap.json')

const strip = (j) => String(j || '').replace(/:\d+@/, '@')              // buang suffix device
const isLid = (j) => /@lid$/.test(String(j || ''))
const isPn = (j) => /@s\.whatsapp\.net$/.test(String(j || ''))
const user = (j) => strip(j).split('@')[0]
const toPnJid = (j) => { const s = strip(j); return isPn(s) ? s : null }

// ── peta LID <-> nomor (disimpan ke file supaya tetap ada setelah restart) ──
let map = null, rev = null, dirty = false, timer = null
function load() {
  if (map) return map
  try { map = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { map = {} }
  if (!map || typeof map !== 'object') map = {}
  rev = {}; for (const [l, p] of Object.entries(map)) rev[p] = l
  return map
}
function flush() {
  if (!dirty) return; dirty = false
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(map)) } catch (e) { console.log('[jid] gagal simpan:', e.message) }
}
function arm() { dirty = true; if (!timer) { timer = setInterval(flush, 20000); if (timer.unref) timer.unref() } }
process.on('exit', flush)

function learn(lid, pn) {
  load(); lid = strip(lid); pn = toPnJid(pn)
  if (!isLid(lid) || !pn) return
  if (map[lid] === pn) return
  map[lid] = pn; rev[pn] = lid; arm()
}
// pelajari pasangan dari metadata grup (peserta membawa id + phoneNumber/lid/jid)
function learnMeta(meta) {
  for (const p of (meta && meta.participants) || []) {
    const id = strip(p.id), pn = toPnJid(p.phoneNumber) || toPnJid(p.jid) || toPnJid(id), lid = strip(p.lid || (isLid(id) ? id : ''))
    if (lid && pn) learn(lid, pn)
  }
  if (meta && meta.owner && meta.ownerPn) learn(meta.owner, meta.ownerPn)
}

// ── ubah ID apa pun menjadi nomor telepon (bila diketahui) ──
function toPn(jid) {
  if (!jid) return jid
  if (typeof jid === 'object') return pnOf(jid)
  const s = strip(jid)
  if (isPn(s)) return s
  if (isLid(s)) { load(); return map[s] || s }
  return s
}
// objek peserta / event -> nomor
function pnOf(x) {
  if (!x) return ''
  if (typeof x === 'string') return toPn(x)
  const lid = isLid(x.id) ? x.id : (x.lid || '')
  const pn = toPnJid(x.phoneNumber) || toPnJid(x.jid) || toPnJid(x.id)
  if (pn && lid) learn(lid, pn)
  return pn || toPn(x.id || x.lid || '')
}
const lidOf = (pn) => { load(); return rev[strip(pn)] || null }
// angka yang aman ditampilkan sebagai nomor telepon ('' bila hanya LID yang diketahui)
// nomor telepon asli harus lolos validasi (LID = angka acak 14-15 digit yang bukan nomor; jangan pernah ditampilkan sebagai nomor)
function validPhone(d) {
  d = String(d || '').replace(/\D/g, ''); if (d.length < 8 || d.length > 15) return false
  try { return !!require('awesome-phonenumber').parsePhoneNumber('+' + d).valid } catch { return /^(62|1|44|60|65|91|81|82|84|63|66|61|49|33|39|34|55|7|20|90|966|971)\d{7,12}$/.test(d) }
}
function phone(jid) { const p = toPn(jid); if (!isPn(p)) return ''; const n = user(p); return validPhone(n) ? n : '' }
// label tampilan: "+628xxx" bila nomor diketahui; kalau tidak, pakai cadangan (nama) — jangan pernah menampilkan angka LID sebagai nomor
function label(jid, fallback) { const n = phone(jid); return n ? '+' + n : (fallback || 'anggota') }

// ── resolusi async (pakai pemetaan bawaan Baileys + metadata grup) ──
async function resolve(sock, jid, chat) {
  if (!jid) return jid
  const s = strip(jid)
  if (!isLid(s)) return s
  load(); if (map[s]) return map[s]
  try {
    const lm = sock.signalRepository && sock.signalRepository.lidMapping
    if (lm && typeof lm.getPNForLID === 'function') {
      const r = await lm.getPNForLID(s) || await lm.getPNForLID(s.split('@')[0])
      const pn = toPnJid(r) || (r ? toPnJid(String(r).split(':')[0] + '@s.whatsapp.net') : null)
      if (pn) { learn(s, pn); return pn }
    }
  } catch {}
  if (chat && String(chat).endsWith('@g.us')) { try { await sock.groupMetadata(chat) } catch {}; if (map[s]) return map[s] }
  return s
}
// kumpulkan semua ID dari satu pesan masuk lalu pelajari pasangannya SEBELUM pesan diproses
async function prepare(sock, mek) {
  try {
    const k = mek.key || {}, chat = k.remoteJid
    // Baileys baru menyertakan pasangan nomor pada key
    for (const a of [k.participantAlt, k.participantPn, k.senderPn, k.remoteJidAlt]) {
      if (a && isPn(a)) { if (isLid(k.participant)) learn(k.participant, a); else if (isLid(k.remoteJid)) learn(k.remoteJid, a) }
    }
    const msg = mek.message || {}, type = Object.keys(msg).find(t => msg[t] && typeof msg[t] === 'object' && msg[t].contextInfo)
    const ci = type ? msg[type].contextInfo : null
    const ids = [k.participant, ...(ci ? [ci.participant, ...(ci.mentionedJid || [])] : [])].filter(isLid)
    for (const id of new Set(ids.map(strip))) await resolve(sock, id, chat)
  } catch {}
}

// ── normalisasi metadata grup: id peserta jadi NOMOR, LID asli disimpan di p.lid ──
function normalizeMeta(meta) {
  if (!meta || !Array.isArray(meta.participants) || meta.__normalized) return meta
  learnMeta(meta)
  const out = Object.assign({}, meta)
  out.participants = meta.participants.map(p => {
    const id = strip(p.id), lid = strip(p.lid || (isLid(id) ? id : '')) || undefined
    const pn = toPnJid(p.phoneNumber) || toPnJid(p.jid) || toPnJid(id) || (lid ? toPnJid(map && map[lid]) : null)
    return Object.assign({}, p, { id: pn || id, lid, phoneNumber: pn || p.phoneNumber })
  })
  if (meta.owner) out.owner = toPn(meta.ownerPn || meta.owner)
  out.__normalized = true
  return out
}

// ── admin & bot ──
function botIds(sock) {
  const u = (sock && sock.user) || {}
  return [u.id, u.lid, u.jid].filter(Boolean).map(strip)
}
// semua bentuk ID milik satu peserta
const idsOf = (p) => [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean).map(strip)
function findParticipant(meta, ...jids) {
  load()
  const want = new Set(jids.flat().filter(Boolean).map(strip))
  for (const j of [...want]) { const l = lidOf(j); if (l) want.add(l); if (isLid(j) && map && map[j]) want.add(map[j]) }
  return ((meta && meta.participants) || []).find(p => idsOf(p).some(i => want.has(i))) || null
}
function isAdmin(meta, ...jids) { const p = findParticipant(meta, ...jids); return !!(p && p.admin) }
function adminList(meta) { return ((meta && meta.participants) || []).filter(p => p.admin).map(p => p.id) }

// pasang ke socket: groupMetadata selalu mengembalikan data yang sudah dinormalkan
function attach(sock) {
  const rawMeta = sock.groupMetadata.bind(sock)
  sock.groupMetadata = async (jid) => normalizeMeta(await rawMeta(jid))
  const rawUpd = sock.groupParticipantsUpdate && sock.groupParticipantsUpdate.bind(sock)
  if (rawUpd) sock.groupParticipantsUpdate = async (gid, jids, action) => {
    // coba nomor dulu; kalau ditolak server, coba lagi dengan LID-nya
    let res
    try { res = await rawUpd(gid, jids, action) } catch (e) {
      const alt = jids.map(j => lidOf(j) || j); if (alt.every((a, i) => a === jids[i])) throw e
      return rawUpd(gid, alt, action)
    }
    try {
      const bad = (res || []).filter(r => r && String(r.status) !== '200')
      if (bad.length && bad.length === (res || []).length) {
        const alt = jids.map(j => lidOf(j) || j)
        if (!alt.every((a, i) => a === jids[i])) return await rawUpd(gid, alt, action)
      }
    } catch {}
    return res
  }
  // hangatkan peta LID dari semua grup begitu tersambung
  sock.warmLid = async () => {
    try { const all = await sock.groupFetchAllParticipating(); for (const g of Object.values(all || {})) learnMeta(g) } catch (e) { console.log('[jid] warm gagal:', e.message) }
  }
}

module.exports = { validPhone, strip, isLid, isPn, user, learn, learnMeta, toPn, pnOf, lidOf, phone, label, resolve, prepare, normalizeMeta, botIds, findParticipant, isAdmin, adminList, attach }
