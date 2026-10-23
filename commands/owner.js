// Profil owner. Bisa dipanggil dengan #owner, atau cukup mengetik kata "owner".
// Nomor dan kontak owner sengaja TIDAK ditampilkan, hanya TikTok.
module.exports = {
  name: 'owner',
  aliases: ['creator', 'pemilik'],
  category: 'Lainnya',
  desc: 'Profil owner bot',
  async run(ctx) {
    const { config, sock } = ctx
    const o = config.owner
    const tiktok = String(o.tiktok || '').replace(/^@/, '')

    let card = `*👑 OWNER ${config.botName}*\n\n• Nama   : ${o.name}\n`
    if (tiktok) card += `• TikTok : @${tiktok}\n`
    if (o.about) card += `\n${o.about}\n`
    if (tiktok) card += `\nhttps://www.tiktok.com/@${tiktok}`

    let url = null
    try {
      url = await sock.profilePictureUrl(o.number + '@s.whatsapp.net', 'image')
    } catch {}

    if (url) await ctx.send({ image: { url }, caption: card })
    else await ctx.reply(card)
  }
}
