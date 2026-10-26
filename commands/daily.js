// Login harian 🎁 dan gacha anime 🎰: hadiah koin & EXP. Data permanen di data/db.json.
const gacha = require('../lib/gacha')
const fruit = require('../lib/fruit')
const http = require('../lib/http')
const { numOf } = require('../lib/limits')

const who = ctx => numOf(ctx.sender)
const fmt = fruit.fmt
const tgButtons = ctx =>
  ctx.platform === 'telegram'
    ? { tgButtons: [[{ text: '🎰 Gacha', data: '#gacha' }, { text: '📚 Koleksi', data: '#koleksi' }], [{ text: '🎁 Login harian', data: '#daily' }, { text: '🏠 Menu', data: '#menu' }]] }
    : {}
const levelUp = lv => (lv ? `\n🎉 *LEVEL UP!* Lv ${lv.from} → Lv ${lv.to}` : '')

module.exports = [
  {
    name: 'daily',
    aliases: ['login', 'absen', 'claim', 'checkin'],
    category: 'Game',
    desc: 'Login harian: koin & EXP (streak makin besar)',
    async run(ctx) {
      const r = gacha.claimDaily(who(ctx))
      if (r.already) {
        return ctx.send({ text: `🎁 Kamu sudah login hari ini.\n🔥 Streak: ${r.streak} hari\nKembali lagi besok ya!\n\nGacha gratis: ${ctx.prefix}gacha`, ...tgButtons(ctx) })
      }
      const lines = [`🎁 *LOGIN HARIAN*`, `🔥 Streak: *${r.streak} hari* (terbaik ${r.best})`, '', `💰 +${fmt(r.coins)} koin`, `⭐ +${r.exp} EXP`]
      if (r.drops.length) lines.push('🎒 ' + r.drops.map(f => `${f.emoji} ${f.name}`).join(', '))
      if (r.ticket) lines.push('🎟️ +1 tiket gacha')
      lines.push(...r.bonus.map(b => '\n' + b))
      lines.push('', `💳 Saldo: ${fmt(r.balance)} koin`, `Tiap 7 hari berturut-turut ada bonus besar!`)
      await ctx.send({ text: lines.join('\n') + levelUp(r.levelUp), ...tgButtons(ctx) })
    }
  },
  {
    name: 'gacha',
    aliases: ['pull', 'gachaanime'],
    category: 'Game',
    usage: '[beli]',
    desc: 'Gacha karakter anime (1x gratis per hari)',
    async run(ctx) {
      const id = who(ctx)
      const mode = (ctx.args[0] || '').toLowerCase() === 'beli' ? 'beli' : 'auto'
      await ctx.react('🎰')
      const r = await gacha.pull(id, mode)
      if (r.error === 'habis') return ctx.send({ text: `🎰 Gacha gratis hari ini sudah dipakai.\nBeli 1 pull: *${ctx.prefix}gacha beli* (${fmt(r.cost)} koin, sisa ${r.paidLeft}x hari ini, koinmu ${fmt(r.coins)}).\nAtau login harian: ${ctx.prefix}daily`, ...(ctx.platform === 'telegram' ? { tgButtons: [[{ text: `🎰 Beli 1 pull (${fmt(r.cost)})`, data: '#gacha beli' }, { text: '🎁 Login harian', data: '#daily' }]] } : {}) })
      if (r.error === 'limit') return ctx.send({ text: `🎰 Batas beli ${r.max}x per hari sudah habis. Coba lagi besok!`, ...tgButtons(ctx) })
      if (r.error === 'koin') return ctx.send({ text: `🎰 Koin kurang (butuh ${fmt(r.need)}, kamu ${fmt(r.have)}).\nCari koin: ${ctx.prefix}daily, ${ctx.prefix}petik lalu ${ctx.prefix}jual, atau menang game.`, ...tgButtons(ctx) })

      const how = { gratis: 'gratis hari ini', tiket: 'pakai tiket', beli: `beli (−${fmt(gacha.cfg().cost)} koin)` }[r.how]
      const left = r.freeLeft ? 'masih ada 1 pull gratis' : r.tickets ? `${r.tickets} tiket` : `beli: ${ctx.prefix}gacha beli (${fmt(gacha.cfg().cost)} koin, sisa ${r.paidLeft}x hari ini)`
      const text =
        `🎰 *GACHA ANIME* — ${how}\n\n${r.R.stars} *${r.rarity}*${r.isNew ? '  ✨BARU!' : `  (sudah punya ×${r.count})`}\n` +
        `*${r.name}*${r.fav ? `\n❤️ ${fmt(r.fav)} favorit` : ''}\n\n` +
        `💰 +${fmt(r.coins)} koin  ⭐ +${r.exp} EXP${levelUp(r.levelUp)}\n` +
        `💳 Saldo: ${fmt(r.balance)}\n\n` +
        `Pity SSR: ${r.pitySSR}/${gacha.cfg().pitySSR}\nBerikutnya: ${left}`
      let sent = false
      if (r.img) {
        try {
          const { buffer } = await http.getBuffer(r.img, { timeout: 12000, maxMB: 5 })
          await ctx.send({ image: buffer, caption: text, ...tgButtons(ctx) })
          sent = true
        } catch {}
      }
      if (!sent) await ctx.send({ text, ...tgButtons(ctx) })
    }
  },
  {
    name: 'koleksi',
    aliases: ['collection', 'karakter'],
    category: 'Game',
    desc: 'Koleksi karakter anime hasil gacha',
    async run(ctx) {
      const { list, total } = gacha.collection(who(ctx))
      if (!list.length) return ctx.send({ text: `📚 Koleksimu masih kosong.\nCoba ${ctx.prefix}gacha (gratis 1x per hari)!`, ...tgButtons(ctx) })
      const by = {}
      for (const c of list) (by[c.r] ||= []).push(c)
      const out = [`📚 *KOLEKSI* — ${list.length} karakter • ${total}x pull`]
      let shown = 0
      for (const rk of ['SSR', 'SR', 'R', 'N']) {
        if (!by[rk]) continue
        out.push(`\n${gacha.RAR[rk].stars} *${rk}* (${by[rk].length})`)
        for (const c of by[rk]) {
          if (shown++ >= 40) break
          out.push(`• ${c.name}${c.n > 1 ? ' ×' + c.n : ''}`)
        }
      }
      if (list.length > 40) out.push(`\n…dan ${list.length - 40} lainnya`)
      await ctx.send({ text: out.join('\n'), ...tgButtons(ctx) })
    }
  }
]
