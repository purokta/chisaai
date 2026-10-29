/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
/*
✦ CHISA AI — by SHIPUR
Mesin unduh video sosmed berbasis yt-dlp (YouTube, Instagram, TikTok, X/Twitter, Facebook, dan ribuan situs lain).
Cara kerja: cari yt-dlp -> unduh otomatis bila belum ada -> ekstrak + unduh -> coba ulang dengan variasi bila gagal.
*/
const { execFile } = require('child_process')
const SHIELD = require('./shield')
const fs = require('fs')
const os = require('os')
const path = require('path')
const axios = require('axios')

const BIN_DIR = path.join(__dirname, 'bin')
const REL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download'
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// Atur lewat global.downloader di config.js
const cfg = () => Object.assign({
  maxMB: 100,          // batas ukuran file yang boleh diunduh
  videoMaxMB: 64,      // di atas ini dikirim sebagai dokumen (video WhatsApp > ~64 MB sering gagal)
  height: 720,         // kualitas video maksimum
  maxDurationMin: 60,  // batas durasi (menit)
  attempts: 3,         // jumlah percobaan per permintaan
  timeoutSec: 240,     // batas waktu satu proses yt-dlp
  concurrency: 2,      // unduhan yang boleh berjalan bersamaan
  proxy: '',           // contoh: http://user:pass@host:port
  cookies: '',         // path file cookies.txt (format Netscape), opsional
  cookiesFromBrowser: '', // contoh: 'chrome' / 'firefox' / 'chrome:Profile 1' (hanya jika bot jalan di PC yang ada browsernya)
  ytdlpPath: '',       // paksa path yt-dlp tertentu, opsional
}, global.downloader || {})

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const run = (cmd, args, opts = {}) => new Promise((resolve, reject) => {
  execFile(cmd, args, { windowsHide: true, maxBuffer: 64 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
    if (err) { err.stdout = String(stdout || ''); err.stderr = String(stderr || ''); return reject(err) }
    resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') })
  })
})

// ───────────────────────── binary ─────────────────────────
let inv = null, setupP = null, lastErr = '', lastTry = 0

async function verify(command, prefix = []) {
  try { const { stdout } = await run(command, [...prefix, '--version'], { timeout: 20000 }); return /^\d{4}\.\d{2}/.test(stdout.trim()) } catch { return false }
}
async function download(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const tmp = dest + '.part'
  const res = await axios.get(url, { responseType: 'stream', timeout: 120000, maxRedirects: 8 })
  await new Promise((ok, no) => { const w = fs.createWriteStream(tmp); res.data.pipe(w); w.on('finish', ok); w.on('error', no); res.data.on('error', no) })
  fs.renameSync(tmp, dest)
}
function standaloneUrl() {
  const p = os.platform(), a = os.arch()
  if (p === 'win32') return `${REL}/${a === 'x64' ? 'yt-dlp.exe' : 'yt-dlp_x86.exe'}`
  if (p === 'darwin') return `${REL}/yt-dlp_macos`
  if (p === 'linux') return a === 'x64' ? `${REL}/yt-dlp_linux` : a === 'arm64' ? `${REL}/yt-dlp_linux_aarch64` : null
  return null
}
async function python() {
  for (const c of ['python3', 'python']) { try { const { stdout } = await run(c, ['--version'], { timeout: 10000 }); if (/Python 3\.(9|\d{2})/.test(stdout)) return c } catch {} }
  return null
}
async function resolveBinary() {
  const fails = [], c = cfg()
  if (c.ytdlpPath) { if (await verify(c.ytdlpPath)) return { command: c.ytdlpPath, prefix: [], source: 'env' }; fails.push(`ytdlpPath (${c.ytdlpPath}) tidak jalan`) }
  if (await verify('yt-dlp')) return { command: 'yt-dlp', prefix: [], source: 'system' }
  const managed = path.join(BIN_DIR, 'yt-dlp' + (os.platform() === 'win32' ? '.exe' : ''))
  if (fs.existsSync(managed) && await verify(managed)) return { command: managed, prefix: [], source: 'managed' }
  const py = await python()
  if (py && await verify(py, ['-m', 'yt_dlp'])) return { command: py, prefix: ['-m', 'yt_dlp'], source: 'python-module' }
  const url = standaloneUrl()
  if (url) {
    try {
      console.log('[unduh] mengunduh yt-dlp ...')
      await download(url, managed)
      if (os.platform() !== 'win32') fs.chmodSync(managed, 0o755)
      if (await verify(managed)) return { command: managed, prefix: [], source: 'managed' }
      fails.push('binary terunduh tapi tidak bisa dijalankan')
    } catch (e) { fails.push('unduh binary gagal: ' + e.message) }
  }
  if (py) {
    const zip = path.join(BIN_DIR, 'yt-dlp-zipimport')
    try { await download(`${REL}/yt-dlp`, zip); if (await verify(py, [zip])) return { command: py, prefix: [zip], source: 'managed-zip' }; fails.push('build zipimport tidak jalan') }
    catch (e) { fails.push('unduh zipimport gagal: ' + e.message) }
  } else fails.push('Python 3.9+ tidak ditemukan')
  throw new Error(`yt-dlp tidak tersedia. ${fails.join('; ')}. Pasang manual: pip install yt-dlp (atau set global.downloader.ytdlpPath).`)
}
async function ready() {
  if (inv) return inv
  if (!setupP) {
    if (lastErr && Date.now() - lastTry < 30000) throw new Error(lastErr)
    lastTry = Date.now()
    setupP = resolveBinary().then(r => { inv = r; lastErr = ''; return r }).catch(e => { lastErr = e.message; throw e }).finally(() => { setupP = null })
  }
  return setupP
}

let ff
function ffmpegPath() {
  if (ff !== undefined) return ff
  try { const p = require('@ffmpeg-installer/ffmpeg').path; ff = p && fs.existsSync(p) ? p : 'ffmpeg' } catch { ff = 'ffmpeg' }
  return ff
}

async function version() { const b = await ready(); const { stdout } = await run(b.command, [...b.prefix, '--version'], { timeout: 20000 }); return { version: stdout.trim(), source: b.source } }
async function update() {
  const b = await ready()
  if (b.source === 'managed' || b.source === 'env') { const { stdout } = await run(b.command, [...b.prefix, '-U'], { timeout: 120000 }); return stdout.trim().split('\n').pop() }
  if (b.source === 'python-module') { await run(b.command, ['-m', 'pip', 'install', '--upgrade', 'yt-dlp'], { timeout: 180000 }); return 'diperbarui lewat pip' }
  if (b.source === 'managed-zip') { await download(`${REL}/yt-dlp`, b.prefix[0]); return 'build zipimport diunduh ulang' }
  return 'terpasang di sistem, perbarui lewat package manager'
}

// ───────────────────────── retry ladder ─────────────────────────
const PERMANENT = [/unsupported url/i, /video unavailable/i, /private video/i, /this video is private/i, /has been removed/i, /account (is private|does not exist)/i, /age[- ]restricted/i, /sign in to confirm your age/i, /geo[- ]restrict/i, /not (made this video )?available (in|from) your (country|location)/i, /blocked (it )?in your country/i, /requested format is not available/i, /live event will begin/i, /is currently live/i, /removed for violating/i, /may not be comfortable for some audiences/i, /log in for access/i, /copyright (grounds|claim)/i, /no space left on device/i]
const retryable = (msg) => !msg || !PERMANENT.some(r => r.test(msg))
const platformOf = (u) => /tiktok\.com/i.test(u) ? 'tiktok' : /(youtube\.com|youtu\.be)/i.test(u) ? 'youtube' : /(facebook\.com|fb\.watch|fb\.com)/i.test(u) ? 'facebook' : /instagram\.com/i.test(u) ? 'instagram' : /(twitter\.com|x\.com|t\.co)/i.test(u) ? 'twitter' : null
function fbWatch(u) {
  try { const p = new URL(u.trim()), v = p.searchParams.get('v'); if (v && /^\d{6,}$/.test(v)) return `https://www.facebook.com/watch/?v=${v}`
    const id = p.pathname.split('/').filter(Boolean).reverse().find(s => /^\d{6,}$/.test(s)); return id ? `https://www.facebook.com/watch/?v=${id}` : null } catch { return null }
}
function ladder(url) {
  const plain = { url, args: [] }, desk = { url, args: ['--user-agent', DESKTOP_UA] }
  switch (platformOf(url)) {
    case 'facebook': { const r = [plain, desk], w = fbWatch(url); if (w && w !== url) r.push({ url: w, args: ['--user-agent', DESKTOP_UA] }); return r }
    case 'tiktok': return [plain, desk, { url, args: ['--user-agent', DESKTOP_UA, '--extractor-args', 'tiktok:api_hostname=api22-normal-c-useast2a.tiktokv.com'] }]
    case 'youtube': return [plain, { url, args: ['--extractor-args', 'youtube:player_client=tv,mweb,web_safari'] }, { url, args: ['--extractor-args', 'youtube:player_client=android_vr,web_embedded', '--user-agent', DESKTOP_UA] }]
    default: return [plain, desk]
  }
}
const attemptsFor = (url) => { const r = ladder(url), n = Math.max(1, cfg().attempts); return Array.from({ length: n }, (_, i) => r[Math.min(i, r.length - 1)]) }

function baseArgs(url) {
  const c = cfg(), a = ['--no-playlist', '--no-warnings', '--restrict-filenames', '--ignore-config', '--no-progress', '--socket-timeout', '15', '--retries', '3', '--fragment-retries', '5', '--extractor-retries', '3', '--concurrent-fragments', '4']
  if (platformOf(url) === 'youtube') {
    // tantangan "n" YouTube butuh runtime JS; Node >= 22 cukup
    // (client pemutar dibiarkan default yt-dlp; daftar client lama sering usang. Variasi dicoba lewat ladder di atas)
    if (!jsBroken && Number(process.versions.node.split('.')[0]) >= 20) a.push('--js-runtimes', `node:${process.execPath}`)
    if (!remoteBroken) a.push('--remote-components', 'ejs:github')   // ambil penyelesai tantangan JS YouTube bila belum ikut terpasang
  }
  const f = ffmpegPath(); if (f !== 'ffmpeg') a.push('--ffmpeg-location', f)
  if (c.cookies && fs.existsSync(c.cookies)) a.push('--cookies', c.cookies)
  else if (c.cookiesFromBrowser) a.push('--cookies-from-browser', c.cookiesFromBrowser)
  if (c.proxy) a.push('--proxy', c.proxy)
  return a
}
let jsBroken = false, remoteBroken = false

// ───────────────────────── pesan galat ─────────────────────────
function friendly(raw) {
  const s = String(raw || ''), l = s.toLowerCase()
  if (l.includes('unsupported url')) return 'Tautan ini belum didukung.'
  if (l.includes('private video') || l.includes('this video is private') || /account (is private)/.test(l)) return 'Video ini bersifat privat.'
  if (l.includes('video unavailable') || l.includes('has been removed') || l.includes('does not exist')) return 'Video tidak tersedia atau sudah dihapus.'
  if (l.includes('age-restricted') || l.includes('confirm your age')) return 'Video dibatasi usia, tidak bisa diunduh.'
  if (/geo[- ]restrict|available (in|from) your (country|location)/.test(l)) return 'Video dibatasi wilayah tertentu.'
  if (l.includes('not be comfortable for some audiences') || l.includes('log in for access')) return 'Postingan ini dibatasi TikTok (konten sensitif / perlu login). Owner perlu mengisi cookies TikTok (global.downloader.cookies) agar bisa diunduh.'
  if (l.includes('not a bot') || l.includes('sign in to confirm')) return 'YouTube meminta login untuk video ini. Owner perlu mengisi cookies (global.downloader.cookies) atau memakai proxy.'
  if (l.includes('login required') || l.includes('rate-limit') || l.includes('429')) return 'Platform sedang membatasi permintaan. Coba lagi beberapa saat lagi.'
  if (l.includes('requested format is not available')) return 'Kualitas yang diminta tidak tersedia untuk video ini.'
  if (l.includes('is live') || l.includes('live event')) return 'Siaran langsung belum bisa diunduh sampai selesai.'
  if (l.includes('timed out') || l.includes('timeout')) return 'Permintaan ke platform kehabisan waktu. Coba lagi.'
  if (l.includes('no space left')) return 'Penyimpanan server penuh.'
  if (/http error 404|404: not found/.test(l)) return 'Konten tidak ditemukan (404). Periksa tautannya.'
  if (/certificate verify|ssl:|sslerror/.test(l)) return 'Koneksi aman (SSL) ke platform gagal. Periksa jaringan atau waktu server.'
  if (/connection (refused|reset|aborted)|name resolution|network is unreachable|getaddrinfo|transporterror/.test(l)) return 'Tidak bisa terhubung ke platform. Periksa tautannya atau coba lagi nanti.'
  if (l.includes('cannot parse data') || l.includes('unable to extract')) return 'Platform mengirim halaman yang belum bisa dibaca. Biasanya sementara, coba lagi sebentar lagi.'
  const e = s.split('\n').map(x => x.trim()).filter(x => x.startsWith('ERROR:')).pop()
  return e ? e.replace(/^ERROR:\s*(\[[^\]]+\]\s*)?/, '').split(/\s*\(caused by|;\s*please report/)[0].slice(0, 200) : 'Gagal mengunduh. Periksa tautannya lalu coba lagi.'
}

// ───────────────────────── antrean ─────────────────────────
let active = 0; const waiting = []
async function slot(fn) {
  if (active >= Math.max(1, cfg().concurrency)) await new Promise(r => waiting.push(r)); else active++
  try { return await fn() } finally { const n = waiting.shift(); if (n) n(); else active-- }
}

// ───────────────────────── info ─────────────────────────
const NAMES = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', twitter: 'X (Twitter)', facebook: 'Facebook', threads: 'Threads', reddit: 'Reddit', pinterest: 'Pinterest', soundcloud: 'SoundCloud', vimeo: 'Vimeo', twitch: 'Twitch', dailymotion: 'Dailymotion', bilibili: 'Bilibili', snapchat: 'Snapchat', likee: 'Likee', capcut: 'CapCut' }
function niceSource(raw) {
  const k = String(raw.extractor_key || raw.extractor || '').toLowerCase().replace(/[^a-z]/g, '')
  const hit = Object.keys(NAMES).find(n => k.startsWith(n)); if (hit) return NAMES[hit]
  return String(raw.extractor_key || raw.extractor || 'Web').replace(/([a-z])([A-Z])/g, '$1 $2')
}
function normalize(raw, fallbackUrl) {
  const rd = (raw.requested_downloads && raw.requested_downloads[0]) || {}
  const h = rd.height || raw.height, w = rd.width || raw.width
  const ts = raw.timestamp ? raw.timestamp : raw.upload_date && /^\d{8}$/.test(raw.upload_date) ? Date.UTC(+raw.upload_date.slice(0, 4), +raw.upload_date.slice(4, 6) - 1, +raw.upload_date.slice(6, 8)) / 1000 : null
  return {
    id: raw.id, source: niceSource(raw), url: raw.webpage_url || fallbackUrl,
    title: (raw.title || raw.description || '').trim(), description: raw.description || '',
    author: raw.uploader || raw.channel || raw.creator || '', username: raw.uploader_id || '', thumbnail: raw.thumbnail || null,
    stats: { views: raw.view_count ?? null, likes: raw.like_count ?? null, comments: raw.comment_count ?? null, shares: raw.repost_count ?? null, saves: null, downloads: null },
    duration: raw.duration ?? null, createdAt: ts, resolution: h && w ? `${w}x${h}` : (h ? `${h}p` : null),
    vcodec: rd.vcodec || raw.vcodec || '', filesize: rd.filesize || raw.filesize || raw.filesize_approx || null,
  }
}
const parseJsonLines = (out) => out.split(/\r?\n/).map(s => s.trim()).filter(s => s.startsWith('{')).map(s => { try { return JSON.parse(s) } catch { return null } }).filter(Boolean)

const IMG = /\.(jpe?g|png|webp|gif)$/i, AUD = /\.(mp3|m4a|opus|ogg|wav|aac)$/i
const kindOf = (f) => IMG.test(f) ? 'image' : AUD.test(f) ? 'audio' : 'video'

let lastUpd = 0
async function autoUpdate() {
  if (Date.now() - lastUpd < 3600e3) return false
  lastUpd = Date.now()
  try { const r = await update(); console.log('[unduh] yt-dlp diperbarui otomatis:', r); inv = null; return true } catch (e) { console.log('[unduh] pembaruan otomatis gagal:', e.message); return false }
}

/**
 * Unduh satu tautan ke `dir`. kind: 'video' | 'audio'.
 * Mengembalikan { items:[{ file, kind, info }] } (carousel bisa lebih dari satu item).
 */
async function fetchMedia(url, { kind = 'video', dir }) {
  await SHIELD.assertSafeUrl(url)   // tolak URL internal / skema aneh sebelum yt-dlp dijalankan
  const c = cfg()
  let b
  try { b = await ready() } catch (e) {
    // yt-dlp tidak ada (mis. di aplikasi Android): pakai library JS (ytdl-core / btch-downloader), lalu API cadangan
    console.log('[unduh] yt-dlp tidak tersedia, memakai jalur JS...')
    fs.mkdirSync(dir, { recursive: true })
    const J = require('../../lib/jsdl'), pf = platformOf(url), errs = []
    if (pf === 'youtube') {
      try { const r = await J.youtubeFile(url, kind, dir); return { items: [{ file: r.file, kind: r.kind, info: normalize({ title: r.title, uploader: r.author, duration: r.duration }, url) }] } } catch (e) { errs.push('ytdl-core: ' + e.message) }
      try { const r = await require('./ytfallback').youtube(url, kind, dir); return { items: [{ file: r.file, kind: kind === 'audio' ? 'audio' : 'video', info: normalize({ title: r.title }, url) }] } } catch (e) { errs.push('api: ' + e.message) }
    } else {
      try {
        const D = require('../../lib/downloader'), http = require('../../lib/http')
        const raw = await J.btchRaw(pf || '', url)
        const found = D._extract(raw, kind === 'audio')
        const items = []
        for (const [i, it] of found.items.entries()) {
          const { buffer, mime } = await http.getBuffer(it.url, { maxMB: c.maxMB })
          if (buffer.length < 1000 || /html|json/.test(mime || '')) continue
          const ext = /^image\//.test(mime) ? 'jpg' : /^audio\//.test(mime) ? 'mp3' : 'mp4'
          const f = path.join(dir, `jsdl_${Date.now()}_${i}.${ext}`); fs.writeFileSync(f, buffer)
          items.push({ file: f, kind: kindOf(f), info: normalize({ title: found.title }, url) })
        }
        if (items.length) return { items }
        errs.push('library tidak mengembalikan media')
      } catch (e) { errs.push('btch: ' + e.message) }
    }
    throw new Error(friendly(errs.join(' | ')) || 'Unduhan gagal: ' + errs.join(' | '))
  }
  fs.mkdirSync(dir, { recursive: true })
  const H = Math.max(144, Number(c.height) || 720)
  const fmt = `bv*[height<=${H}][vcodec~='^(avc|h264)']+ba[acodec~='^(mp4a|aac)']/b[height<=${H}][ext=mp4]/bv*[height<=${H}]+ba/b[height<=${H}]/b`
  const op = kind === 'audio'
    ? ['-f', 'bestaudio/best', '-x', '--audio-format', 'mp3', '--audio-quality', '0']
    : ['-f', fmt, '--merge-output-format', 'mp4']
  op.push('--max-filesize', `${c.maxMB}M`, '--match-filter', `!is_live & duration<?${Math.max(1, c.maxDurationMin) * 60}`,
    '-o', path.join(dir, '%(id).60s.%(ext)s'), '--dump-json', '--no-simulate')

  return slot(async () => {
    let last = ''
    const tries = attemptsFor(url)
    for (let i = 0; i < tries.length; i++) {
      const t = tries[i]
      const args = [...b.prefix, ...baseArgs(url), ...t.args, ...op, '--', SHIELD.assertHttpUrl(t.url)]   // '--' = tidak ada URL yang bisa menyusup jadi opsi yt-dlp
      try {
        const { stdout, stderr } = await run(b.command, args, { timeout: Math.max(30, c.timeoutSec) * 1000, killSignal: 'SIGKILL' })
        // yt-dlp mencetak JSON sebelum pasca-proses (merge / ekstrak mp3), jadi nama berkas dibaca dari folder, bukan dari JSON
        const infos = parseJsonLines(stdout).slice(0, 10).map(r => normalize(r, url))
        const want = kind === 'audio' ? AUD : /\.(mp4|m4v|mkv|webm|mov|jpe?g|png|webp|gif)$/i
        const files = fs.readdirSync(dir).filter(n => want.test(n) && !/_wa\./.test(n)).map(n => path.join(dir, n)).sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs).slice(0, 10)
        const items = files.map((f, k) => ({ file: f, kind: kindOf(f), info: infos[k] || infos[0] || normalize({}, url) }))
        if (items.length) return { items }
        if (/larger than max-filesize/i.test(stderr)) throw Object.assign(new Error(`Ukuran file melebihi batas ${c.maxMB} MB.`), { final: true })
        if (/does not pass filter/i.test(stderr)) throw Object.assign(new Error(`Video terlalu panjang (maks ${c.maxDurationMin} menit) atau berupa siaran langsung.`), { final: true })
        throw new Error(stderr || 'tidak ada berkas yang dihasilkan')
      } catch (e) {
        if (e.final) throw e
        last = e.stderr || e.message || ''
        if (/no such option: --js-runtimes/i.test(last)) { jsBroken = true; i--; continue }
        if (/no such option: --remote-components/i.test(last)) { remoteBroken = true; i--; continue }
        // yt-dlp usang adalah penyebab paling umum YouTube/TikTok gagal: perbarui otomatis (maks 1x per jam) lalu ulangi
        if (i < tries.length - 1 && /unable to extract|nsig|signature|n challenge|http error 403|sign in to confirm|player response|requested format is not available/i.test(last) && await autoUpdate()) { i--; continue }
        if (e.killed) last = 'timed out'
        if (i === tries.length - 1 || !retryable(last)) break
        console.log(`[unduh] percobaan ${i + 1}/${tries.length} gagal, mengulang: ${last.split('\n').find(x => x.includes('ERROR')) || last.slice(0, 120)}`)
        await sleep(1200 * 2 ** i + Math.random() * 600)
      }
    }
    // yt-dlp gagal -> jalur cadangan khusus YouTube (API / converter)
    if (platformOf(url) === 'youtube' && !/private|dibatasi usia|age/i.test(friendly(last))) {
      try {
        console.log('[unduh] yt-dlp gagal, mencoba jalur cadangan YouTube...')
        const r = await require('./ytfallback').youtube(url, kind, dir)
        const info = normalize({ title: r.title }, url)
        return { items: [{ file: r.file, kind: kind === 'audio' ? 'audio' : 'video', info }] }
      } catch (e) { console.log('[unduh] cadangan YouTube gagal:', e.message) }
    }
    throw new Error(friendly(last))
  })
}

// Pastikan video bisa diputar di WhatsApp (H.264 + AAC, faststart). Bila sudah cocok, file dibiarkan.
async function ensureCompat(file, vcodec) {
  if (!vcodec || /^(avc|h264)/i.test(vcodec) || vcodec === 'none') return file
  const out = file.replace(/\.[^.]+$/, '') + '_wa.mp4'
  try {
    await run(ffmpegPath(), ['-y', '-i', file, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out], { timeout: 300000 })
    fs.unlinkSync(file); return out
  } catch (e) { console.log('[unduh] transcode gagal:', e.message.slice(0, 200)); try { fs.unlinkSync(out) } catch {}; return file }
}
// Ambil audio mp3 dari file video (cadangan bila tidak ada URL musik)
async function extractAudio(file) {
  const out = file.replace(/\.[^.]+$/, '') + '.mp3'
  await run(ffmpegPath(), ['-y', '-i', file, '-vn', '-c:a', 'libmp3lame', '-q:a', '2', out], { timeout: 180000 })
  return out
}

// ───────────────────────── tempat kerja ─────────────────────────
const ROOT = path.join(os.tmpdir(), 'chisa-dl')
function tmpDir() { const d = path.join(ROOT, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`); fs.mkdirSync(d, { recursive: true }); return d }
const cleanup = (d) => { try { fs.rmSync(d, { recursive: true, force: true }) } catch {} }
function sweep() { try { for (const n of fs.readdirSync(ROOT)) { const p = path.join(ROOT, n); if (Date.now() - fs.statSync(p).mtimeMs > 3600e3) cleanup(p) } } catch {} }
sweep()

// ───────────────────────── pencarian & info (untuk .play) ─────────────────────────
function searchArgs() {
  const c = cfg(), a = ['--no-warnings', '--ignore-config', '--socket-timeout', '15']
  if (c.cookies && fs.existsSync(c.cookies)) a.push('--cookies', c.cookies)
  if (c.proxy) a.push('--proxy', c.proxy)
  return a
}
const ytId = (u) => { const m = String(u || '').match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : null }
// Cari video YouTube (tanpa API key). Mengembalikan [{ id, url, title, author, duration, views, thumbnail, live }]
async function search(query, n = 6) {
  // pencarian utama TANPA yt-dlp (lebih cepat & tidak ikut terblokir); yt-dlp jadi cadangan
  try { const r = await require('./ytfallback').search(query, n); if (r.length) return r } catch (e) { console.log('[play] pencarian langsung gagal:', e.message) }
  const b = await ready()
  const { stdout } = await run(b.command, [...b.prefix, ...searchArgs(), '--flat-playlist', '--dump-json', `ytsearch${Math.min(Math.max(n, 1), 10)}:${query}`], { timeout: 60000, killSignal: 'SIGKILL' })
  return parseJsonLines(stdout).filter(r => r.id).map(r => ({
    id: r.id, url: `https://www.youtube.com/watch?v=${r.id}`, title: String(r.title || '').trim(),
    author: r.channel || r.uploader || '', duration: r.duration ?? null, views: r.view_count ?? null,
    thumbnail: `https://i.ytimg.com/vi/${r.id}/hqdefault.jpg`, live: r.live_status === 'is_live',
  }))
}
// Info satu tautan tanpa mengunduh
async function info(url) {
  try { return await infoYtdlp(url) } catch (e) {
    const id = ytId(url)
    if (id) return { id, url, title: '', author: '', duration: null, views: null, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, source: 'YouTube', createdAt: null }
    throw e
  }
}
async function infoYtdlp(url) {
  const b = await ready()
  await SHIELD.assertSafeUrl(url)
  const { stdout } = await run(b.command, [...b.prefix, ...baseArgs(url), '--skip-download', '--dump-json', '--', SHIELD.assertHttpUrl(url)], { timeout: 60000, killSignal: 'SIGKILL' })
  const raw = parseJsonLines(stdout)[0]; if (!raw) throw new Error('info tidak ditemukan')
  const n = normalize(raw, url), id = raw.id
  return { id, url: n.url || url, title: n.title, author: n.author, duration: n.duration, views: n.stats.views, thumbnail: n.thumbnail || (platformOf(url) === 'youtube' ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null), source: n.source, createdAt: n.createdAt }
}

module.exports = { search, info, ytId, fetchMedia, ensureCompat, extractAudio, version, update, ready, tmpDir, cleanup, friendly, platformOf, ffmpegPath, cfg, DESKTOP_UA, kindOf }
