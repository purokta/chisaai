// Perintah kecil (tersembunyi dari menu)
module.exports = [
  {
    name: 'ping',
    hidden: true,
    desc: 'Tes bot',
    async run(ctx) {
      const t = Date.now()
      await ctx.reply('Pong! 🏓')
      await ctx.reply(`Respon: ${Date.now() - t} ms`)
    }
  },
  {
    name: 'myid',
    hidden: true,
    desc: 'Tampilkan ID pengirim (untuk pengaturan owner)',
    async run(ctx) {
      await ctx.reply(`Pengirim : ${ctx.sender}\nChat     : ${ctx.jid}\nOwner?   : ${ctx.isOwner ? 'ya' : 'tidak'}`)
    }
  },
  {
    name: 'reload',
    hidden: true,
    ownerOnly: true,
    desc: 'Muat ulang perintah tanpa restart (setelah menambah/mengubah file di commands/)',
    async run(ctx) {
      const n = ctx.reload()
      await ctx.reply(`🔄 ${n} perintah dimuat ulang.`)
    }
  }
]
