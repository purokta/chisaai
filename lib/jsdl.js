// Pengunduh berbasis library JavaScript (tanpa yt-dlp / Python) — untuk aplikasi Android dan perangkat tanpa yt-dlp.
// Library bersifat OPSIONAL (optionalDependencies): kalau tidak terpasang / gagal, modul ini melempar galat biasa
// dan pemanggil lanjut ke jalur lain. YouTube: @distube/ytdl-core (lokal, tanpa API pihak ketiga).
// Instagram / Facebook / X / TikTok / lainnya: btch-downloader (membaca hasilnya secara generik).
const fs = require('fs')
const path = require('path')

try { require('./node18-compat').install() } catch {}
const loadErr = {}
const lib = (n) => { try { return require(n) } catch (e) { loadErr[n] = String(e?.message || e).split('\n')[0].slice(0, 110); return null } }
const cfg = () => Object.assign({ maxMB: 100, maxDurationMin: 60 }, global.downloader || {})

const BTCH = {
  instagram: ['igdl', 'instagram'], facebook: ['fbdown', 'facebook'], twitter: ['twitter', 'twdl'], tiktok: ['ttdl', 'tiktok'],
  youtube: ['youtube', 'ytmp4'], threads: ['threads'], pinterest: ['pinterest'], capcut: ['capcut'], soundcloud: ['soundcloud'],
}

const platformOf = (u) => /(tiktok\.com)/i.test(u) ? 'tiktok' : /(youtube\.com|youtu\.be)/i.test(u) ? 'youtube' : /(facebook\.com|fb\.watch|fb\.com|fb\.me)/i.test(u) ? 'facebook'
  : /(instagram\.com|instagr\.am)/i.test(u) ? 'instagram' : /(twitter\.com|x\.com|t\.co)/i.test(u) ? 'twitter' : /threads\.net/i.test(u) ? 'threads'
  : /pinterest\.|pin\.it/i.test(u) ? 'pinterest' : /capcut\.com/i.test(u) ? 'capcut' : /soundcloud\.com/i.test(u) ? 'soundcloud' : null

/** YouTube lewat youtubei.js (Innertube). Library ESM, dimuat dengan import(). Versi terbaru dicoba dulu (alias youtubei-latest), lalu versi lama. */
async function loadInnertube() {
  const errs = []
  for (const name of ['youtubei-latest', 'youtubei.js']) {
    try {
      const mod = await import(name)
      const Innertube = mod.Innertube || (mod.default && mod.default.Innertube)
      if (!Innertube) throw new Error('Innertube tidak ada')
      // versi baru tidak membawa interpreter JS untuk membuka sandi URL: sediakan sendiri
      const Platform = mod.Platform || (mod.default && mod.default.Platform)
      if (Platform?.shim && !Platform.shim.__chisaEval) {
        Platform.shim.eval = async (data, env) => {
          const props = []
          if (env?.n) props.push(`n: exportedVars.nFunction("${env.n}")`)
          if (env?.sig) props.push(`sig: exportedVars.sigFunction("${env.sig}")`)
          return new Function(`${data.output}\nreturn { ${props.join(', ')} }`)()
        }
        Platform.shim.__chisaEval = true
      }
      return Innertube
    } catch (e) { errs.push(name + ': ' + String(e?.message || e).split('\n')[0].slice(0, 90)) }
  }
  throw new Error('youtubei.js belum terpasang/tidak jalan (' + errs.join('; ') + ')')
}

async function youtubeInnertube(url, kind, dir) {
  const id = (String(url).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) || [])[1] || (/^[\w-]{11}$/.test(url) ? url : null)
  if (!id) throw new Error('id video tidak ditemukan')
  const Innertube = await loadInnertube()
  const c = cfg(), max = c.maxMB * 1048576
  const yt = await Innertube.create({ retrieve_player: true })
  const audio = kind === 'audio'
  // beberapa klien YouTube dicoba bergantian (sebagian diblokir/butuh token tergantung waktu)
  const clients = ['ANDROID', 'IOS', 'TV', 'WEB_EMBEDDED', 'MWEB', 'WEB']
  const errs = []
  for (const client of clients) {
    try {
      let bd = {}
      try { bd = (await yt.getBasicInfo(id)).basic_info || {} } catch {} // hanya untuk judul/durasi; unduhan memakai klien di bawah
      if (bd.is_live) throw new Error('Siaran langsung tidak bisa diunduh.')
      if (Number(bd.duration) > c.maxDurationMin * 60) throw new Error(`Video terlalu panjang (maks ${c.maxDurationMin} menit).`)
      const stream = await yt.download(id, audio ? { type: 'audio', quality: 'best', format: 'mp4', client } : { type: 'video+audio', quality: 'best', format: 'mp4', client })
      fs.mkdirSync(dir, { recursive: true })
      const file = path.join(dir, `${id}.${audio ? 'm4a' : 'mp4'}`)
      const w = fs.createWriteStream(file)
      let got = 0
      const reader = stream.getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          got += value.length
          if (got > max) throw new Error(`Ukuran file melebihi batas ${c.maxMB} MB.`)
          if (!w.write(Buffer.from(value))) await new Promise(r => w.once('drain', r))
        }
      } finally { w.end(); await new Promise(r => w.once('close', r)) }
      if (fs.statSync(file).size < 2048) throw new Error('berkas kosong')
      return { file, title: bd.title || '', author: bd.author || '', duration: Number(bd.duration) || null, kind: audio ? 'audio' : 'video' }
    } catch (e) {
      const m = String(e?.message || e)
      if (/Siaran langsung|terlalu panjang|melebihi batas/.test(m)) throw e
      errs.push(client + ': ' + m.split('\n')[0].slice(0, 70))
    }
  }
  throw new Error(errs.join(' | '))
}

/** YouTube: ytdl-core dulu, lalu youtubei.js. Galat dari keduanya digabung supaya penyebabnya jelas. */
async function youtubeAny(url, kind, dir) {
  const errs = []
  try { return await youtubeFile(url, kind, dir) } catch (e) { errs.push('ytdl-core: ' + (e?.message || e)) }
  try { return await youtubeInnertube(url, kind, dir) } catch (e) { errs.push('youtubei: ' + (e?.message || e)) }
  throw Object.assign(new Error(errs.join(' | ').slice(0, 400)), { userMessage: '❌ Unduh YouTube gagal.\n' + errs.map(x => '• ' + x.slice(0, 140)).join('\n') })
}

/** YouTube lewat ytdl-core -> berkas di `dir`. kind 'audio' = .m4a (AAC), 'video' = .mp4 (video+suara, biasanya 360p/720p). */
async function youtubeFile(url, kind, dir) {
  const ytdl = lib('@distube/ytdl-core') || lib('ytdl-core')
  if (!ytdl) throw new Error('ytdl-core belum terpasang' + (loadErr['@distube/ytdl-core'] ? ' (' + loadErr['@distube/ytdl-core'] + ')' : ''))
  const c = cfg(), max = c.maxMB * 1048576
  const info = await ytdl.getInfo(url)
  const d = info.videoDetails
  if (d.isLive) throw new Error('Siaran langsung tidak bisa diunduh.')
  if (Number(d.lengthSeconds) > c.maxDurationMin * 60) throw new Error(`Video terlalu panjang (maks ${c.maxDurationMin} menit).`)
  const audio = kind === 'audio'
  let fmt
  try {
    fmt = audio
      ? ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: f => f.hasAudio && !f.hasVideo && f.container === 'mp4' })
      : ytdl.chooseFormat(info.formats, { quality: 'highest', filter: f => f.hasAudio && f.hasVideo && f.container === 'mp4' })
  } catch {
    fmt = ytdl.chooseFormat(info.formats, audio ? { quality: 'highestaudio', filter: 'audioonly' } : { quality: 'highest', filter: 'audioandvideo' })
  }
  fs.mkdirSync(dir, { recursive: true })
  const ext = audio ? (fmt.container === 'mp4' ? 'm4a' : fmt.container || 'webm') : (fmt.container || 'mp4')
  const file = path.join(dir, `${d.videoId}.${ext}`)
  await new Promise((ok, no) => {
    const s = ytdl.downloadFromInfo(info, { format: fmt, highWaterMark: 1 << 25 })
    const w = fs.createWriteStream(file)
    let got = 0
    s.on('data', ch => { got += ch.length; if (got > max) s.destroy(new Error(`Ukuran file melebihi batas ${c.maxMB} MB.`)) })
    s.on('error', no); w.on('error', no); w.on('finish', ok)
    s.pipe(w)
  })
  if (fs.statSync(file).size < 2048) throw new Error('berkas kosong')
  return { file, title: d.title || '', author: d.author && d.author.name, duration: Number(d.lengthSeconds) || null, kind: audio ? 'audio' : 'video' }
}

/** Panggil btch-downloader untuk platform ini; mengembalikan JSON mentah (dibaca generik oleh pemanggil). */
async function btchRaw(platform, url) {
  const b = lib('btch-downloader')
  if (!b) throw new Error('btch-downloader belum terpasang')
  const names = BTCH[platform]
  if (!names) throw new Error('platform tidak didukung: ' + platform)
  let last
  for (const n of names) {
    if (typeof b[n] !== 'function') continue
    try { const r = await b[n](url); if (r) return r } catch (e) { last = e }
  }
  throw last || new Error('fungsi btch-downloader untuk ' + platform + ' tidak ditemukan')
}

module.exports = { loadErr, youtubeAny, youtubeInnertube, youtubeFile, btchRaw, platformOf, available: () => !!(lib('@distube/ytdl-core') || lib('ytdl-core') || lib('btch-downloader')) }
