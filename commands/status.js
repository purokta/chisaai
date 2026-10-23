const status = require('../lib/status')
const brand = require('../lib/brand')

module.exports = {
  name: 'status',
  aliases: ['stats', 'info'],
  category: 'Lainnya',
  desc: 'Status bot & server',
  async run(ctx) {
    const { config, db } = ctx
    const t0 = Date.now()
    const t = status.now()
    const sv = status.server()
    const isSelf = db.get('mode', 'public') === 'private'
    const bar = pct => '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10))
    await ctx.reply(
      `*📡 STATUS ${config.botName}*\n\n` +
        `🕒 ${t.tanggal}, ${t.jam}\n\n` +
        `*Bot*\n` +
        `• Mode  : ${isSelf ? config.modeLabels.private + ' 🔒' : config.modeLabels.public + ' 🌐'}\n` +
        `• Aktif : ${status.botUptime()}\n` +
        `• Perintah : ${ctx.commands.length}\n` +
        `• Memori bot : ${sv.botRam}\n\n` +
        `*Server*\n` +
        `• ${sv.platform} • ${sv.cpu}\n` +
        `• RAM : ${bar(sv.ramPct)} ${sv.ramPct}%\n  ${sv.ram}\n` +
        `• Hidup : ${sv.up}\n` +
        `• Node ${sv.node}\n\n` +
        `⚡ Respon: ${Date.now() - t0} ms\n\n© ${config.botName} • ${brand.mark()}`
    )
  }
}
