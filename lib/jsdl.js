// Pengunduh berbasis library JavaScript (tanpa yt-dlp / Python) — untuk aplikasi Android dan perangkat tanpa yt-dlp.
// Library bersifat OPSIONAL (optionalDependencies): kalau tidak terpasang / gagal, modul ini melempar galat biasa
// dan pemanggil lanjut ke jalur lain. YouTube: @distube/ytdl-core (lokal, tanpa API pihak ketiga).
// Instagram / Facebook / X / TikTok / lainnya: btch-downloader (membaca hasilnya secara generik).
const fs = require('fs')
const path = require('path')

const lib = (n) => { try { return require(n) } catch { return null } }
const cfg = () => Object.assign({ maxMB: 100, maxDurationMin: 60 }, global.downloader || {})

const BTCH = {
  instagram: ['igdl', 'instagram'], facebook: ['fbdown', 'facebook'], twitter: ['twitter', 'twdl'], tiktok: ['ttdl', 'tiktok'],
  youtube: ['youtube', 'ytmp4'], threads: ['threads'], pinterest: ['pinterest'], capcut: ['capcut'], soundcloud: ['soundcloud'],
}

const platformOf = (u) => /(tiktok\.com)/i.test(u) ? 'tiktok' : /(youtube\.com|youtu\.be)/i.test(u) ? 'youtube' : /(facebook\.com|fb\.watch|fb\.com|fb\.me)/i.test(u) ? 'facebook'
  : /(instagram\.com|instagr\.am)/i.test(u) ? 'instagram' : /(twitter\.com|x\.com|t\.co)/i.test(u) ? 'twitter' : /threads\.net/i.test(u) ? 'threads'
  : /pinterest\.|pin\.it/i.test(u) ? 'pinterest' : /capcut\.com/i.test(u) ? 'capcut' : /soundcloud\.com/i.test(u) ? 'soundcloud' : null

/** YouTube lewat ytdl-core -> berkas di `dir`. kind 'audio' = .m4a (AAC), 'video' = .mp4 (video+suara, biasanya 360p/720p). */
async function youtubeFile(url, kind, dir) {
  const ytdl = lib('@distube/ytdl-core') || lib('ytdl-core')
  if (!ytdl) throw new Error('ytdl-core belum terpasang')
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

module.exports = { youtubeFile, btchRaw, platformOf, available: () => !!(lib('@distube/ytdl-core') || lib('ytdl-core') || lib('btch-downloader')) }
