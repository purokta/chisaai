/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// lib/carousel.js — pesan CAROUSEL interaktif WhatsApp (kartu geser kiri-kanan, tiap kartu: media + teks + tombol)
//
// Isi kartu diatur di  assets/carousel/cards.json  (bisa diedit tanpa menyentuh kode).
// Taruh file foto/video di folder  assets/carousel/  lalu tulis nama filenya di cards.json.
//   • ekstensi .jpg/.jpeg/.png/.webp  -> kartu FOTO
//   • ekstensi .mp4/.mov/.webm/.gif   -> kartu VIDEO   (kartu tengah default = video)
//   • file belum ada -> otomatis pakai media bawaan bot (thumb.jpg / menu.mp4) supaya carousel tetap jalan
//
// Tampilan (otomatis):
//   • foto di-crop 1:1 rapi + dikompres, jadi semua kartu seragam walau ukuran asli beda-beda
//   • file belum ada -> dibuatkan KARTU ART bergaya emas-kuno (bingkai, Mata Horus, judul) dari field "art"
//   • video tampil auto-play loop (gif) — matikan per kartu dengan "gif": false
//   • baris pertama "body" otomatis dicetak tebal-bergaya; "title" tampil sebagai judul kecil di atas teks
//
// Tombol per kartu (field "buttons"):
//   { "type": "url",   "text": "Buka",   "url": "https://..." }     -> buka link
//   { "type": "reply", "text": "Menu",   "id": ".menu" }            -> kirim command (diproses seperti diketik manual)
//   { "type": "copy",  "text": "Salin",  "code": "teks yg disalin" } -> salin teks
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'assets', 'carousel')
const CFG = path.join(DIR, 'cards.json')

const IMG = /\.(jpe?g|png|webp)$/i
const VID = /\.(mp4|mov|webm|gif)$/i
const FALLBACK = {
  image: path.join(ROOT, 'lib', 'media', 'thumb.jpg'),
  video: path.join(ROOT, 'lib', 'media', 'menu', 'video', 'menu.mp4'),
}
const MAX_CARDS = 10   // batas WhatsApp
const MAX_BTN = 2      // tombol per kartu (aman di semua versi WA)
const ST = require('./style')
const cut = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s }

function loadCards() {
  try {
    const j = JSON.parse(fs.readFileSync(CFG, 'utf8'))
    const cards = Array.isArray(j) ? j : j.cards
    if (!Array.isArray(cards) || !cards.length) throw new Error('cards.json kosong')
    return { header: Array.isArray(j) ? '' : (j.title || ''), body: Array.isArray(j) ? '' : (j.body || ''), footer: Array.isArray(j) ? '' : (j.footer || ''), cards: cards.slice(0, MAX_CARDS) }
  } catch (e) { console.log('[carousel] cards.json bermasalah, pakai bawaan:', e.message); return null }
}

// tentukan jenis + path media satu kartu
function resolveMedia(card) {
  const name = String(card.file || '')
  const abs = name ? (path.isAbsolute(name) ? name : path.join(DIR, name)) : ''
  const kind = card.type === 'video' || VID.test(name) ? 'video' : 'image'
  if (abs && fs.existsSync(abs) && fs.statSync(abs).isFile()) return { kind: VID.test(abs) ? 'video' : IMG.test(abs) ? 'image' : kind, file: abs, fallback: false }
  return { kind, file: FALLBACK[kind], fallback: true }
}

// ── KARTU ART otomatis (gambar PNG/JPEG 1:1 bergaya kuno) — dipakai bila file foto belum ada ──
const ART_CACHE = path.join(global.chisaData, 'cache-carousel')
async function artBuffer(card, idx, total) {
  const A = require('./ancientsvg')
  const art = card.art || {}
  const title = ST.plain(art.title || card.title || 'CHISA AI').toUpperCase().replace(/[^A-Z0-9 .+\-]/g, '').trim() || 'CHISA AI'
  const sub = ST.plain(art.sub || '').replace(/[<>&]/g, ' ').slice(0, 44)
  const tag = ST.plain(art.tag || '').toUpperCase().replace(/[<>&]/g, ' ').slice(0, 28)
  const accent = /^#[0-9a-f]{6}$/i.test(art.accent || '') ? art.accent : A.C.gold
  const key = crypto.createHash('sha1').update(JSON.stringify([title, sub, tag, accent, idx, total, 'v2'])).digest('hex').slice(0, 16)
  const out = path.join(ART_CACHE, 'a' + key + '.jpg')
  try { if (fs.existsSync(out)) return fs.readFileSync(out) } catch {}
  const W = 800, H = 800, size = Math.max(34, Math.min(92, Math.floor(640 / (title.length * 0.9))))
  const num = String(idx + 1).padStart(2, '0')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${A.defs(accent)}</defs>
    ${A.frame(W, H, accent, 34)}
    <g opacity="0.95">${A.eye(W / 2 - 110, 150, 220)}</g>
    <path d="M150 330H650" stroke="url(#agold)" stroke-width="2" opacity="0.8"/><rect x="391" y="322" width="18" height="18" fill="url(#agold)" transform="rotate(45 400 331)"/>
    <text x="${W / 2}" y="${tag ? 440 : 450}" text-anchor="middle" font-family="${A.SERIF}" font-size="${size}" font-weight="700" fill="url(#agold)" letter-spacing="${Math.round(size / 8)}">${title}</text>
    ${sub ? `<text x="${W / 2}" y="${tag ? 505 : 520}" text-anchor="middle" font-family="${A.SERIF}" font-size="28" fill="${A.C.sand}" letter-spacing="3">${sub}</text>` : ''}
    ${tag ? `<g><rect x="${W / 2 - 40 - tag.length * 8}" y="548" width="${80 + tag.length * 16}" height="46" rx="23" fill="none" stroke="url(#agold)" stroke-width="2"/><text x="${W / 2}" y="580" text-anchor="middle" font-family="${A.SANS}" font-size="22" font-weight="700" fill="${A.C.goldL}" letter-spacing="4">${tag}</text></g>` : ''}
    <text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-family="${A.SERIF}" font-size="24" fill="${A.C.stone}" letter-spacing="8">${num} / ${String(total).padStart(2, '0')}</text>
  </svg>`
  const sharp = require('./sharp.js')
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer()
  try { fs.mkdirSync(ART_CACHE, { recursive: true }); fs.writeFileSync(out, buf) } catch {}
  return buf
}

// foto pengguna -> crop 1:1, maks 1080px, JPEG (kecil & seragam). Gagal -> file asli.
async function photoBuffer(file, card) {
  const raw = fs.readFileSync(file)
  if (card.square === false) return raw
  try {
    const sharp = require('./sharp.js')
    return await sharp(raw, { animated: false }).rotate().resize(1080, 1080, { fit: 'cover', position: card.focus || 'attention' }).jpeg({ quality: 86 }).toBuffer()
  } catch (e) { console.log('[carousel] resize gagal, pakai file asli:', e.message); return raw }
}

// teks kartu: baris pertama tebal-bergaya, sisanya apa adanya
function bodyText(card) {
  const lines = String(card.body || card.caption || ' ').split('\n')
  if (card.bold !== false && lines[0].trim()) lines[0] = ST.B(lines[0])
  return lines.join('\n')
}

function button(b, prefix) {
  const text = cut(b.text || b.label || 'Buka', 25)
  const t = String(b.type || (b.url ? 'url' : b.code ? 'copy' : 'reply')).toLowerCase()
  if (t === 'url') return { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: text, url: b.url, merchant_url: b.url }) }
  if (t === 'copy') return { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: text, id: String(b.id || 'copy'), copy_code: String(b.code || '') }) }
  // reply: id tanpa titik di depan otomatis diberi prefix bot
  const id = String(b.id || '')
  return { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: text, id: /^[.!#\/]/.test(id) ? id : prefix + id }) }
}

// build + kirim.  opts: { cards, title, body, footer, quoted }
async function send(sock, m, prefix, opts = {}) {
  const { generateWAMessageFromContent, prepareWAMessageMedia } = require('./baileys')
  const up = { upload: sock.waUploadToServer }
  const cfg = opts.cards ? { cards: opts.cards } : loadCards()
  if (!cfg) throw new Error('assets/carousel/cards.json tidak terbaca')
  const D = global.settingsDefault || {}
  const cards = []
  for (const [idx, c] of cfg.cards.entries()) {
    const med = resolveMedia(c)
    let header
    if (med.kind === 'video') {
      const h = await prepareWAMessageMedia({ video: fs.readFileSync(med.file), mimetype: 'video/mp4', gifPlayback: c.gif !== false }, up)
      if (c.gif !== false) h.videoMessage.gifPlayback = true
      header = { hasMediaAttachment: true, videoMessage: h.videoMessage }
    } else {
      let buf
      try { buf = med.fallback ? await artBuffer(c, idx, cfg.cards.length) : await photoBuffer(med.file, c) } catch (e) { console.log('[carousel] art gagal:', e.message); buf = fs.readFileSync(FALLBACK.image) }
      const h = await prepareWAMessageMedia({ image: buf }, up)
      header = { hasMediaAttachment: true, imageMessage: h.imageMessage }
    }
    if (c.title) header.title = cut(c.title, 60)
    const buttons = (c.buttons || []).slice(0, MAX_BTN).map(b => button(b, prefix))
    cards.push({
      header,
      body: { text: bodyText(c) },
      footer: { text: String(c.footer || '') },
      nativeFlowMessage: { buttons, messageParamsJson: '' },
    })
  }
  let topHeader = { title: String(opts.title ?? cfg.header ?? ''), hasMediaAttachment: false }
  if (opts.video) {   // menu gabungan: GIF/video menu jadi header pesan, kartu geser di bawah teks
    const h = await prepareWAMessageMedia({ video: opts.video, mimetype: 'video/mp4', gifPlayback: true }, up)
    h.videoMessage.gifPlayback = true
    topHeader = { hasMediaAttachment: true, videoMessage: h.videoMessage }
  }
  const interactiveMessage = {
    header: topHeader,
    body: { text: String(opts.body ?? cfg.body ?? ' ') || ' ' },
    footer: { text: String(opts.footer ?? cfg.footer ?? D.footer ?? '') },
    carouselMessage: { cards, messageVersion: 1 },
  }
  if (opts.contextInfo) interactiveMessage.contextInfo = opts.contextInfo
  const msg = generateWAMessageFromContent(m.chat, { viewOnceMessage: { message: {
    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
    interactiveMessage,
  } } }, { userJid: m.chat, quoted: require('./dquote').quoteOf(opts.quoted === undefined ? m : opts.quoted), upload: sock.waUploadToServer })
  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
  return { cards: cards.length, fallbacks: cfg.cards.filter(c => resolveMedia(c).fallback).length }
}

// preset: satu kartu per kategori dashboard .chisa (tombol 1 = buka kategori, tombol 2 = menu lengkap)
function categoryCards(viewer) {
  const DM = require('./chisamenu')
  const GL = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return DM.CATS.slice(0, MAX_CARDS).map((c, i) => ({
    art: { title: c.title.replace(/\b(Message Manager|Assistant|Intelligence|Center|Monitor|Lab)\b/gi, '').trim() || c.title, sub: c.title, tag: DM.entriesFor(c, viewer).length + ' FITUR' },
    title: c.title,
    body: `${c.title}\n${c.desc}\n\n◈ ${DM.entriesFor(c, viewer).length} fitur siap pakai`,
    footer: `Kategori ${GL[i] || i + 1} dari ${Math.min(DM.CATS.length, MAX_CARDS)}`,
    buttons: [{ type: 'reply', text: 'Buka Kategori', id: '.chisa ' + c.id }, { type: 'reply', text: 'Menu Lengkap', id: '.menu ' + c.menuId }],
  }))
}

// status file asset (untuk .carousel cek)
function status() {
  const cfg = loadCards(); if (!cfg) return null
  return cfg.cards.map((c, i) => { const r = resolveMedia(c); return { no: i + 1, kind: r.kind, file: c.file || '(kosong)', ada: !r.fallback } })
}

// dipanggil otomatis oleh .menu (lihat Chisa.js). mode: 'showcase' (cards.json) | 'kategori' (kartu per kategori) | 'off'.
// Gagal -> hanya dicatat di log, .menu tetap jalan normal.
async function sendForMenu(sock, m, prefix, mode, viewer) {
  mode = String(mode || 'off').toLowerCase()
  if (mode === 'off') return false
  try {
    if (mode === 'kategori') await send(sock, m, prefix, { cards: categoryCards(viewer), title: '✦ CHISA AI', body: 'Geser untuk lihat semua kategori fitur ➜', footer: 'Tap tombol di bawah kartu' })
    else await send(sock, m, prefix)
    return true
  } catch (e) { console.log('[menu carousel]', e.message); return false }
}

// MENU + CAROUSEL DALAM SATU PESAN: header GIF menu, teks menu sebagai body, kartu geser di bawahnya (+ quote WA Business & kartu judul seperti menu biasa)
async function sendMenu(sock, m, prefix, { video, body, footer, mode, viewer } = {}) {
  const MU = require('./menuui')
  const cards = String(mode) === 'kategori' ? categoryCards(viewer) : undefined
  return send(sock, m, prefix, { cards, video, title: '', body: ST.fx(body), footer: ST.fx(footer || ''), contextInfo: { ...MU.bizQuote(), externalAdReply: await MU.adCard() }, quoted: null })
}
module.exports = { send, sendMenu, sendForMenu, status, loadCards, categoryCards, DIR, CFG }
