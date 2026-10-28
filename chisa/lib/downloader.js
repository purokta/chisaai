/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
/*
✦ CHISA AI — by SHIPUR
Helper tampilan & pengiriman untuk fitur unduh video sosmed.
Tanpa emoji: hanya elemen kuno (hieroglif), garis, dan tabel monospasi.
*/
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const S = require('./settingsdb')
const ST = require('./style')
const Y = require('./ytdlp')
const SHIELD = require('./shield')

const B = ST.B
const HR = '━━━━━━━━━━━━━━━━━━━━'
const URL_RE = /https?:\/\/[^\s<>"'`]+/i

// URL dari teks perintah, atau dari pesan yang di-reply
function pickUrl(text, quoted) {
  const t = String(text || '').match(URL_RE) || String((quoted && (quoted.text || quoted.caption)) || '').match(URL_RE)
  return t ? t[0].replace(/[)\].,;!?]+$/, '') : null
}

const nf = new Intl.NumberFormat('id-ID')
const has = (v) => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && !Number.isFinite(v))
// angka -> 1.234.567 ; teks seperti "1.2M" dibiarkan apa adanya
const num = (v) => !has(v) ? '-' : (isNaN(Number(v)) ? String(v) : nf.format(Number(v)))
function dur(sec) {
  if (!has(sec) || isNaN(Number(sec))) return null
  const s = Math.round(Number(sec))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60, p = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`
}
function when(ts) {
  if (!has(ts)) return null
  const n = Number(ts), d = new Date(n < 1e11 ? n * 1000 : n); if (isNaN(d)) return null
  try { return d.toLocaleDateString('id-ID', { timeZone: S.get('timezone') || 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }) } catch { return d.toISOString().slice(0, 10) }
}
function size(bytes) {
  if (!has(bytes) || !Number(bytes)) return null
  const u = ['B', 'KB', 'MB', 'GB']; let v = Number(bytes), i = 0; while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i ? 1 : 0).replace('.', ',')} ${u[i]}`
}

// Tabel monospasi (dibungkus ``` agar sejajar di WhatsApp). Isi dibuat ASCII supaya lebar kolom pasti.
function table(rows) {
  const clean = (s) => String(s).normalize('NFKC').replace(/[^\x20-\x7E]/g, '').trim() || '-'
  const r = rows.map(([a, b]) => [clean(a), clean(b)])
  const w1 = Math.max(...r.map(x => x[0].length)), w2 = Math.max(...r.map(x => x[1].length))
  const line = (l, m, rr) => `${l}${'─'.repeat(w1 + 2)}${m}${'─'.repeat(w2 + 2)}${rr}`
  return '```\n' + [line('┌', '┬', '┐'), ...r.map(([a, b]) => `│ ${a.padEnd(w1)} │ ${b.padStart(w2)} │`), line('└', '┴', '┘')].join('\n') + '\n```'
}

/**
 * meta: { source, title, author, username, stats:{views,likes,comments,shares,saves,downloads}, duration, createdAt, resolution, filesize }
 * mode: 'video' | 'audio' | 'image'
 */
function caption(meta, mode = 'video') {
  const bot = S.get('botname') || '✦ 𝐂𝐇𝐈𝐒𝐀 𝐀𝐈'
  const st = meta.stats || {}
  const rows = [['Penonton', num(st.views)], ['Suka', num(st.likes)], ['Komentar', num(st.comments)], ['Bagikan', num(st.shares)]]
  if (has(st.saves)) rows.push(['Disimpan', num(st.saves)])
  if (has(st.downloads)) rows.push(['Diunduh', num(st.downloads)])
  const d = dur(meta.duration); if (d) rows.push(['Durasi', d])
  const t = when(meta.createdAt); if (t) rows.push(['Diunggah', t])
  if (meta.resolution && mode === 'video') rows.push(['Resolusi', meta.resolution])
  const sz = size(meta.filesize); if (sz) rows.push(['Ukuran', sz])
  if (mode === 'image' && meta.count) rows.push(['Gambar', String(meta.count)])

  const title = ST.cut(String(meta.title || '').replace(/\s+/g, ' ').trim() || 'Tanpa judul', 140)
  const who = meta.author ? (meta.username && !String(meta.author).includes(meta.username) ? `${meta.author} (@${String(meta.username).replace(/^@/, '')})` : meta.author) : (meta.username ? '@' + String(meta.username).replace(/^@/, '') : '')
  return [
    bot,
    B(`${String(meta.source || 'MEDIA').toUpperCase()} ${mode === 'audio' ? 'AUDIO' : mode === 'image' ? 'GAMBAR' : 'DOWNLOADER'}`),
    HR,
    `✦ ${B('Judul')}   : ${title}`,
    ...(who ? [`✦ ${B('Kreator')} : ${ST.cut(who, 80)}`] : []),
    '',
    table(rows),
    HR,
    '✦ by Chisa AI',
  ].join('\n')
}

// ───────────────────────── unduh berkas dari URL langsung ─────────────────────────
const MAX = () => Math.max(1, Number(Y.cfg().maxMB) || 100) * 1048576
async function fetchToFile(urls, dest, headersList) {
  let last
  for (const u of [].concat(urls).filter(Boolean)) {
    for (const h of headersList || [{ 'User-Agent': Y.DESKTOP_UA, Referer: 'https://www.tiktok.com/' }, {}]) {
      try {
        await SHIELD.assertSafeUrl(u)
        const res = await axios.get(u, { responseType: 'stream', timeout: 60000, ...SHIELD.axiosGuard, headers: h, validateStatus: s => s === 200 })
        const len = Number(res.headers['content-length'] || 0)
        if (len > MAX()) { res.data.destroy(); throw Object.assign(new Error(`Ukuran file melebihi batas ${Y.cfg().maxMB} MB.`), { final: true }) }
        let got = 0
        await new Promise((ok, no) => {
          const w = fs.createWriteStream(dest)
          res.data.on('data', c => { got += c.length; if (got > MAX()) { res.data.destroy(new Error('melebihi batas ukuran')); } })
          res.data.on('error', no); w.on('error', no); w.on('finish', ok); res.data.pipe(w)
        })
        if (got < 1024) throw new Error('berkas kosong')
        return dest
      } catch (e) { last = e; if (e.final) throw e }
    }
  }
  throw last || new Error('tidak ada URL yang bisa diunduh')
}
async function fetchBuffer(urls) {
  let last
  for (const u of [].concat(urls).filter(Boolean)) {
    for (const h of [{ 'User-Agent': Y.DESKTOP_UA, Referer: 'https://www.tiktok.com/' }, {}]) {
      try { await SHIELD.assertSafeUrl(u); const r = await axios.get(u, { responseType: 'arraybuffer', timeout: 45000, ...SHIELD.axiosGuard, headers: h, maxContentLength: 25 * 1048576 }); if (r.data && r.data.length > 512) return Buffer.from(r.data) } catch (e) { last = e }
    }
  }
  throw last || new Error('gambar tidak bisa diunduh')
}

// ───────────────────────── kirim ─────────────────────────
const MIME = { mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', mov: 'video/quicktime', mp3: 'audio/mpeg', m4a: 'audio/mp4', opus: 'audio/ogg; codecs=opus', ogg: 'audio/ogg', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
async function sendFile(sock, m, file, kind, cap) {
  const ext = path.extname(file).slice(1).toLowerCase(), mimetype = MIME[ext] || 'application/octet-stream'
  const bytes = fs.statSync(file).size, opt = { quoted: m }
  if (kind === 'image') return sock.sendMessage(m.chat, { image: { url: file }, ...(cap ? { caption: cap } : {}) }, opt)
  if (kind === 'audio') return sock.sendMessage(m.chat, { audio: { url: file }, mimetype: ext === 'mp3' ? 'audio/mpeg' : mimetype, ptt: false }, opt)
  const limit = (Number(Y.cfg().videoMaxMB) || 64) * 1048576
  if (bytes > limit || !['mp4', 'mov'].includes(ext)) return sock.sendMessage(m.chat, { document: { url: file }, mimetype, fileName: path.basename(file), ...(cap ? { caption: cap } : {}) }, opt)
  return sock.sendMessage(m.chat, { video: { url: file }, mimetype: 'video/mp4', ...(cap ? { caption: cap } : {}) }, opt)
}
// kartu info untuk audio (sampul + caption), jatuh ke teks biasa bila sampul gagal
async function sendCard(sock, m, cap, coverUrl) {
  if (coverUrl) { try { const buf = await fetchBuffer(coverUrl); return await sock.sendMessage(m.chat, { image: buf, caption: cap }, { quoted: m }) } catch {} }
  return sock.sendMessage(m.chat, { text: cap }, { quoted: m })
}

// satu pengguna satu unduhan pada satu waktu
const busy = new Set()
const lock = (id) => busy.has(id) ? false : (busy.add(id), true)
const unlock = (id) => busy.delete(id)

module.exports = { pickUrl, num, dur, when, size, table, caption, fetchToFile, fetchBuffer, sendFile, sendCard, lock, unlock, HR, B }
