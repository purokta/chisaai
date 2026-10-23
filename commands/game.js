const games = require('../lib/games')

const cmds = Object.entries(games.TYPES).map(([name, t]) => ({
  name,
  category: 'Game',
  desc: t.title,
  run: ctx => games.start(ctx, name)
}))

module.exports = [
  ...cmds,
  {
    name: 'hint',
    category: 'Game',
    desc: 'Petunjuk game yang sedang berjalan',
    async run(ctx) {
      const h = games.hint(ctx)
      await ctx.reply(h ? `💡 ${h}` : 'Tidak ada game yang berjalan.')
    }
  },
  {
    name: 'nyerah',
    aliases: ['skip'],
    category: 'Game',
    desc: 'Menyerah, tampilkan jawaban',
    async run(ctx) {
      const g = games.giveUp(ctx)
      await ctx.reply(g ? `🏳️ Jawabannya: *${g.answer}*${g.extra ? '\n' + g.extra : ''}` : 'Tidak ada game yang berjalan.')
    }
  },
  {
    name: 'skor',
    aliases: ['leaderboard'],
    category: 'Game',
    desc: 'Papan skor game di chat ini',
    async run(ctx) {
      const rows = games.board(ctx.jid)
      if (!rows.length) return ctx.reply('Belum ada skor. Mulai dengan ' + ctx.prefix + 'tebakkata')
      const medal = ['🥇', '🥈', '🥉']
      await ctx.send({
        text: '🏆 *PAPAN SKOR*\n\n' + rows.map(([n, s], i) => `${medal[i] || i + 1 + '.'} @${n} — ${s}`).join('\n'),
        mentions: rows.map(([n]) => n + '@s.whatsapp.net')
      })
    }
  }
]
