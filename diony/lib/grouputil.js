/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Helper fitur grup: ambil target (mention / reply / nomor) + database peringatan
const fs = require('fs'), path = require('path')
const WARN = path.join(global.dionyData, 'warns.json')
const clean = (s) => String(s || '').replace(/[^0-9]/g, '')

// target dari: @mention, reply pesan, atau nomor di teks
function targets(m, text) {
  const set = new Set()
  const ctx = (m.msg && m.msg.contextInfo) || {}
  for (const j of ctx.mentionedJid || []) set.add(j)
  if (m.quoted && m.quoted.sender) set.add(m.quoted.sender)
  for (const w of String(text || '').split(/[\s,]+/)) {
    const n = clean(w)
    if (n.length >= 8 && n.length <= 15) set.add(n + '@s.whatsapp.net')
  }
  return [...set]
}

const readWarns = () => { try { return JSON.parse(fs.readFileSync(WARN, 'utf8')) } catch { return {} } }
const saveWarns = (o) => { try { fs.writeFileSync(WARN, JSON.stringify(o, null, 2)) } catch (e) { console.log('[warn] gagal simpan:', e.message) } }
const tag = (jid) => '@' + String(jid).split('@')[0]

module.exports = { targets, readWarns, saveWarns, tag, clean }
