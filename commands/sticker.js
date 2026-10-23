// Stiker: gambar/video -> stiker, dan stiker -> gambar
const { createSticker, addExif, stickerToImage } = require('../lib/sticker')

module.exports = [
  {
    name: 's',
    aliases: ['sticker', 'stiker'],
    category: 'Stiker',
    desc: 'Gambar/video jadi stiker (kirim atau reply)',
    async run(ctx) {
      const t = ctx.mediaTarget()
      if (!t || !['image', 'video', 'sticker'].includes(t.type)) {
        return ctx.reply(`Kirim atau reply *gambar/video* dengan ${ctx.prefix}s`)
      }
      if (t.type === 'video' && Number(t.node.seconds || 0) > 15) {
        return ctx.reply('Video terlalu panjang, maksimal 15 detik.')
      }
      await ctx.react('⏳')
      const buf = await ctx.download(t.node, t.type)
      // stiker orang lain di-reply -> diberi nama pack kita; selain itu dikonversi dulu
      const webp = t.type === 'sticker' ? addExif(buf) : await createSticker(buf, t.type)
      await ctx.send({ sticker: webp })
      await ctx.react('✅')
    }
  },
  {
    name: 'toimg',
    aliases: ['toimage', 'stikerkegambar'],
    category: 'Stiker',
    desc: 'Stiker jadi gambar (reply stikernya)',
    async run(ctx) {
      const t = ctx.mediaTarget()
      if (!t || t.type !== 'sticker') return ctx.reply(`Reply sebuah *stiker* dengan ${ctx.prefix}toimg`)
      await ctx.react('⏳')
      const buf = await ctx.download(t.node, 'sticker')
      let out
      try {
        out = await stickerToImage(buf)
      } catch (e) {
        if (buf.includes('ANIM')) return ctx.reply('Stiker animasi belum bisa dijadikan gambar di perangkat ini.')
        throw e
      }
      if (out.type === 'video') await ctx.send({ video: out.buffer, gifPlayback: true, caption: '🎞️ Stiker animasi' })
      else await ctx.send({ image: out.buffer, caption: '🖼️ Selesai!' })
      await ctx.react('✅')
    }
  }
]
