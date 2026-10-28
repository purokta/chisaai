/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
/*
✦ CHISA AI — by SHIPUR
Mesin downloader berbasis scraper Mori (lib/mori-scrapers.js) dengan tampilan Chisa AI.

  • FUNGSI  : scraper Mori (Instagram, TikTok, YouTube, Facebook, X/Twitter, Spotify, Pinterest, Apple Music,
              Bandcamp, Pixiv, Threads, RedNote, Douyin, Bilibili, Reddit, TeraBox).
  • TAMPILAN: caption, kartu audio, dan pengiriman file tetap memakai helper Chisa AI (lib/downloader.js).
  • CADANGAN: bila scraper Mori gagal, jalur yt-dlp Chisa AI yang lama tetap dicoba (kecuali platform khusus audio).

Dipakai oleh plugins/unduh/dl.js (generik) dan plugin per platform (igdl, spotifydl, fbdl, redditdl, teraboxdl, dst.).
*/
const fs = require('fs')
const path = require('path')
const Y = require('./ytdlp')
const D = require('./downloader')
const M = require('./mori-scrapers')

const MAX_ITEMS = 10
const IMG = /^(jpe?g|png|webp|gif|avif|heic)$/i
const AUD = /^(mp3|m4a|aac|ogg|opus|flac|wav)$/i
const VID = /^(mp4|m4v|mov|webm|mkv)$/i

const extOf = (u) => { try { return path.extname(new URL(u).pathname).slice(1).toLowerCase() } catch { return '' } }

// ───────────────────────── klasifikasi & kualitas ─────────────────────────
// -> 'image' | 'audio' | 'video' | 'file' | 'cover'  (cover = sampul/lirik, bukan media utama)
function classify(item, label, pf) {
  const t = String(label || '').toLowerCase(), ext = extOf(item.url)
  if (/cover|lyric|artwork|poster|thumbnail/.test(t)) return 'cover'
  if (ext === 'zip' || /ugoira|\bzip\b/.test(t)) return 'file'
  if (IMG.test(ext)) return 'image'
  if (AUD.test(ext)) return 'audio'
  if (VID.test(ext)) return 'video'
  if (/photo|image|picture|gambar|\bpage\b|\bjpe?g\b|\bpng\b|\bwebp\b/.test(t)) return 'image'
  if (/mp3|audio|music|m4a|aac|flac|\d{2,3}\s*kbps|\b\d{2,3}k\b/.test(t) || /^\s*(64|96|128|160|192|256|320)\s*$/.test(t)) return 'audio'
  if (/video|mp4|\d{3,4}\s*p\b|\bhd\b|\bsd\b/.test(t)) return 'video'
  return pf && pf.audio ? 'audio' : 'video'
}

// angka kualitas dari label ("720p", "HD", "320", "128kbps", "Full HD"), atau null bila label tidak memuat kualitas.
// Label ber-watermark dinilai sangat rendah supaya versi tanpa watermark selalu menang.
function qual(label) {
  const t = String(label || '').toLowerCase()
  let n = null, m
  if ((m = t.match(/(\d{3,4})\s*p\b/))) n = +m[1]
  else if (/\b(8k|4320)/.test(t)) n = 4320
  else if (/\b(4k|2160)/.test(t)) n = 2160
  else if (/\b(2k|1440)/.test(t)) n = 1440
  else if (/full\s*hd|fhd|\b1080/.test(t)) n = 1080
  else if (/\bhd\b|high/.test(t)) n = 720
  else if (/\bsd\b|low/.test(t)) n = 360
  else if ((m = t.match(/\b(\d{2,4})\s*(k|kbps)\b/))) n = +m[1]
  else if ((m = t.match(/^\s*(\d{2,3})\s*$/))) n = +m[1]
  else if ((m = t.match(/\b(\d{3,4})\s*x\s*(\d{3,4})\b/))) n = Math.min(+m[1], +m[2])
  if (/watermark|\bwm\b|_wm/.test(t) && !/no[\s_-]?watermark|nowm|tanpa/.test(t)) n = (n || 0) - 10000
  return n
}

// Pilih item yang akan dikirim dari hasil scraper Mori.
//  - isMirror (alternatif kualitas/duplikat menurut Mori) dibuang, kecuali tidak ada yang lain.
//  - Beberapa baris kualitas berbeda dari media yang sama -> ambil yang terbaik.
//  - Carousel/slide (banyak item tanpa label kualitas) -> semua dikirim (maks 10), urutan asli dijaga.
//  - Platform audio (Spotify/Apple Music/Bandcamp) selalu mode audio; sampul dipakai sebagai thumbnail, bukan dikirim.
function choose(result, pf, wantAudio) {
  const raw = (Array.isArray(result && result.downloads) ? result.downloads : []).filter(x => x && /^https?:\/\//i.test(String(x.url || '')))
  const seen = new Set(), uniq = raw.filter(x => !seen.has(x.url) && seen.add(x.url))
  const primary = uniq.filter(x => !x.isMirror)
  const items = (primary.length ? primary : uniq).map(x => {
    const label = `${x.type || ''} ${x.quality || ''}`.trim()
    return { ...x, label, kind: classify(x, label, pf), q: qual(label) }
  })
  const best = (arr) => arr.slice().sort((a, b) => (b.q || 0) - (a.q || 0))[0]
  const cover = (items.find(i => i.kind === 'cover') || {}).url || null
  const audios = items.filter(i => i.kind === 'audio')
  const audioMode = !!(pf && pf.audio) || !!wantAudio

  if (audioMode) {
    const multi = pf && pf.id === 'bandcamp'   // album Bandcamp = banyak lagu berbeda
    return { mode: 'audio', cover, items: audios.length ? (multi ? audios.slice(0, MAX_ITEMS) : [best(audios)]) : [] }
  }

  const videos = items.filter(i => i.kind === 'video'), images = items.filter(i => i.kind === 'image'), files = items.filter(i => i.kind === 'file')
  const withQ = videos.filter(v => v.q !== null), plain = videos.filter(v => v.q === null)
  let vids = [...(withQ.length ? [best(withQ)] : []), ...plain]
  let imgs = images
  if (pf && pf.single) { if (vids.length) { vids = vids.slice(0, 1); imgs = [] } else imgs = imgs.slice(0, 1) }
  const keep = new Set([...vids, ...imgs, ...files])
  const out = items.filter(i => keep.has(i)).slice(0, MAX_ITEMS)
  if (!out.length && audios.length) return { mode: 'audio', cover, items: [best(audios)] }   // mis. TikTok hanya musik
  return { mode: 'media', cover, items: out }
}

// ───────────────────────── engine ─────────────────────────
const HOST = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return 'MEDIA' } }

function usage({ audio, prefix, cmd, label, example }) {
  const list = M.PLATFORM_LIST.map(p => p.label).join(', ')
  return `${D.B(audio ? 'UNDUH AUDIO' : (label ? `UNDUH ${String(label).toUpperCase()}` : 'UNDUH VIDEO'))}\n${D.HR}\nKirim tautannya setelah perintah, atau balas pesan yang berisi tautan.\n\nContoh:\n${prefix}${cmd} ${example || 'https://youtu.be/xxxxxxxxxxx'}\n\nDidukung: ${list}.\nKhusus TikTok, gunakan ${prefix}tiktok untuk opsi lebih lengkap.`
}

async function viaMori(ctx, url, wantAudio, dir) {
  const { sock, m } = ctx
  const pf = M.platformOf(url)
  if (!pf) return { done: false, why: 'domain tidak didukung scraper Mori' }
  const scraped = await M.scrapeForUrl(url)
  if (!(scraped && scraped.status && scraped.result)) return { done: false, pf, why: (scraped && scraped.message) || 'scraper Mori tidak memberi hasil' }
  const result = scraped.result
  const pick = choose(result, pf, wantAudio)
  if (!pick.items.length) return { done: false, pf, why: 'tidak ada tautan media yang cocok' }

  const files = []
  for (let i = 0; i < pick.items.length; i++) {
    const item = pick.items[i]
    let ext = extOf(item.url)
    if (!/^(mp4|m4v|mov|webm|mp3|m4a|aac|ogg|opus|jpg|jpeg|png|webp|gif|zip)$/i.test(ext)) ext = item.kind === 'audio' ? 'mp3' : item.kind === 'image' ? 'jpg' : item.kind === 'file' ? 'zip' : 'mp4'
    const dest = path.join(dir, `mori-${Date.now()}-${i}.${ext}`)
    try {
      await D.fetchToFile([item.url], dest, [{ 'User-Agent': Y.DESKTOP_UA, Referer: url }, { 'User-Agent': Y.DESKTOP_UA }, {}])
      files.push({ file: dest, kind: item.kind === 'image' ? 'image' : item.kind === 'audio' ? 'audio' : 'video', ext })
    } catch (e) {
      console.log('[mori-downloader-link]', e.message)
      try { if (fs.existsSync(dest)) fs.unlinkSync(dest) } catch {}
    }
  }
  if (!files.length) return { done: false, pf, why: 'tautan media tidak dapat diunduh' }

  const info = { source: pf.label, title: result.title || 'Media', author: result.author || '', thumbnail: result.thumbnail || pick.cover || null }
  if (pick.mode === 'audio') {
    await D.sendCard(sock, m, D.caption(info, 'audio'), info.thumbnail)
    for (const f of files) await D.sendFile(sock, m, f.file, 'audio')
  } else {
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const cap = i === 0 ? D.caption({ ...info, count: files.length > 1 ? files.length : undefined, filesize: fs.statSync(f.file).size }, f.kind === 'image' ? 'image' : 'video') : undefined
      await D.sendFile(sock, m, f.file, f.kind, cap)
    }
  }
  return { done: true, pf }
}

async function viaYtdlp(ctx, url, audio, dir) {
  const { sock, m } = ctx
  const { items } = await Y.fetchMedia(url, { kind: audio ? 'audio' : 'video', dir })
  const first = items[0], info = first.info
  if (audio) {
    await D.sendCard(sock, m, D.caption(info, 'audio'), info.thumbnail)
    for (const it of items) await D.sendFile(sock, m, it.file, 'audio')
    return
  }
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (it.kind === 'video') it.file = await Y.ensureCompat(it.file, it.info.vcodec)
    const mode = it.kind === 'image' ? 'image' : 'video'
    const cap = i === 0 ? D.caption({ ...info, filesize: fs.statSync(it.file).size, count: items.length > 1 ? items.length : undefined }, mode) : undefined
    await D.sendFile(sock, m, it.file, it.kind, cap)
  }
}

/**
 * opt: { audio, label, cmd, example }
 *   audio : paksa mode audio (mis. .dlmp3). Platform audio-only selalu audio walau opt.audio false.
 */
async function grab(ctx, opt = {}) {
  const { m, reply, text, prefix } = ctx
  const audio = !!opt.audio
  const url = D.pickUrl(text, m.quoted)
  if (!url) return reply(usage({ audio, prefix, cmd: opt.cmd || (audio ? 'dlmp3' : 'dl'), label: opt.label, example: opt.example }))
  if (!D.lock(m.sender)) return reply('Unduhanmu yang sebelumnya masih berjalan. Tunggu selesai dulu ya.')
  const dir = Y.tmpDir()
  try {
    await reply('Memproses tautan, mohon tunggu...')
    let why = ''
    try {
      const r = await viaMori(ctx, url, audio, dir)
      if (r.done) return
      why = r.why || ''
      // platform khusus audio tidak punya cadangan yt-dlp yang berguna (DRM / bukan situs video)
      if (r.pf && r.pf.audio && r.pf.id !== 'bandcamp') return reply(`Gagal mengunduh dari ${r.pf.label}.\n> ${why}\n\n_Layanan pihak ketiga mungkin sedang bermasalah atau tautan tidak valid. Coba lagi beberapa saat lagi._`)
    } catch (e) {
      why = e.message
      console.log('[mori-scraper]', e.message)
    }
    // cadangan lama Chisa (yt-dlp)
    try { await viaYtdlp(ctx, url, audio, dir) } catch (e) {
      console.log('[unduh]', e.message)
      reply(`Gagal mengunduh.\n> ${e.message}${why && why !== e.message ? `\n> Scraper Mori: ${why}` : ''}`)
    }
  } finally { D.unlock(m.sender); Y.cleanup(dir) }
}

// ───────────────────────── pabrik plugin per platform ─────────────────────────
// Satu file plugin kecil per platform (pola sama seperti plugins/sticker/bratXXX.js).
function plugin({ name, alias = [], platform, label, audio = false, example, desc }) {
  const pf = M.PLATFORM_LIST.find(p => p.id === platform)
  return {
    name, alias, category: 'unduh', cmds: [name],
    desc: desc || `Unduh ${label || (pf && pf.label) || name} lewat scraper Mori`,
    run: (ctx) => grab(ctx, { audio: audio || !!(pf && pf.audio), label: label || (pf && pf.label), cmd: name, example }),
  }
}

module.exports = { grab, plugin, choose, classify, qual, usage }
