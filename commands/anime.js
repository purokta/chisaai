// Fitur anime (hanya konten aman / SFW). Beberapa server dicoba bergantian.
const http = require('../lib/http')

const PICS = {
  waifu: ['Gambar waifu acak', 'waifu', 'waifu'],
  neko: ['Gambar neko (anak kucing) acak', 'neko', 'neko'],
  megumin: ['Gambar Megumin acak', 'megumin', 'megumin'],
  shinobu: ['Gambar Shinobu acak', 'shinobu', null]
}

// semua sumber hanya endpoint SFW
const sources = (waifuPics, nekosBest) => [
  waifuPics && (async () => (await http.getJson('https://api.waifu.pics/sfw/' + waifuPics, { timeout: 12000 }))?.url),
  nekosBest && (async () => (await http.getJson('https://nekos.best/api/v2/' + nekosBest, { timeout: 12000 }))?.results?.[0]?.url),
  async () => (await http.getJson('https://nekos.best/api/v2/waifu', { timeout: 12000 }))?.results?.[0]?.url
].filter(Boolean)

async function fetchImage(list) {
  let last
  for (const src of list) {
    for (let i = 0; i < 2; i++) {
      try {
        const url = await src()
        if (!url) break
        const { buffer } = await http.getBuffer(url, { timeout: 30000, maxMB: 10 })
        return buffer
      } catch (e) {
        last = e
      }
    }
  }
  throw last || new Error('Gambar tidak tersedia')
}

const pics = Object.entries(PICS).map(([name, [desc, wp, nb]]) => ({
  name,
  category: 'Anime',
  desc,
  async run(ctx) {
    await ctx.react('🌸')
    const buffer = await fetchImage(sources(wp, nb))
    await ctx.send({ image: buffer, caption: '🌸 ' + name })
  }
}))

module.exports = [
  ...pics,
  {
    name: 'animeinfo',
    aliases: ['anime'],
    category: 'Anime',
    usage: '<judul>',
    desc: 'Info anime (skor, episode, sinopsis)',
    async run(ctx) {
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}animeinfo one piece`)
      const r = await http.getJson(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(ctx.query)}&limit=1&sfw=true`)
      const a = r.data?.[0]
      if (!a) return ctx.reply('Anime tidak ditemukan.')
      const cap =
        `🎌 *${a.title}*${a.title_japanese ? ' (' + a.title_japanese + ')' : ''}\n\n` +
        `⭐ ${a.score ?? '-'} • ${a.type || '-'} • ${a.episodes ?? '?'} eps\nStatus: ${a.status || '-'}\n` +
        `Genre: ${(a.genres || []).map(g => g.name).join(', ') || '-'}\n\n${String(a.synopsis || '').slice(0, 700)}`
      const img = a.images?.jpg?.large_image_url
      if (img) {
        try {
          const { buffer } = await http.getBuffer(img)
          return await ctx.send({ image: buffer, caption: cap })
        } catch {}
      }
      await ctx.reply(cap)
    }
  }
]
