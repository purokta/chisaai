// Ambil foto profil: reply pesan orangnya (atau tag @dia, atau tulis nomornya)
module.exports = {
  name: 'pp',
  aliases: ['getpp', 'fotoprofil'],
  category: 'Lainnya',
  desc: 'Ambil foto profil (reply orangnya)',
  async run(ctx) {
    let target = ctx.quotedSender || ctx.mentioned[0]
    const num = (ctx.args[0] || '').replace(/\D/g, '')
    if (!target && num.length >= 8) target = ctx.config.normalizeNumber(num) + '@s.whatsapp.net'
    if (!target) target = ctx.isGroup ? ctx.sender : ctx.jid
    target = target.replace(/:\d+@/, '@')

    let url = null
    try {
      url = await ctx.sock.profilePictureUrl(target, 'image')
    } catch {}
    if (!url) {
      return ctx.reply('Tidak bisa mengambil foto profil (orangnya tidak punya foto, atau disembunyikan oleh privasi).')
    }
    await ctx.send({ image: { url }, caption: '📸 Foto profil' })
  }
}
