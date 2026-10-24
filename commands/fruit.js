// Inventory buah 🍎: #petik, #inv, #jual, #harga, #topbuah
const fruit = require('../lib/fruit')
const { numOf } = require('../lib/limits')

const box = (title, lines) => `「 ${title} 」\n│\n${lines.map(l => '│ ' + l).join('\n')}\n└────────────`
const who = ctx => numOf(ctx.sender)

module.exports = [
  {
    name: 'petik',
    aliases: ['panen', 'metik'],
    category: 'Game',
    desc: 'Petik buah acak (jeda 30 detik)',
    async run(ctx) {
      const r = fruit.pick(who(ctx))
      if (r.wait) return ctx.reply(`⏳ Pohonnya masih kosong. Tunggu ${r.wait} detik lagi.`)
      const lines = Object.entries(r.got).map(([k, n]) => {
        const f = fruit.BY_KEY[k]
        return `${f.emoji} ${f.name} ×${n}  _(${fruit.rarity(f.value)})_`
      })
      await ctx.reply(box('🧺 HASIL PETIK', lines) + `\nCek: ${ctx.prefix}inv`)
    }
  },
  {
    name: 'inv',
    aliases: ['inventory', 'tas'],
    category: 'Game',
    desc: 'Lihat inventory buah & koin',
    async run(ctx) {
      const u = fruit.user(who(ctx))
      const items = Object.entries(u.inv)
        .map(([k, n]) => ({ f: fruit.BY_KEY[k], n }))
        .filter(x => x.f)
        .sort((a, b) => b.f.value - a.f.value)
      const pg = fruit.progress(u.exp)
      const n10 = Math.max(0, Math.min(10, Math.round((pg.into / pg.span) * 10)))
      const lines = [`👤 ${ctx.pushName || 'Kamu'}`, `⭐ Level ${pg.lv}  ${'█'.repeat(n10)}${'░'.repeat(10 - n10)} ${pg.into}/${pg.span} EXP`, `💰 Koin: ${fruit.fmt(u.coins)}`, '']
      if (!items.length) lines.push(`Kosong. Ketik ${ctx.prefix}petik untuk memetik buah!`)
      for (const { f, n } of items) lines.push(`${f.emoji} ${f.name} ×${n} — ${fruit.fmt(f.value)} /buah (${fruit.fmt(f.value * n)})`)
      if (items.length) lines.push('', `📦 Nilai buah: ${fruit.fmt(fruit.worth(u.inv))} koin`)
      await ctx.reply(box('🎒 INVENTORY', lines) + (items.length ? `\nJual: ${ctx.prefix}jual <buah> [jumlah] atau ${ctx.prefix}jual semua\nMakan (jadi EXP): ${ctx.prefix}makan <buah> [jumlah]` : ''))
    }
  },
  {
    name: 'jual',
    aliases: ['sell'],
    category: 'Game',
    usage: '<buah|semua> [jumlah]',
    desc: 'Jual buah jadi koin',
    async run(ctx) {
      const [a, b] = ctx.args
      if (!a) return ctx.reply(`Contoh:\n${ctx.prefix}jual apel 2\n${ctx.prefix}jual 🍎\n${ctx.prefix}jual semua`)
      let key = (a || '').toLowerCase() === 'semua' ? 'semua' : fruit.find(a)?.key
      if (!key) return ctx.reply(`Buah "${a}" tidak ada. Lihat daftar: ${ctx.prefix}harga`)
      let count
      if (b !== undefined) {
        if (b.toLowerCase() === 'semua') count = 'semua'
        else {
          count = Number(b)
          if (!Number.isInteger(count) || count < 1) return ctx.reply('Jumlahnya harus angka bulat, contoh: ' + ctx.prefix + 'jual apel 2')
        }
      }
      const r = fruit.sell(who(ctx), key, count)
      if (!r) return ctx.reply(key === 'semua' ? 'Inventory kosong, tidak ada yang dijual.' : `Kamu tidak punya ${fruit.BY_KEY[key].emoji} ${fruit.BY_KEY[key].name}.`)
      const lines = Object.entries(r.sold).map(([k, n]) => `${fruit.BY_KEY[k].emoji} ${fruit.BY_KEY[k].name} ×${n}`)
      lines.push('', `💰 +${fruit.fmt(r.gain)} koin`, `🏦 Total koin: ${fruit.fmt(r.coins)}`)
      await ctx.reply(box('💸 TERJUAL', lines))
    }
  },
  {
    name: 'makan',
    aliases: ['eat'],
    category: 'Game',
    usage: '<buah> [jumlah]',
    desc: 'Makan buah jadi EXP',
    async run(ctx) {
      const f = fruit.find(ctx.args[0])
      if (!f) return ctx.reply(`Contoh: ${ctx.prefix}makan apel 2\nDaftar buah: ${ctx.prefix}harga`)
      let count
      if (ctx.args[1] !== undefined) {
        if (ctx.args[1].toLowerCase() === 'semua') count = 'semua'
        else {
          count = Number(ctx.args[1])
          if (!Number.isInteger(count) || count < 1) return ctx.reply(`Jumlahnya harus angka bulat, contoh: ${ctx.prefix}makan apel 2`)
        }
      }
      const r = fruit.eat(who(ctx), f.key, count)
      if (!r) return ctx.reply(`Kamu tidak punya ${f.emoji} ${f.name}.`)
      await ctx.reply(`😋 Kamu makan ${f.emoji} ${f.name} ×${r.n}\n⭐ +${fruit.fmt(r.gain)} EXP (total ${fruit.fmt(r.total)})` + (r.levelUp ? `\n🎉 *LEVEL UP!* Lv ${r.from} → Lv ${r.to}` : ''))
    }
  },
  {
    name: 'harga',
    aliases: ['buah', 'hargabuah'],
    category: 'Game',
    desc: 'Daftar buah, nilai & harga jual',
    async run(ctx) {
      const lines = [...fruit.FRUITS]
        .sort((a, b) => b.value - a.value)
        .map(f => `${f.emoji} ${f.name} — ${fruit.fmt(f.value)} koin  _(${fruit.rarity(f.value)})_`)
      await ctx.reply(box('🏷️ HARGA BUAH', lines))
    }
  },
  {
    name: 'topbuah',
    aliases: ['topkoin'],
    category: 'Game',
    desc: 'Peringkat kekayaan (koin + buah)',
    async run(ctx) {
      const rows = fruit.board()
      if (!rows.length) return ctx.reply(`Belum ada pemain. Mulai dengan ${ctx.prefix}petik`)
      const medal = ['🥇', '🥈', '🥉']
      await ctx.send({
        text: box('🏆 PERINGKAT', rows.map((r, i) => `${medal[i] || i + 1 + '.'} @${r.id} — ${fruit.fmt(r.total)}`)),
        mentions: rows.map(r => r.id + '@s.whatsapp.net')
      })
    }
  }
]
