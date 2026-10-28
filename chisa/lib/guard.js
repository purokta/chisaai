/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PENJAGA PESAN: cache pesan terbaru, ANTI DELETE (pulihkan pesan yang ditarik), ANTI VIEW ONCE (buka pesan sekali-lihat)
// Mode tiap fitur (atur lewat .antidelete / .antiviewonce atau .set):
//   off   = mati
//   chat  = pesan dipulihkan di chat yang sama
//   (mode 'owner' sudah dihapus — dianggap 'chat')
const { downloadContentFromMessage, getContentType, extractMessageContent } = require('./baileys')
const S = require('./settingsdb')

const CACHE = new Map()
const MAX = 4000
const MEDIA = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']

const keyOf = (chat, id) => chat + '|' + id
const num = (j) => String(j || '').split('@')[0].split(':')[0]
const ownerJid = () => String((global.owner || [])[0] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net'
const mode = (k) => { const v = S.get(k); return v === 'owner' || v === true ? 'chat' : v === false || !v ? 'off' : v }   // 'owner' (DM otomatis) dihapus agar nomor bot aman

function remember(mek) {
  try {
    if (!mek || !mek.key || !mek.key.id || !mek.message) return
    const k = Object.keys(mek.message)
    if (k.length === 1 && ['protocolMessage', 'reactionMessage', 'senderKeyDistributionMessage'].includes(k[0])) return
    CACHE.set(keyOf(mek.key.remoteJid, mek.key.id), mek)
    if (CACHE.size > MAX) CACHE.delete(CACHE.keys().next().value)
  } catch {}
}
const recall = (chat, id) => CACHE.get(keyOf(chat, id))

// unduh isi media pesan jadi Buffer
async function download(content, type) {
  const stream = await downloadContentFromMessage(content, type.replace('Message', ''))
  const parts = []
  for await (const ch of stream) parts.push(ch)
  return Buffer.concat(parts)
}

// kirim tanpa filter gaya kuno supaya isi pesan asli tidak berubah (emoji tetap utuh)
const raw = (sock) => (sock.rawSend || sock.sendMessage).bind(sock)

// bungkus buffer media menjadi payload sendMessage
function payload(type, c, buf, caption) {
  if (type === 'imageMessage') return { image: buf, caption }
  if (type === 'videoMessage') return { video: buf, caption, gifPlayback: !!c.gifPlayback }
  if (type === 'audioMessage') return { audio: buf, mimetype: c.mimetype || 'audio/mp4', ptt: !!c.ptt }
  if (type === 'stickerMessage') return { sticker: buf }
  if (type === 'documentMessage') return { document: buf, mimetype: c.mimetype || 'application/octet-stream', fileName: c.fileName || 'file', caption }
  return null
}

const kind = (t) => ({ conversation: 'teks', extendedTextMessage: 'teks', imageMessage: 'gambar', videoMessage: 'video', audioMessage: 'audio', stickerMessage: 'stiker', documentMessage: 'dokumen', contactMessage: 'kontak', locationMessage: 'lokasi', liveLocationMessage: 'lokasi' }[t] || 'pesan')
const clock = (ts) => new Date(Number(ts) * 1000).toLocaleTimeString('id-ID', { timeZone: S.get('timezone'), hour: '2-digit', minute: '2-digit' })

async function chatName(sock, jid) {
  if (!jid.endsWith('@g.us')) return 'chat pribadi'
  try { return (await sock.groupMetadata(jid)).subject } catch { return 'grup' }
}

// ── ANTI DELETE ──
async function onRevoke(sock, mek) {
  const md = mode('antidelete'); if (md === 'off' || S.get('mode') === 'self') return   // mode self: senyap
  const proto = mek.message.protocolMessage, rk = proto.key || {}
  if (!rk.id || rk.fromMe) return                       // pesan milik bot / akun sendiri tidak dipulihkan
  const chat = mek.key.remoteJid
  const old = recall(chat, rk.id); if (!old || !old.message) return
  const inner = extractMessageContent(old.message) || old.message, type = getContentType(inner), c = inner[type]
  const author = old.key.participant || old.participant || chat, deleter = mek.key.participant || author
  const to = md === 'owner' ? ownerJid() : chat
  const place = md === 'owner' ? `\n┣ Lokasi   : ${await chatName(sock, chat)}` : ''
  const head = `✦ *PESAN DITARIK*\n┣ Pengirim : @${num(author)}${deleter !== author ? `\n┣ Dihapus  : @${num(deleter)}` : ''}${place}\n┣ Jenis    : ${kind(type)}\n┗ Dikirim  : pukul ${clock(old.messageTimestamp)}`
  const mentions = [...new Set([author, deleter])]
  const send = raw(sock)
  if (type === 'conversation' || type === 'extendedTextMessage') {
    const t = type === 'conversation' ? c : (c.text || '')
    return send(to, { text: `${head}\n\n${t}`, mentions })
  }
  await send(to, { text: head, mentions })
  if (MEDIA.includes(type)) {
    try {
      const buf = await download(c, type)
      return await send(to, payload(type, c, buf, c.caption || undefined))
    } catch (e) { return send(to, { text: '_Media sudah tidak bisa diunduh dari server WhatsApp._' }) }
  }
  try { await send(to, { forward: old }) } catch {}
}

// ── ANTI VIEW ONCE ──
function viewOnceOf(message) {
  if (!message) return null
  const w = message.viewOnceMessage || message.viewOnceMessageV2 || message.viewOnceMessageV2Extension
  const inner = w ? w.message : message
  if (!inner) return null
  const type = getContentType(inner), c = inner[type]
  if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(type) || !c) return null
  return (w || c.viewOnce) ? { type, c } : null
}

// bongkar satu pesan sekali-lihat lalu kirim ke `to`; dipakai fitur otomatis dan perintah .rvo
async function reveal(sock, vo, to, caption, quoted) {
  const buf = await download(vo.c, vo.type)
  const pl = payload(vo.type, vo.c, buf, caption)
  return raw(sock)(to, pl, quoted ? { quoted } : {})
}

async function onViewOnce(sock, mek) {
  const md = mode('antiviewonce'); if (md === 'off' || S.get('mode') === 'self') return   // mode self: senyap
  const vo = viewOnceOf(mek.message); if (!vo) return
  const chat = mek.key.remoteJid, who = mek.key.participant || chat
  const to = md === 'owner' ? ownerJid() : chat
  const place = md === 'owner' ? `\n┣ Lokasi   : ${await chatName(sock, chat)}` : ''
  const cap = `✦ *SEKALI-LIHAT DIBUKA*\n┣ Pengirim : @${num(who)}${place}\n┗ Jenis    : ${kind(vo.type)}${vo.c.caption ? `\n\n${vo.c.caption}` : ''}`
  const buf = await download(vo.c, vo.type)
  const send = raw(sock)
  if (vo.type === 'audioMessage') {
    await send(to, { text: cap, mentions: [who] })
    return send(to, payload(vo.type, vo.c, buf))
  }
  return send(to, { ...payload(vo.type, vo.c, buf, cap), mentions: [who] })
}

// dipanggil dari index.js untuk SETIAP pesan masuk
async function onUpsert(sock, { messages, type }) {
  for (const mek of messages || []) {
    try {
      if (!mek || !mek.message || !mek.key || mek.key.remoteJid === 'status@broadcast') continue
      const proto = mek.message.protocolMessage
      if (proto && proto.type === 0) { if (type === 'notify') await onRevoke(sock, mek); continue }
      if (mek.key.fromMe) continue
      remember(mek)
      if (type === 'notify') await onViewOnce(sock, mek)
    } catch (e) { console.log('[guard]', e.message) }
  }
}

module.exports = { onUpsert, remember, recall, download, viewOnceOf, reveal, mode, CACHE }
