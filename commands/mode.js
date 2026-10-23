// Pengaturan khusus owner: #self (#private), #public, #autoreply
const { vipNumbers } = require('../lib/access')

module.exports = [
  {
    name: 'private',
    aliases: ['self'],
    category: 'Owner',
    ownerOnly: true,
    desc: 'Mode SELF: hanya owner + VIP yang dilayani',
    async run(ctx) {
      ctx.db.set('mode', 'private')
      const n = vipNumbers().size
      await ctx.reply(
        `🔒 Mode *${ctx.config.modeLabels.private}* aktif.\nBot hanya merespons owner${n ? ` dan ${n} ${ctx.config.vipLabel}` : ''}.`
      )
    }
  },
  {
    name: 'public',
    category: 'Owner',
    ownerOnly: true,
    desc: 'Mode PUBLIC: semua orang dilayani',
    async run(ctx) {
      ctx.db.set('mode', 'public')
      await ctx.reply(`🔓 Mode *${ctx.config.modeLabels.public}* aktif.\nBot merespons semua orang.`)
    }
  },
  {
    name: 'autoreply',
    category: 'Owner',
    ownerOnly: true,
    usage: 'on/off',
    desc: 'Nyalakan / matikan balasan AI otomatis',
    async run(ctx) {
      const arg = (ctx.args[0] || '').toLowerCase()
      if (['on', 'off'].includes(arg)) ctx.db.set('autoReply', arg === 'on')
      const now = ctx.db.get('autoReply', ctx.config.autoReply.enabled)
      await ctx.reply(`💬 Auto-reply ngobrol: *${now ? 'ON' : 'OFF'}*\nUbah: ${ctx.prefix}autoreply on / off`)
    }
  }
]
