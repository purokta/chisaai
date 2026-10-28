// Pencarian fitur: #fitur <kata>
const plug = require('../lib/chisaplug')

module.exports = [
  {
    name: 'fitur',
    aliases: ['carifitur', 'features'],
    category: 'Lainnya',
    platform: 'whatsapp',
    usage: '<kata>',
    desc: 'Cari fitur (nama / kata kunci)',
    async run(ctx) {
      const q = (ctx.text || '').trim()
      if (!q) return ctx.reply(`Contoh: ${ctx.prefix}fitur zakat\nMenampilkan fitur yang cocok.`)
      const dm = require('../lib/chisamenu')
      const found = plug.searchFeatures(q, 12)
      if (!found.length) return ctx.reply(`Tidak ada fitur yang cocok dengan "${q}".`)
      await ctx.reply(found.map(pl => dm.featureText(pl, ctx.prefix)).join('\n\n').slice(0, 3800))
    }
  }
]
