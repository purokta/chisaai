// Menu Economy: kurs dolar → rupiah, indeks saham, berita ekonomi Indonesia yang lagi ramai
const eko = require('../lib/ekonomi')

const fail = (ctx, what, e) => ctx.reply(`⚠️ ${what} sedang tidak bisa diambil (${String(e?.message || e).slice(0, 80)}). Coba lagi sebentar lagi.`)

module.exports = [
  {
    name: 'kurs',
    aliases: ['dolar', 'dollar', 'usd', 'kursdolar'],
    category: 'Economy',
    usage: '[jumlah] [dari] [ke]',
    desc: 'Kurs dolar ke rupiah (bisa mata uang lain)',
    async run(ctx) {
      const a = ctx.args
      let amount = 1, from = 'USD', to = 'IDR'
      if (a.length) {
        const n = Number(String(a[0]).replace(/\./g, '').replace(',', '.'))
        const rest = isNaN(n) ? a : a.slice(1)
        if (!isNaN(n)) amount = n
        if (rest[0]) from = rest[0].toUpperCase()
        if (rest[1]) to = rest[1].toUpperCase()
        else if (rest[0] && from !== 'IDR') to = 'IDR'
        if (rest[0] && from === 'IDR' && !rest[1]) to = 'USD'
      }
      if (!amount || amount < 0) return ctx.reply(`Contoh: ${ctx.prefix}kurs  atau  ${ctx.prefix}kurs 25 usd idr  atau  ${ctx.prefix}kurs 100000 idr usd`)
      let r
      try { r = await eko.rates(from) } catch (e) { return fail(ctx, 'Kurs', e) }
      const t = eko.kursText(r, { amount, from, to })
      if (!t) return ctx.reply('Kode mata uang tidak dikenal (contoh: usd, idr, eur, jpy, sgd, myr).')
      await ctx.reply(t)
    }
  },
  {
    name: 'saham',
    aliases: ['ihsg', 'indeks', 'indekssaham', 'bursa'],
    category: 'Economy',
    usage: '[kode saham]',
    desc: 'Indeks saham (IHSG, LQ45, dunia) atau harga saham, mis. saham bbca',
    async run(ctx) {
      const q = (ctx.query || '').trim()
      if (!q) {
        let ok
        try { ok = await eko.indices() } catch (e) { return fail(ctx, 'Data saham', e) }
        return ctx.reply(eko.indicesText(ok))
      }
      let r, sym
      for (const c of eko.stockCandidates(q.split(/\s+/)[0])) {
        try { r = await eko.quote(c); sym = c; break } catch {}
      }
      if (!r) return ctx.reply(`Saham "${q}" tidak ditemukan / data belum tersedia. Contoh: ${ctx.prefix}saham bbca, ${ctx.prefix}saham aapl`)
      await ctx.reply(`📈 *${r.name}* (${sym})\n\n${eko.quoteLine(r, `${r.price ? eko.fmt(r.price) : ''} ${r.currency}`.trim())}\n\n_sumber: ${r.src}. Bisa tertunda._`)
    }
  },
  {
    name: 'beritaekonomi',
    aliases: ['ekonews', 'beritaeko', 'ekonomi', 'newsekonomi'],
    category: 'Economy',
    usage: '[jumlah]',
    desc: 'Berita ekonomi Indonesia yang lagi viral / ramai diberitakan',
    async run(ctx) {
      const n = Math.min(10, Math.max(3, parseInt(ctx.args[0]) || 7))
      let list
      try { list = await eko.news(n) } catch (e) { return fail(ctx, 'Berita ekonomi', e) }
      if (!list.length) return ctx.reply('Belum ada berita ekonomi yang cocok saat ini.')
      await ctx.reply(eko.newsText(list))
    }
  }
]
