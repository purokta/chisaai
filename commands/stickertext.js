// Stiker teks: #stext (diam) dan #stextanim (animasi hitam-putih yang lagi viral)
const { createSticker, framesToSticker } = require('../lib/sticker')
const T = require('../lib/textimg')

module.exports = [
  {
    name: 'stext',
    aliases: ['st', 'ttp', 'stikerteks'],
    category: 'Stiker',
    usage: '<teks>',
    desc: 'Teks jadi stiker',
    async run(ctx) {
      const text = T.clean(ctx.query).slice(0, 200)
      if (!text) {
        return ctx.reply(`Tulis teksnya, contoh:\n${ctx.prefix}stext halo semua\n\n(Emoji & huruf non-latin belum didukung)`)
      }
      await ctx.react('⏳')
      const Jimp = require('jimp')
      const font = await T.pickFont(Jimp, text)
      const png = await T.render(Jimp, font, text)
      await ctx.send({ sticker: await createSticker(png, 'image') })
      await ctx.react('✅')
    }
  },
  {
    name: 'stextanim',
    aliases: ['sanim', 'attp', 'bratvid', 'animtext'],
    category: 'Stiker',
    usage: '<teks>',
    desc: 'Teks animasi hitam-putih (viral)',
    async run(ctx) {
      // pilihan di depan teks: kedip / gelap
      let q = ctx.query.trim()
      let blink = false
      let dark = false
      for (;;) {
        const m = q.match(/^(kedip|blink|gelap|hitam|dark|black)\s+/i)
        if (!m) break
        if (/^(kedip|blink)$/i.test(m[1])) blink = true
        else dark = true
        q = q.slice(m[0].length)
      }
      const text = T.clean(q).replace(/\s+/g, ' ').slice(0, 150)
      const words = text.split(' ').filter(Boolean).slice(0, 30)
      if (!words.length) {
        return ctx.reply(
          `Tulis teksnya, contoh:\n${ctx.prefix}stextanim aku sayang kamu\n\n` +
            `Gaya lain:\n• ${ctx.prefix}stextanim kedip teksmu  (hitam-putih berkedip)\n• ${ctx.prefix}stextanim gelap teksmu  (latar hitam, huruf putih)`
        )
      }
      await ctx.react('⏳')
      const Jimp = require('jimp')
      const full = words.join(' ')

      let frames = []
      if (blink) {
        // teks di tengah, latar bergantian putih <-> hitam
        const fontLight = await T.pickFont(Jimp, full, false)
        const fontDark = await T.pickFont(Jimp, full, true)
        const light = await T.render(Jimp, fontLight, full, { dark: false })
        const darkFrame = await T.render(Jimp, fontDark, full, { dark: true })
        for (let i = 0; i < 4; i++) frames.push(light, darkFrame)
      } else {
        // muncul kata demi kata (gaya mengetik), ukuran huruf tetap supaya tidak loncat-loncat
        const font = await T.pickFont(Jimp, full, dark)
        for (let i = 1; i <= words.length; i++) {
          frames.push(await T.render(Jimp, font, words.slice(0, i).join(' '), { dark, align: 'left' }))
        }
        const last = frames[frames.length - 1]
        for (let i = 0; i < 6; i++) frames.push(last) // tahan di akhir
      }

      await ctx.send({ sticker: await framesToSticker(frames, blink ? 3 : 3) })
      await ctx.react('✅')
    }
  }
]
