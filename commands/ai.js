// Fitur AI: ngobrol (#ai) dan buat gambar (#img)
const { getBuffer } = require('../lib/http')

module.exports = [
  {
    name: 'ai',
    aliases: ['chisa', 'tanya', 'ask'],
    category: 'AI',
    usage: '<pertanyaan>',
    desc: 'Tanya / ngobrol dengan AI',
    async run(ctx) {
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
          const r = await getBuffer(u, { headers, timeout: 90000, maxMB: 15 })
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
