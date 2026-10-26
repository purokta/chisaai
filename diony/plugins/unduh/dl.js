/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .dl / .dlmp3 — unduh video atau audio dari tautan apa pun yang didukung scraper Mori
// (YouTube, TikTok, Instagram, Facebook, X/Twitter, Spotify, Pinterest, Apple Music, Bandcamp, Pixiv,
//  Threads, RedNote, Douyin, Bilibili, Reddit, TeraBox).
// Fungsi: lib/morigrab.js (scraper Mori + cadangan yt-dlp).  Tampilan: helper Dionysus (lib/downloader.js).
// Perintah per platform (.igdl, .fbdl, .spotifydl, .redditdl, .teraboxdl, dst.) ada di file terpisah di folder ini.
const G = require('../../lib/morigrab')

const AUDIO = ['dlmp3', 'ytmp3', 'audiodl', 'musicdl']

module.exports = {
  name: 'dl',
  alias: ['unduh', 'download', 'ytmp4', 'ytdl', ...AUDIO],
  category: 'unduh',
  cmds: ['dl', 'dlmp3'],
  desc: 'Downloader Mori multi-platform: tempel tautan apa pun (YouTube, TikTok, Instagram, Facebook, X, Spotify, Pinterest, Reddit, TeraBox, dll.)',
  run: (ctx) => G.grab(ctx, { audio: AUDIO.includes(ctx.command), cmd: AUDIO.includes(ctx.command) ? 'dlmp3' : 'dl' }),
}
