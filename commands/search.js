const { search } = require('../lib/search')

module.exports = {
  name: 'search',
  aliases: ['cari', 'google', 'ddg'],
  category: 'Lainnya',
  usage: '<kata kunci>',
  desc: 'Cari informasi di internet',
  async run(ctx) {
    const q = ctx.query.trim().slice(0, 200)
    if (!q) return ctx.reply(`Tulis yang mau dicari, contoh:\n${ctx.prefix}search cara membuat nasi goreng`)
    await ctx.react('🔎')
    const res = await search(q, ctx.config.search.results)
    if (!res.items.length) return ctx.reply(`Tidak ada hasil untuk "${q}". Coba kata kunci lain.`)

    let out = `🔎 *${q}*\n_via ${res.source}_\n`
    res.items.forEach((r, i) => {
      out += `\n${i + 1}. *${r.title}*\n${r.snippet ? r.snippet + '\n' : ''}${r.url}\n`
    })
    await ctx.reply(out.trim())
  }
}
