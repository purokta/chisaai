/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// AFK: simpan status "sedang pergi" + balas otomatis saat ada yang menyebut / me-reply orang itu
const fs = require('fs'), path = require('path')
const FILE = path.join(global.dionyData, 'afk.json')
const seen = new Map()                                   // jeda pemberitahuan per (chat, target) supaya tidak spam

const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} } }
const write = (o) => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)) } catch (e) { console.log('[afk] gagal simpan:', e.message) } }

function dur(ms) {
  const s = Math.max(1, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60)
  const out = [d && d + ' hari', h && h + ' jam', m && m + ' menit'].filter(Boolean)
  return out.length ? out.slice(0, 2).join(' ') : s + ' detik'
}
const tag = (j) => '@' + String(j).split('@')[0]

const set = (jid, reason) => { const db = read(); db[jid] = { since: Date.now(), reason: String(reason || '').slice(0, 120) || 'tanpa alasan' }; write(db); return db[jid] }
const del = (jid) => { const db = read(); if (!db[jid]) return false; delete db[jid]; write(db); return true }
const get = (jid) => read()[jid]
const all = () => read()

// dipanggil dari Dionysus.js untuk setiap pesan (sebelum perintah diproses)
async function check(sock, m, command) {
  const db = read()
  // 1) pemilik status AFK kembali aktif
  const me = db[m.sender]
  if (me && command !== 'afk' && command !== 'unafk') {
    delete db[m.sender]; write(db)
    await sock.sendMessage(m.chat, { text: `✦ Selamat datang kembali ${tag(m.sender)}.\nKamu AFK selama *${dur(Date.now() - me.since)}*\nAlasan: ${me.reason}`, mentions: [m.sender] }, { quoted: m }).catch(() => {})
  }
  // 2) ada yang menyebut / me-reply orang yang sedang AFK
  const ctx = (m.msg && m.msg.contextInfo) || {}
  const ids = [...new Set([...(ctx.mentionedJid || []), m.quoted && m.quoted.sender].filter(Boolean))]
  for (const j of ids) {
    const a = db[j]; if (!a || j === m.sender) continue
    const k = m.chat + '|' + j, last = seen.get(k) || 0
    if (Date.now() - last < 45000) continue
    seen.set(k, Date.now())
    await sock.sendMessage(m.chat, { text: `✦ Jangan ganggu ${tag(j)}, dia sedang *AFK* sejak ${dur(Date.now() - a.since)} lalu.\nAlasan: ${a.reason}`, mentions: [j] }, { quoted: m }).catch(() => {})
  }
}

module.exports = { set, del, get, all, dur, tag, check }
