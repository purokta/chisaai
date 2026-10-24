// Fitur AI: ngobrol (#ai) dan buat gambar (#img)
const fs = require('fs')
const http = require('../lib/http')
const { tmpPath, run, rm } = require('../lib/ffmpeg')

// kecilkan gambar (maks 1024px, JPEG) sebelum dikirim ke AI
async function shrink(buffer) {
  const inp = tmpPath('bin'), out = tmpPath('jpg')
  fs.writeFileSync(inp, buffer)
  try {
    await run('ffmpeg', ['-y', '-i', inp, '-vf', "scale='min(1024,iw)':-2", '-frames:v', '1', '-q:v', '4', out])
    return fs.readFileSync(out)
  } finally {
    rm(inp, out)
  }
}

const strip = html =>
  String(html)
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

module.exports = [
  {
    name: 'ringkas',
    aliases: ['summary', 'rangkum'],
    category: 'AI',
    usage: '<link / teks>',
    desc: 'Ringkas teks atau isi link',
    async run(ctx) {
      let src = ctx.query || ''
      if (!src.trim()) return ctx.reply(`Kirim link atau teks, atau reply pesan panjang.\nContoh: ${ctx.prefix}ringkas https://...`)
      const url = (src.match(/https?:\/\/\S+/) || [])[0]
      if (url) {
        await ctx.react('⏳')
        src = strip(await http.getText(url, { timeout: 25000 }))
        if (src.length < 80) return ctx.reply('Isi halaman tidak terbaca (mungkin butuh login atau berisi JavaScript).')
      }
      const out = await ctx.ai.ask('Ringkas teks berikut dalam Bahasa Indonesia, maksimal 6 poin singkat, tanpa basa-basi:\n\n' + src.slice(0, 8000))
      await ctx.reply('📝 *RINGKASAN*\n\n' + out)
    }
  },
  {
    name: 'ai',
    aliases: ['chisa', 'tanya', 'ask'],
    category: 'AI',
    usage: '<pertanyaan>',
    desc: 'Tanya AI (bisa baca gambar: kirim/reply foto)',
    async run(ctx) {
      // ada gambar (dikirim bersama perintah atau di-reply) -> AI membaca gambarnya
      const t = ctx.mediaTarget()
      if (t && t.type === 'image') {
        await ctx.react('👀')
        const jpeg = await shrink(await ctx.download(t.node, 'image'))
        const q = (ctx.text || '').trim() || 'Jelaskan gambar ini dengan singkat dalam Bahasa Indonesia. Kalau ada teks atau soal, bacakan dan jawab.'
        await ctx.reply(await ctx.ai.vision(jpeg, q.slice(0, 800)))
        return
      }
      if (!ctx.query) return ctx.reply(`Tulis pertanyaannya, contoh:\n${ctx.prefix}ai apa itu black hole?`)
      await ctx.presence('composing')
      const out = await ctx.ai.chat(ctx.chatKey, ctx.query.slice(0, 1500))
      await ctx.reply(out)
    }
  },
  {
    name: 'img',
    aliases: ['gambar', 'imagine', 'aiimg'],
    category: 'AI',
    usage: '<deskripsi>',
    desc: 'Buat gambar dengan AI',
    async run(ctx) {
      const q = ctx.query.slice(0, 500)
      if (!q) return ctx.reply(`Tulis deskripsi gambarnya, contoh:\n${ctx.prefix}img kucing astronot di bulan`)
      await ctx.react('⏳')

      const seed = Math.floor(Math.random() * 1e6)
      const p = encodeURIComponent(q)
      const key = ctx.config.ai.pollinationsKey
      const headers = key ? { authorization: 'Bearer ' + key } : {}
      const urls = [
        `https://image.pollinations.ai/prompt/${p}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`,
        `https://pollinations.ai/p/${p}?width=1024&height=1024&nologo=true&seed=${seed}`
      ]

      let img
      let lastErr
      for (const u of urls) {
        try {
          const r = await http.getBuffer(u, { headers, timeout: 90000, maxMB: 15 })
          if (r.mime.startsWith('image/')) {
            img = r
            break
          }
        } catch (e) {
          lastErr = e
        }
      }
      if (!img) throw new Error(`Server gambar AI sedang sibuk/menolak, coba lagi nanti. (${lastErr?.message || 'tidak ada gambar'})`)

      await ctx.send({ image: img.buffer, caption: `🎨 ${q}\n\n_${ctx.config.botName}_` })
      await ctx.react('✅')
    }
  }
]
