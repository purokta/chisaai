/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pembantu SALURAN (channel) WhatsApp: temukan tautan / ID saluran di teks atau pesan yang di-reply,
// lalu ambil metadatanya. Dipakai .idch .infoch .followch .unfollowch .reactch
const CH_RE = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9_-]{10,})(?:\/(\d+))?/gi
const JID_RE = /\b(\d{10,30}@newsletter)\b/gi

// -> [{ code, post } | { jid }]  (tanpa duplikat, urutan kemunculan)
function fromText(t) {
  const out = [], seen = new Set(), s = String(t || '')
  for (const x of s.matchAll(CH_RE)) { if (seen.has(x[1])) continue; seen.add(x[1]); out.push({ code: x[1], post: x[2] || null }) }
  for (const x of s.matchAll(JID_RE)) { const j = x[1].toLowerCase(); if (seen.has(j)) continue; seen.add(j); out.push({ jid: j }) }
  return out
}

// kumpulkan acuan saluran dari: teks perintah, teks pesan yang di-reply, dan info "diteruskan dari saluran"
function collect(m, text) {
  const refs = [...fromText(text)]
  const add = (r) => { if (r && !refs.some(x => (x.code && x.code === r.code) || (x.jid && x.jid === r.jid))) refs.push(r) }
  for (const r of fromText(m.quoted && m.quoted.text)) add(r)
  for (const node of [m.quoted, m.msg]) {
    const f = node && node.contextInfo && node.contextInfo.forwardedNewsletterMessageInfo
    if (f && f.newsletterJid) add({ jid: String(f.newsletterJid), post: f.serverMessageId ? String(f.serverMessageId) : null, fwdName: f.newsletterName || null })
  }
  return refs
}

const txt = (v) => (v && typeof v === 'object' ? (v.text || '') : (v || ''))
const toSec = (n) => { n = Number(n) || 0; return n > 1e12 ? Math.floor(n / 1000) : n }

// ambil metadata + rapikan -> { id, name, desc, subs, verified, created(detik), code, state, role, reactions }
async function fetch(sock, ref) {
  const meta = ref.code ? await sock.newsletterMetadata('invite', ref.code) : await sock.newsletterMetadata('jid', ref.jid)
  if (!meta || !meta.id) throw new Error('saluran tidak ditemukan')
  const vm = meta.viewer_metadata || meta.viewerMetadata || {}
  return {
    id: String(meta.id),
    name: txt(meta.name) || ref.fwdName || 'tanpa nama',
    desc: String(txt(meta.description)).trim(),
    subs: Number(meta.subscribers ?? meta.subscribers_count ?? 0) || 0,
    verified: String(meta.verification || '').toUpperCase() === 'VERIFIED',
    created: toSec(meta.creation_time || meta.creationTime),
    code: meta.invite || ref.code || null,
    state: String((meta.state && meta.state.type) || meta.state || '').toLowerCase(),
    role: String(vm.role || '').toLowerCase(),
    reactions: String(meta.reaction_codes || meta.reactionCodes || '').toLowerCase(),
  }
}

const num = (n) => Number(n || 0).toLocaleString('id-ID')
module.exports = { fromText, collect, fetch, num, CH_RE, JID_RE }
