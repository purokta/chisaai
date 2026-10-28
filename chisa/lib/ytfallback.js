/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
/*
✦ CHISA AI — by SHIPUR
Jalur CADANGAN downloader, dipakai saat yt-dlp gagal (YouTube sering memblokir IP server / mengubah sistemnya).
  • tikwm()   : TikTok video / slide / musik + statistik (tanpa watermark)
  • search()  : pencarian YouTube tanpa yt-dlp
  • youtube() : unduh YouTube lewat API Neoxr (bila apikey.neoxr terisi di config.js) lalu converter cadangan
*/
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const SHIELD = require('./shield')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const MAX_BYTES = () => Math.max(1, Number((global.downloader || {}).maxMB) || 100) * 1048576

// ───────────── TikTok lewat tikwm ─────────────
async function tikwm(url) {
  const base = 'https://www.tikwm.com'
  const abs = (u) => u ? (/^https?:/i.test(u) ? u : base + (u.startsWith('/') ? '' : '/') + u) : null
  let last
  for (let i = 0; i < 2; i++) {
    try {
      const r = await axios.get(base + '/api/', { params: { url, hd: 1 }, timeout: 30000, headers: { 'User-Agent': UA, Accept: 'application/json' } })
      const b = r.data, d = b && b.data
      if (!b || b.code !== 0 || !d) throw new Error((b && b.msg) || 'tikwm tidak mengembalikan data')
      const imgs = (d.images || []).map(abs).filter(Boolean)
      return {
        source: 'TikTok', type: imgs.length ? 'image' : 'video', id: d.id, title: d.title || '',
        author: d.author && d.author.nickname, username: d.author && d.author.unique_id,
        stats: { views: d.play_count, likes: d.digg_count, comments: d.comment_count, shares: d.share_count, saves: d.collect_count, downloads: d.download_count },
        duration: d.duration || null, createdAt: d.create_time,
        videoUrls: [abs(d.hdplay), abs(d.play)].filter(Boolean), images: imgs,
        audioUrls: [abs(d.music)].filter(Boolean), cover: abs(d.cover || d.origin_cover),
      }
    } catch (e) { last = e; if (/limit|too many|1 request/i.test(String(e.message))) await new Promise(r => setTimeout(r, 1500)) }
  }
  throw last
}

// ───────────── pencarian YouTube tanpa yt-dlp ─────────────
const toSec = (t) => { const p = String(t || '').split(':').map(Number); if (!p.length || p.some(isNaN)) return null; return p.reduce((a, x) => a * 60 + x, 0) }
async function search(query, n = 6) {
  const { searchYoutube } = require('./livenet/youtube-search')
  const list = await searchYoutube(query)
  return list.slice(0, n).map(v => ({
    id: v.videoId, url: `https://www.youtube.com/watch?v=${v.videoId}`, title: v.title, author: v.channel,
    duration: toSec(v.duration), views: v.views && v.views !== '-' ? v.views : null,
    thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`, live: false,
  }))
}

// ───────────── unduh berkas dari URL ke folder ─────────────
async function save(url, dest) {
  await SHIELD.assertSafeUrl(url)
  const res = await axios.get(url, { responseType: 'stream', timeout: 90000, ...SHIELD.axiosGuard, headers: { 'User-Agent': UA }, validateStatus: s => s === 200 })
  let got = 0
  await new Promise((ok, no) => {
    const w = fs.createWriteStream(dest)
    res.data.on('data', c => { got += c.length; if (got > MAX_BYTES()) res.data.destroy(new Error('melebihi batas ukuran')) })
    res.data.on('error', no); w.on('error', no); w.on('finish', ok); res.data.pipe(w)
  })
  if (got < 2048) throw new Error('berkas kosong')
  return dest
}

// ───────────── YouTube lewat API / converter ─────────────
const neoxrKey = () => { let k = global.apikey && global.apikey.neoxr; if (Array.isArray(k)) k = k[0]; return String(k || '').trim() }
async function viaNeoxr(url, kind) {
  const key = neoxrKey()
  if (!key) throw new Error('API key neoxr kosong (isi apikey.neoxr di config.js)')
  const q = kind === 'audio' ? 'type=audio&quality=128kbps' : 'type=video&quality=480p'
  const r = await axios.get(`https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(url)}&${q}&apikey=${encodeURIComponent(key)}`, { timeout: 120000, validateStatus: () => true })
  const b = r.data
  if (r.status !== 200 || !b || b.status !== true) throw new Error((b && (b.message || b.msg)) || `HTTP ${r.status}`)
  const link = (b.data && b.data.url) || b.url
  if (!link) throw new Error('tanpa link unduhan')
  return { link, title: b.title || (b.data && b.data.title) || '' }
}
async function viaConverter(url, kind) {
  const { downloadYoutube } = require('./livenet/youtube-search')
  const r = await downloadYoutube(url, kind === 'audio' ? 'mp3' : 'mp4')
  if (!r || !r.status || !r.result || !r.result.download_url) throw new Error((r && r.message) || 'converter gagal')
  return { link: r.result.download_url, title: r.result.title || '' }
}
// Mengembalikan { file, title } atau melempar galat gabungan
async function youtube(url, kind, dir) {
  const errs = []
  fs.mkdirSync(dir, { recursive: true })
  for (const [name, fn] of [['neoxr', viaNeoxr], ['converter', viaConverter]]) {
    try {
      const { link, title } = await fn(url, kind)
      const ext = kind === 'audio' ? 'mp3' : 'mp4'
      const file = await save(link, path.join(dir, `yt_${Date.now()}.${ext}`))
      return { file, title }
    } catch (e) { errs.push(`${name}: ${e.message}`); console.log('[unduh] cadangan', name, 'gagal:', e.message) }
  }
  throw new Error(errs.join(' | '))
}

module.exports = { tikwm, search, youtube, save }
