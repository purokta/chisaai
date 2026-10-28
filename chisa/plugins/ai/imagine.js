/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .imagine — buat gambar dari teks (Pollinations, tanpa API key). Opsi: --wide (16:9) --tall (9:16) --square (1:1, bawaan) --anime --foto --3d
const axios = require('axios'), { B } = require('../../lib/style')
const SIZE = { wide: [1280, 720], tall: [720, 1280], square: [1024, 1024] }
const STYLE = { anime: 'anime style, vibrant, detailed illustration', foto: 'photorealistic, natural lighting, high detail', '3d': '3D render, soft lighting, octane render' }

module.exports = {
  name: 'gambarai', alias: ['gambarai', 'aiimage', 'buatgambar', 'txt2img', 'bayangkan'], category: 'ai', cmds: [],
  desc: 'Buat gambar dari teks dengan AI (opsi --wide --tall --anime --foto --3d)',
  run: async ({ sock, m, text, prefix, reply, isCreator }) => {
    const flags = [...text.matchAll(/--(\w+)/g)].map(x => x[1].toLowerCase()), prompt = text.replace(/--\w+/g, '').replace(/\s+/g, ' ').trim()
    if (!prompt) return reply(`${B('IMAGINE')}\nContoh:\n${prefix}imagine kucing astronaut di bulan\n${prefix}imagine kota cyberpunk saat hujan --wide --anime\n\nOpsi: --wide  --tall  --anime  --foto  --3d`)
    if (prompt.length > 500) return reply('✕ Deskripsi maksimal 500 karakter.')
    const [w, h] = SIZE[flags.find(f => SIZE[f])] || SIZE.square, st = STYLE[flags.find(f => STYLE[f])]
    sock.sendMessage(m.chat, { react: { text: '🕕', key: m.key } }).catch(() => {})
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(st ? prompt + ', ' + st : prompt)}?width=${w}&height=${h}&nologo=true&safe=true&seed=${Math.floor(Math.random() * 1e6)}`
      const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 90000, maxContentLength: 15 * 1048576 })
      if (!/^image\//.test(String(r.headers['content-type'] || ''))) throw new Error('respons bukan gambar')
      await sock.sendMessage(m.chat, { image: Buffer.from(r.data), caption: `${B('IMAGINE')}\n_${prompt.slice(0, 200)}_` }, { quoted: m })
      sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
    } catch (e) { console.log('[imagine]', e.message); sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {}); return reply(`✕ Gagal membuat gambar, server gambar sedang sibuk. Coba lagi sebentar.${isCreator ? '\n_' + e.message + '_' : ''}`) }
  },
}
