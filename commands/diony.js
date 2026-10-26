// Perintah bantu untuk fitur tambahan Chisa AI: #fitur (cari), #dio (versi tambahan), #chisaai (versi bawaan)
const diony = require('../lib/diony')
const loader = require('../lib/loader')

// jalankan perintah lain dengan sisa teks sebagai argumennya
function runAs(ctx, cmd, name) {
  const rest = (ctx.text || '').replace(/^\s*\S+\s*/, '')
  const c2 = Object.create(ctx)
  c2.command = name
  c2.text = rest
  c2.args = rest ? rest.split(/\s+/) : []
  c2.query = rest
  return cmd.run(c2)
}

module.exports = [
  {
    name: 'chisaai',
    category: 'Lainnya',
    hidden: true,
    usage: '<perintah>',
    desc: 'Jalankan versi bawaan Chisa dari sebuah perintah (kalau namanya sama dengan fitur tambahan)',
    async run(ctx) {
      const name = (ctx.args[0] || '').toLowerCase()
      if (!name) return ctx.reply(`Contoh: ${ctx.prefix}chisaai inv\nMenjalankan versi bawaan dari perintah itu.`)
      const c = loader.find(name)
      if (!c) return ctx.reply(`Perintah "${name}" tidak ada.`)
      return runAs(ctx, c, name)
    }
  },
  {
    name: 'dio',
    category: 'Lainnya',
    platform: 'whatsapp',
    hidden: true,
    usage: '<perintah> [teks]',
    desc: 'Jalankan versi fitur tambahan dari sebuah perintah (walau Chisa punya nama yang sama)',
    async run(ctx) {
      const name = (ctx.args[0] || '').toLowerCase()
      if (!name) return ctx.reply(`Contoh: ${ctx.prefix}dio inv\nMenjalankan versi fitur tambahan dari perintah itu.`)
      const c = diony.find(name)
      if (!c) return ctx.reply(`Perintah "${name}" tidak ada. Cari: ${ctx.prefix}fitur <kata>`)
      return runAs(ctx, c, name)
    }
  },
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
      const dm = require('../lib/dionymenu')
      const found = diony.searchFeatures(q, 12)
      if (!found.length) return ctx.reply(`Tidak ada fitur yang cocok dengan "${q}".`)
      await ctx.reply(found.map(pl => dm.featureText(pl, ctx.prefix)).join('\n\n').slice(0, 3800))
    }
  }
]
