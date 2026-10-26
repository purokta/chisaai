/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .smeme atas|bawah — stiker meme dari gambar/stiker (kirim atau reply)
// Gambar diunggah ke host sementara, lalu dirender oleh api.memegen.link
const axios = require('axios')
const FormData = require('form-data')
const L = require('../../lib/stickerlib')
const TERMAI_KEY = (global.apikey && global.apikey.termai) || 'AIzaBj7z2z3xBjsk'   // ganti lewat global.apikey.termai bila perlu

async function upload(buf) {
  const form = () => { const f = new FormData(); f.append('file', buf, { filename: 'meme.png', contentType: 'image/png' }); return f }
  try {
    const f = form()
    const r = await axios.post(`https://c.termai.cc/api/upload?key=${TERMAI_KEY}`, f, { headers: f.getHeaders(), timeout: 30000 })
    if (r.data && r.data.status && r.data.path) return r.data.path
  } catch (e) { console.log('[smeme] termai gagal:', e.message) }
  try {
    const f = form()
    const r = await axios.post('https://telegra.ph/upload', f, { headers: f.getHeaders(), timeout: 30000 })
    if (r.data && r.data[0] && r.data[0].src) return 'https://telegra.ph' + r.data[0].src
  } catch (e) { console.log('[smeme] telegraph gagal:', e.message) }
  return null
}
const enc = (t) => !t ? '_' : encodeURIComponent(t).replace(/-/g, '--').replace(/_/g, '__').replace(/%20/g, '_')

module.exports = {
  name: 'smeme', alias: ['memesticker', 'memes'], category: 'sticker',
  desc: 'Stiker meme dari gambar (atas|bawah)',
  run: async ({ sock, m, args, prefix, reply }) => {
    const media = L.pickMedia(m)
    if (!media || media.kind === 'video') return reply(`😂 *STIKER MEME*\n\n> Kirim atau reply gambar/stiker dengan caption.\n\n*Contoh:* ${prefix}smeme Ketika|Kamu Lupa`)
    const input = args.join(' ')
    if (!input.includes('|')) return reply(`😂 *STIKER MEME*\n\n> Format: atas|bawah\n\n*Contoh:* ${prefix}smeme Ketika|Kamu Lupa`)
    const [top, bottom] = input.split('|').map(s => s.trim())
    L.react(sock, m, '🕕')
    try {
      const raw = await L.download(media)
      if (!raw || !raw.length) { L.react(sock, m, '❌'); return reply('❌ Gagal mengunduh media.') }
      let img = raw
      try { img = await require('sharp')(raw).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer() } catch (e) { console.log('[smeme] sharp:', e.message) }
      const url = await upload(img)
      if (!url) { L.react(sock, m, '❌'); return reply('❌ Gagal mengunggah gambar, coba lagi nanti.') }
      const r = await axios.get(`https://api.memegen.link/images/custom/${enc(top)}/${enc(bottom)}.png?background=${encodeURIComponent(url)}`, {
        responseType: 'arraybuffer', timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      await L.sendImageAsSticker(sock, m, Buffer.from(r.data))
      L.react(sock, m, '✅')
    } catch (e) {
      console.log('[smeme]', e.message); L.react(sock, m, '❌'); reply(`❌ Gagal membuat stiker meme.\n_${e.message}_`)
    }
  },
}
