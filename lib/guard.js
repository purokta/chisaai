// Penjaga pesan non-perintah: antilink grup, jawaban game
const db = require('./db')
const group = require('./group')
const games = require('./games')

const WA_LINK = /(chat\.whatsapp\.com\/[A-Za-z0-9]{8,}|(?:t|telegram)\.me\/(?:\+|joinchat\/)[\w-]{8,})/i

async function onMessage(ctx) {
  const { text, isGroup } = ctx
  if (!text) return false

  if (isGroup && !ctx.fromMe && !ctx.isOwner && db.get('antilink', {})[ctx.jid] && WA_LINK.test(text)) {
    try {
      const g = await group.info(ctx)
      if (!g.isAdmin && g.isBotAdmin) {
        await ctx.sock.sendMessage(ctx.jid, { delete: ctx.m.key })
        await ctx.sock.sendMessage(ctx.jid, {
          text: `🚫 @${group.num(ctx.sender)} dilarang kirim link grup di sini.`,
          mentions: [ctx.sender]
        })
        return true
      }
    } catch {}
  }

  return games.check(ctx, text)
}

module.exports = { onMessage }
