// Downloader TikTok / Instagram / YouTube / Facebook.
// Urutan: (TikTok) tikwm -> provider API di config.js -> yt-dlp lokal.
const fs = require('fs')
const path = require('path')
const config = require('../config')
const http = require('./http')
const { TMP, run, rm } = require('./ffmpeg')

const cfg = config.downloader

function detect(url) {
  if (/(tiktok\.com|vt\.tiktok|vm\.tiktok)/i.test(url)) return 'tiktok'
  if (/(instagram\.com|instagr\.am)/i.test(url)) return 'instagram'
  if (/(youtube\.com|youtu\.be)/i.test(url)) return 'youtube'
  if (/(facebook\.com|fb\.watch|fb\.com|fb\.me)/i.test(url)) return 'facebook'
  return null
}

function extractUrl(text) {
  const m = String(text || '').match(/https?:\/\/[^\s]+/i)
  return m ? m[0] : null
}

// ---------- pembaca JSON generik: cari link media di respons API apa pun ----------
const BAD_KEY = /thumb|cover|poster|avatar|icon|profile|preview|logo|author|music_info|wm|watermark/i

function walk(node, key, out, depth = 0) {
  if (node == null || depth > 7) return
  if (typeof node === 'string') {
    if (/^https?:\/\//i.test(node)) out.push({ key, url: node })
  } else if (Array.isArray(node)) {
    for (const n of node) walk(n, key, out, depth + 1)
  } else if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, k, out, depth + 1)
  }
}

function classify(url) {
  const u = url.split('?')[0].toLowerCase()
  if (/\.(mp4|mov|webm|mkv)$/.test(u)) return 'video'
  if (/\.(mp3|m4a|aac|opus|ogg|wav)$/.test(u)) return 'audio'
  if (/\.(jpe?g|png|webp)$/.test(u)) return 'image'
  return 'unknown'
}

function rank(key) {
  if (/hd|nowm|no_wm|original|high/i.test(key)) return 0
  if (/video|download|dl/i.test(key)) return 1
  if (/url|link|play|src|media/i.test(key)) return 2
  return 3
}

function extract(json, wantAudio) {
  const all = []
  walk(json, '', all)
  const title = String(json?.data?.title || json?.result?.title || json?.title || '').slice(0, 300)
  const good = all.filter(c => !BAD_KEY.test(c.key))

  let pool
  if (wantAudio) {
    pool = good.filter(c => classify(c.url) === 'audio' || /mp3|audio|dl|download|url|link/i.test(c.key))
  } else {
    pool = good.filter(c => classify(c.url) === 'video')
    if (!pool.length) pool = good.filter(c => classify(c.url) === 'unknown' && /video|dl|download|url|link|play|hd|sd|media|src/i.test(c.key))
    if (!pool.length) pool = good.filter(c => classify(c.url) === 'image')
  }
  if (!pool.length) return { title, items: [] }

  // kelompokkan per nama key: key beda = kualitas beda (ambil terbaik), key sama = beberapa item (carousel)
  const groups = new Map()
  for (const c of pool) {
    if (!groups.has(c.key)) groups.set(c.key, [])
    groups.get(c.key).push(c)
  }
  const best = [...groups.entries()].sort((a, b) => rank(a[0]) - rank(b[0]))[0][1]
  const seen = new Set()
  const items = []
  for (const c of best) {
    if (seen.has(c.url)) continue
    seen.add(c.url)
    items.push({ url: c.url })
    if (items.length >= 5) break
  }
  return { title, items }
}

// ---------- ambil file dari link ----------
async function fetchFiles(items, wantAudio) {
  const files = []
  for (const it of items) {
    const { buffer, mime } = await http.getBuffer(it.url, { maxMB: cfg.maxMB })
    let type
    if (mime.startsWith('video/')) type = 'video'
    else if (mime.startsWith('image/')) type = 'image'
    else if (mime.startsWith('audio/')) type = 'audio'
    else if (mime === 'application/octet-stream' || mime === 'binary/octet-stream' || !mime) {
      const guess = classify(it.url)
      type = guess !== 'unknown' ? guess : wantAudio ? 'audio' : 'video'
    } else continue // html / json = bukan media
    if (buffer.length < 1000) continue
    files.push({ type, buffer })
  }
  return files
}

// ---------- provider: TikTok (tikwm) ----------
async function viaTikwm(url, wantAudio) {
  const api = 'https://www.tikwm.com/api/?hd=1&url=' + encodeURIComponent(url)
  let j
  for (let i = 0; i < 2; i++) {
    j = await http.getJson(api, { timeout: cfg.timeoutMs })
    if (j.code === 0) break
    await new Promise(r => setTimeout(r, 1500)) // tikwm membatasi ~1 request/detik
  }
  if (j.code !== 0 || !j.data) throw new Error(j.msg || 'tikwm gagal')
  const d = j.data
  const abs = u => (u && u.startsWith('/') ? 'https://www.tikwm.com' + u : u)
  let items
  if (wantAudio) items = [{ url: abs(d.music) }]
  else if (Array.isArray(d.images) && d.images.length) items = d.images.slice(0, 5).map(u => ({ url: abs(u) }))
  else items = [{ url: abs(d.hdplay || d.play) }]
  const files = await fetchFiles(items.filter(i => i.url), wantAudio)
  if (!files.length) throw new Error('tikwm: file kosong')
  return { title: d.title || '', files }
}

// ---------- provider: API di config.js ----------
async function viaApis(platform, url, wantAudio) {
  const list = (platform === 'youtube' && wantAudio ? cfg.providers.youtubeAudio : cfg.providers[platform]) || []
  let lastErr
  for (const tpl of list) {
    try {
      const json = await http.getJson(tpl.replace('{url}', encodeURIComponent(url)), { timeout: cfg.timeoutMs })
      const found = extract(json, wantAudio)
      if (!found.items.length) throw new Error('API tidak mengembalikan media')
      const files = await fetchFiles(found.items, wantAudio)
      if (files.length) return { title: found.title, files }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('Tidak ada provider API untuk ' + platform)
}

// ---------- provider: yt-dlp (lokal di Termux) ----------
async function viaYtdlp(url, wantAudio) {
  const dir = fs.mkdtempSync(path.join(TMP, 'dl-'))
  const args = ['--no-playlist', '--no-warnings', '--max-filesize', cfg.maxMB + 'M', '-o', path.join(dir, '%(id)s.%(ext)s')]
  if (wantAudio) args.push('-x', '--audio-format', 'mp3')
  else
    args.push(
      '-f', 'bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/b[ext=mp4]/b',
      '--merge-output-format', 'mp4'
    )
  args.push(url)
  try {
    await run(cfg.ytdlp, args, { timeout: 240000 })
    const names = fs.readdirSync(dir).filter(f => !f.endsWith('.part') && !f.endsWith('.ytdl'))
    const files = []
    for (const n of names.slice(0, 5)) {
      const ext = path.extname(n).toLowerCase()
      const type = ['.mp3', '.m4a', '.opus', '.ogg'].includes(ext)
        ? 'audio'
        : ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
          ? 'image'
          : 'video'
      files.push({ type, buffer: fs.readFileSync(path.join(dir, n)) })
    }
    if (!files.length) throw new Error('yt-dlp tidak menghasilkan file')
    return { title: '', files }
  } finally {
    rm(dir)
  }
}

async function download(url, platform, wantAudio = false) {
  const errors = []
  const steps = []
  if (platform === 'tiktok') steps.push(['tikwm', () => viaTikwm(url, wantAudio)])
  steps.push(['api', () => viaApis(platform, url, wantAudio)])
  steps.push(['yt-dlp', () => viaYtdlp(url, wantAudio)])

  for (const [name, fn] of steps) {
    try {
      return await fn()
    } catch (e) {
      if (name === 'api' && /Tidak ada provider/.test(e.message)) continue
      errors.push(`${name}: ${e.code === 'ENOENT' ? 'belum terpasang' : String(e.message).split('\n')[0].slice(0, 80)}`)
    }
  }
  const err = new Error('Gagal mengunduh. Link mungkin privat/salah, atau server downloader sedang down.\n(' + errors.join(' | ') + ')')
  err.userMessage = err.message
  throw err
}

// cari video YouTube lewat yt-dlp (tanpa API key). Hasil: [{title, id, url, duration, channel}]
async function ytSearch(query, n = 5) {
  const { stdout } = await run(
    cfg.ytdlp,
    ['--flat-playlist', '--no-warnings', '--print', '%(title)s\t%(id)s\t%(duration_string)s\t%(channel)s', `ytsearch${n}:${query}`],
    { timeout: 60000 }
  )
  return stdout
    .split('\n')
    .map(l => l.split('\t'))
    .filter(a => a.length >= 2 && a[1])
    .map(([title, id, duration, channel]) => ({ title, id, url: 'https://www.youtube.com/watch?v=' + id, duration, channel }))
}

module.exports = { detect, extractUrl, download, ytSearch, _extract: extract }
