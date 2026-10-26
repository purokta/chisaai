/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// QUEST & PERINGKAT
const { R, need } = require('../../lib/rpgctx')
const UI = require('../../lib/rpgui'), { G, fmt } = UI

module.exports = {
  name: 'quest',
  alias: ['misi', 'claimquest', 'klaim', 'toprpg', 'toplevel', 'topgold', 'topkill'],
  category: 'rpg',
  cmds: ['quest','claimquest','toprpg','topgold','topkill'],
  desc: 'Misi harian + leaderboard level/gold/kill',
  run: async (ctx) => {
    const { command, prefix, reply } = ctx
    if (['toprpg', 'toplevel', 'topgold', 'topkill'].includes(command)) {
      const key = command === 'topgold' ? 'gold' : command === 'topkill' ? 'kills' : 'level'
      const list = R.allUsers().sort((a, b) => key === 'level' ? (b.level - a.level || b.exp - a.exp) : b[key] - a[key]).slice(0, 10)
      if (!list.length) return reply('Belum ada pemain.')
      const title = { level: 'Top Level', gold: 'Top Gold', kills: 'Top Kill' }[key], medal = ['𝐈', '𝐈𝐈', '𝐈𝐈𝐈']
      return UI.say(ctx, { glyph: G.lion, title, sub: 'Chisa AI RPG',
        quote: list.map((x, i) => `${medal[i] || (i + 1) + '.'} *${x.name}*  —  ${key === 'level' ? `Lv.${x.level} • Rank ${R.rankOf(x.level).tier}` : fmt(x[key])}${x.clan ? `  [${x.clan}]` : ''}`) })
    }
    const u = need(ctx); if (!u) return
    R.ensureQuests(u)
    if (['claimquest', 'klaim'].includes(command)) {
      const ready = u.quest.list.filter(q => !q.done && q.have >= q.need)
      if (!ready.length) return reply(`Belum ada misi yang selesai. Cek ${prefix}quest`)
      let g = 0, x = 0; for (const q of ready) { q.done = true; g += q.g; x += q.x }
      let allDone = false, tk = false
      if (u.quest.list.every(q => q.done) && !u.quest.bonus) { u.quest.bonus = true; g += 500; R.give(u, 'summon_ticket'); allDone = true; tk = true }
      const gg = R.addGold(u, g), ex = R.addExp(u, x); R.save()
      return UI.send(ctx, u, { glyph: G.owl, title: 'Misi Selesai', sub: `${ready.length} misi`, tone: 'win', headline: 'Misi Selesai', ex, cardSub: `${ready.length} misi harian diklaim`,
        quote: ready.map(q => q.txt), tail: [allDone && `${G.scarab} Semua misi harian tuntas! Bonus 500 gold + Summon Ticket`], rows: [['GOLD', `+${fmt(gg)}`], ['EXP', `+${fmt(ex.amt)}`], tk && ['BONUS', 'Summon Ticket x1']],
        chips: [{ l: 'Gold', v: `+${fmt(gg)}`, c: '#fbbf24' }, { l: 'EXP', v: `+${fmt(ex.amt)}`, c: '#fbbf24' }, { l: 'Misi', v: `${ready.length} selesai`, c: '#34d399' }], log: ready.map(q => q.txt) })
    }
    R.save()
    return UI.say(ctx, { glyph: G.owl, title: 'Misi Harian', sub: 'reset tiap hari',
      quote: u.quest.list.flatMap((q, i) => [`${q.done ? '✓' : q.have >= q.need ? '◆' : '◇'} *${i + 1}.* ${q.txt}`, `   ${R.bar(q.have, q.need, 8)} ${q.have}/${q.need}  •  ${fmt(q.g)}g + ${fmt(q.x)} EXP`]),
      hint: `Klaim: ${prefix}claimquest  •  ✓ klaim  ◆ siap  ◇ berjalan` })
  },
}
