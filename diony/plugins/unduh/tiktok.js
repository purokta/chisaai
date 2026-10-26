/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tiktok / .tiktokmp3 — unduh video, slide gambar, dan musik TikTok + tabel statistik
// Urutan sumber: API TikTok (v1, lengkap dengan statistik) -> SSSTik (v2) -> MusicalDown (v3) -> yt-dlp
const fs = require('fs')
const path = require('path')
const Y = require('../../lib/ytdlp')
const D = require('../../lib/downloader')
const M = require('../../lib/mori-scrapers')

const AUDIO = ['tiktokmp3', 'ttmp3', 'ttaudio']
const TT_URL = /tiktok\.com/i
const first = (v) => Array.isArray(v) ? v.find(Boolean) : v
const all = (v) => (Array.isArray(v) ? v : [v]).filter(x => typeof x === 'string' && x.startsWith('http'))
const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(`${label} kehabisan waktu`)), ms))])

function lib() { try { return require('@tobyg74/tiktok-api-dl') } catch { return null } }

// samakan bentuk hasil tiap versi library
function normalize(version, r) {
  if (!r) return null
  const s = r.statistics || {}
  if (version === 'v1') {
    return {
      source: 'TikTok', type: r.type, id: r.id, title: r.desc, author: r.author && r.author.nickname, username: r.author && r.author.username,
      stats: { views: s.playCount, likes: s.likeCount, comments: s.commentCount, shares: s.shareCount, saves: s.collectCount, downloads: s.downloadCount },
      duration: r.video && r.video.duration ? r.video.duration / 1000 : null, createdAt: r.createTime,
      videoUrls: [...all(r.video && r.video.playAddr), ...all(r.video && r.video.downloadAddr)],
      images: all(r.images), audioUrls: all(r.music && r.music.playUrl), cover: first(r.video && (r.video.originCover || r.video.cover)) || first(r.cover),
    }
  }
  if (version === 'v2') {
    return {
      source: 'TikTok', type: r.type === 'music' ? 'video' : r.type, title: r.desc, author: r.author && r.author.nickname,
      stats: { views: null, likes: s.likeCount, comments: s.commentCount, shares: s.shareCount },
      videoUrls: [...all(r.video && r.video.playAddr), ...all(r.direct)], images: all(r.images), audioUrls: all(r.music && r.music.playUrl), cover: r.author && r.author.avatar,
    }
  }
  return {
    source: 'TikTok', type: r.type, title: r.desc, author: r.author && r.author.nickname, stats: {},
    videoUrls: [...all(r.videoHD), ...all(r.videoWatermark)], images: all(r.images), audioUrls: all(r.music), cover: r.author && r.author.avatar,
  }
}

async function getMeta(url) {
  const proxy = (global.downloader && global.downloader.tiktokProxy) || undefined, errs = []
  // sumber utama: tikwm (stabil, lengkap dengan statistik). Library lama jadi cadangan.
  try {
    const meta = await withTimeout(require('../../lib/ytfallback').tikwm(url), 40000, 'tikwm')
    if (meta && (meta.videoUrls.length || meta.images.length || meta.audioUrls.length)) { meta.version = 'tikwm'; return { meta, errs } }
    errs.push('tikwm: tidak ada hasil')
  } catch (e) { errs.push(`tikwm: ${e.message}`) }
  const T = lib(); if (!T) { errs.push('paket @tobyg74/tiktok-api-dl belum terpasang'); return { meta: null, errs } }
  for (const v of ['v1', 'v2', 'v3']) {
    try {
      const res = await withTimeout(T.Downloader(url, { version: v, proxy }), 45000, v)
      if (res && res.status === 'success' && res.result) {
        const meta = normalize(v, res.result)
        if (meta && (meta.videoUrls.length || meta.images.length || meta.audioUrls.length)) { meta.version = v; return { meta, errs } }
      }
      errs.push(`${v}: ${(res && res.message) || 'tidak ada hasil'}`)
    } catch (e) { errs.push(`${v}: ${e.message}`) }
  }
  return { meta: null, errs }
}

module.exports = {
  name: 'tiktok',
  alias: ['tt', 'ttdl', 'tiktokdl', ...AUDIO],
  category: 'unduh',
  cmds: ['tiktok', 'tiktokmp3'],
  desc: 'Unduh video / slide / musik TikTok tanpa watermark + statistik',
  run: async ({ sock, m, reply, text, command, prefix }) => {
    const audio = AUDIO.includes(command)
    const url = D.pickUrl(text, m.quoted)
    if (!url || !TT_URL.test(url)) {
      return reply(`${D.B(audio ? 'TIKTOK AUDIO' : 'TIKTOK DOWNLOADER')}\n${D.HR}\nKirim tautan TikTok setelah perintah, atau balas pesan yang berisi tautannya.\n\nContoh:\n${prefix}${audio ? 'tiktokmp3' : 'tiktok'} https://vt.tiktok.com/xxxxxxxx\n\nMendukung video, slide gambar, dan musik.`)
    }
    if (!D.lock(m.sender)) return reply('Unduhanmu yang sebelumnya masih berjalan. Tunggu selesai dulu ya.')
    const dir = Y.tmpDir()
    try {
      await reply('Memproses tautan TikTok, mohon tunggu...')

      // Coba scraper Mori lebih dulu; output dan caption tetap memakai format Dionysus.
      try {
        const scraped = await M.scrapeForUrl(url)
        const result = scraped && scraped.status && scraped.result
        let links = result && Array.isArray(result.downloads) ? result.downloads.filter(x => x && x.url && !x.isMirror) : []
        const isAudioLink = x => /mp3|audio|music|m4a/i.test(String(x.type || ''))
        if (result && links.length) {
          links = links.filter(x => audio ? isAudioLink(x) : !isAudioLink(x))
          if (!links.length && !audio) links = result.downloads.filter(x => x && x.url && !x.isMirror)
          if (links.length) {
            const info = { source: 'TikTok', title: result.title || 'TikTok Media', author: result.author || '', thumbnail: result.thumbnail || null }
            if (audio) {
              const item = links.find(isAudioLink) || links[0]
              const ext = /m4a/i.test(String(item.type)) ? 'm4a' : 'mp3'
              const dest = path.join(dir, `mori-tiktok-${Date.now()}.${ext}`)
              try {
                await D.fetchToFile([item.url], dest, [{ 'User-Agent': Y.DESKTOP_UA, Referer: url }, {}])
                await D.sendCard(sock, m, D.caption(info, 'audio'), info.thumbnail)
                await D.sendFile(sock, m, dest, 'audio')
                return
              } catch (e) { try { if (fs.existsSync(dest)) fs.unlinkSync(dest) } catch {}; console.log('[mori-tiktok-audio]', e.message) }
            } else {
              const photos = links.filter(x => /photo|image|picture/i.test(String(x.type || '')))
              if (photos.length) {
                let sent = 0
                for (let i = 0; i < Math.min(photos.length, 10); i++) {
                  try {
                    const buf = await D.fetchBuffer(photos[i].url)
                    await sock.sendMessage(m.chat, { image: buf, ...(sent === 0 ? { caption: D.caption({ ...info, count: photos.length }, 'image') } : {}) }, { quoted: m })
                    sent++
                  } catch (e) { console.log('[mori-tiktok-photo]', e.message) }
                }
                if (sent) return
              }
              const item = links.find(x => /video|mp4|hd|download/i.test(String(x.type || ''))) || links[0]
              const dest = path.join(dir, `mori-tiktok-${Date.now()}.mp4`)
              try {
                await D.fetchToFile([item.url], dest, [{ 'User-Agent': Y.DESKTOP_UA, Referer: url }, {}])
                await D.sendFile(sock, m, dest, 'video', D.caption({ ...info, filesize: fs.statSync(dest).size }, 'video'))
                return
              } catch (e) { try { if (fs.existsSync(dest)) fs.unlinkSync(dest) } catch {}; console.log('[mori-tiktok-video]', e.message) }
            }
          }
        }
      } catch (e) { console.log('[mori-tiktok-mori]', e.message) }

      // Cadangan TikTok lama Dionysus jika jalur Mori gagal.
      const { meta, errs } = await getMeta(url)
      if (errs.length) console.log('[tiktok]', errs.join(' | '))

      // ── slide gambar ──
      if (meta && meta.images.length && !audio) {
        const imgs = meta.images.slice(0, 10), cap = D.caption({ ...meta, count: imgs.length }, 'image')
        let sent = 0
        for (let i = 0; i < imgs.length; i++) {
          try {
            const buf = await D.fetchBuffer(imgs[i])
            await sock.sendMessage(m.chat, { image: buf, ...(i === 0 ? { caption: cap } : {}) }, { quoted: m }); sent++
          } catch (e) { console.log('[tiktok] gambar', i + 1, e.message) }
        }
        if (sent) return
      }

      // ── audio ──
      if (audio) {
        let file
        if (meta && meta.audioUrls.length) { try { file = await D.fetchToFile(meta.audioUrls, path.join(dir, 'musik.mp3')) } catch (e) { console.log('[tiktok] musik', e.message) } }
        if (!file && meta && meta.videoUrls.length) { try { file = await Y.extractAudio(await D.fetchToFile(meta.videoUrls, path.join(dir, 'sumber.mp4'))) } catch (e) { console.log('[tiktok] ekstrak audio', e.message) } }
        if (file) { await D.sendCard(sock, m, D.caption(meta, 'audio'), meta.cover); return D.sendFile(sock, m, file, 'audio') }
        const r = await Y.fetchMedia(url, { kind: 'audio', dir }), it = r.items[0]
        await D.sendCard(sock, m, D.caption(meta ? { ...it.info, ...meta } : it.info, 'audio'), (meta && meta.cover) || it.info.thumbnail)
        return D.sendFile(sock, m, it.file, 'audio')
      }

      // ── video ──
      let file = null
      if (meta && meta.videoUrls.length) {
        try { file = await D.fetchToFile(meta.videoUrls, path.join(dir, 'video.mp4')) } catch (e) { console.log('[tiktok] unduh langsung gagal:', e.message); if (e.final) throw e }
      }
      if (file) return D.sendFile(sock, m, file, 'video', D.caption({ ...meta, filesize: fs.statSync(file).size }, 'video'))

      // cadangan terakhir: yt-dlp
      const r = await Y.fetchMedia(url, { kind: 'video', dir })
      for (let i = 0; i < r.items.length; i++) {
        const it = r.items[i]
        if (it.kind === 'video') it.file = await Y.ensureCompat(it.file, it.info.vcodec)
        // statistik dari API bila ada, kalau tidak dari yt-dlp
        const info = meta ? { ...it.info, ...meta, stats: { ...it.info.stats, ...Object.fromEntries(Object.entries(meta.stats || {}).filter(([, v]) => v != null)) }, resolution: it.info.resolution } : it.info
        await D.sendFile(sock, m, it.file, it.kind, i === 0 ? D.caption({ ...info, filesize: fs.statSync(it.file).size }, it.kind === 'image' ? 'image' : 'video') : undefined)
      }
    } catch (e) {
      console.log('[tiktok]', e.message)
      reply(`Gagal mengunduh dari TikTok.\n> ${e.message}`)
    } finally { D.unlock(m.sender); Y.cleanup(dir) }
  },
}
