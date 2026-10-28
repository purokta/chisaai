/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KEBUN: tanam bibit, tunggu (jalan terus walau kamu offline), lalu panen jadi bahan yang bisa dijual.
//   .kebun (lihat petak & bibit) • .tanam <tanaman> [jumlah|all] • .panen
const { R, need, itemName } = require('../../lib/rpgctx')
const UI = require('../../lib/rpgui'), { G, fmt } = UI

const CROPS = {
  gandum:   { n: 'Gandum',      item: 'wheat',          seed: 15,   min: 1,  mins: 4,   y: [3, 5], exp: 4 },
  wortel:   { n: 'Wortel',      item: 'carrot',         seed: 40,   min: 1,  mins: 10,  y: [3, 5], exp: 8 },
  labu:     { n: 'Labu Emas',   item: 'pumpkin',        seed: 120,  min: 10, mins: 30,  y: [3, 4], exp: 18 },
  jamur:    { n: 'Jamur Sihir', item: 'magic_mushroom', seed: 300,  min: 20, mins: 60,  y: [2, 4], exp: 35 },
  bungabulan:{ n: 'Bunga Bulan',item: 'moon_flower',    seed: 800,  min: 35, mins: 180, y: [2, 3], exp: 80 },
  apelemas: { n: 'Apel Emas',   item: 'golden_apple',   seed: 2500, min: 60, mins: 480, y: [1, 2], exp: 220 },
}
const plotsOf = (u) => Math.min(8, 3 + Math.floor(u.level / 25))
const fm = (ms) => { const s = Math.ceil(ms / 1000); return s >= 3600 ? `${Math.floor(s / 3600)}j ${Math.floor((s % 3600) / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}d` : `${s}d` }
const farm = (u) => (u.farm = u.farm || { plots: [], harvests: 0 })

module.exports = {
  name: 'kebun', alias: ['farm', 'tanam', 'plant', 'harvest', 'bibit'], category: 'rpg', cmds: ['kebun', 'tanam'],
  desc: 'Berkebun idle: .kebun, .tanam <tanaman> [jumlah], .panen',
  run: async (ctx) => {
    const { command: c, args, prefix, reply } = ctx
    const u = need(ctx); if (!u) return
    const f = farm(u), now = Date.now(), cap = plotsOf(u)
    f.plots = f.plots.filter(Boolean)

    if (['tanam', 'plant'].includes(c)) {
      const key = (args[0] || '').toLowerCase(), cr = CROPS[key]
      if (!cr) return reply(`Contoh: ${prefix}tanam wortel 3\n\n` + Object.entries(CROPS).map(([k, v]) => `• ${k} — bibit ${fmt(v.seed)}g • ${v.mins >= 60 ? v.mins / 60 + ' jam' : v.mins + ' menit'} • Lv.${v.min}+`).join('\n'))
      if (u.level < cr.min) return reply(`*${cr.n}* butuh Lv.${cr.min} (kamu Lv.${u.level}).`)
      const free = cap - f.plots.length; if (free <= 0) return reply(`Semua ${cap} petak terisi. Panen dulu: ${prefix}panen`)
      let n = /^(all|semua)$/i.test(args[1] || '') ? free : Math.max(1, parseInt(args[1]) || 1)
      n = Math.min(n, free, Math.floor(u.gold / cr.seed)); if (n < 1) return reply(`Gold kurang. Bibit ${cr.n} ${fmt(cr.seed)} gold/petak.`)
      u.gold -= n * cr.seed
      for (let i = 0; i < n; i++) f.plots.push({ c: key, ready: now + cr.mins * 60000 })
      R.save()
      return UI.say(ctx, { glyph: G.plant, title: 'Menanam', sub: cr.n, quote: [`Menanam *${cr.n}* di ${n} petak (biaya ${fmt(n * cr.seed)} gold)`, `Siap dipanen dalam *${fm(cr.mins * 60000)}*`, `Petak terpakai ${f.plots.length}/${cap}`], hint: `${prefix}kebun untuk memantau • ${prefix}panen saat siap` })
    }

    if (['panen', 'harvest'].includes(c)) {
      const ready = f.plots.filter(p => p.ready <= now)
      if (!ready.length) return reply(f.plots.length ? `Belum ada yang siap. Terdekat: *${fm(Math.min(...f.plots.map(p => p.ready)) - now)}* lagi.` : `Kebunmu kosong. ${prefix}tanam <tanaman>`)
      const got = {}; let exp = 0
      for (const p of ready) { const cr = CROPS[p.c]; if (!cr) continue; const q = R.rnd(cr.y[0], cr.y[1]); got[cr.item] = (got[cr.item] || 0) + q; R.give(u, cr.item, q); exp += cr.exp }
      f.plots = f.plots.filter(p => p.ready > now); f.harvests += ready.length
      const ex = R.addExp(u, exp); R.save()
      return UI.send(ctx, u, { glyph: G.plant, title: 'Panen', tone: 'gain', headline: 'Panen Berhasil', ex, cardSub: `${ready.length} petak dipanen`,
        quote: Object.entries(got).map(([k, v]) => `${G.plant} ${itemName(k)} x${v}`), rows: [['EXP', `+${fmt(ex.amt)}`], ['TOTAL PANEN', `${fmt(f.harvests)} petak`]],
        log: Object.entries(got).map(([k, v]) => `${R.D.ITEMS[k].n} x${v}`), chips: [{ l: 'EXP', v: `+${fmt(ex.amt)}`, c: '#fbbf24' }, { l: 'Petak', v: `${ready.length} dipanen`, c: '#34d399' }], hint: `Jual: ${prefix}sell all` })
    }

    // .kebun
    const rows = f.plots.map((p, i) => { const cr = CROPS[p.c], left = p.ready - now; return [`#${i + 1}`, `${cr ? cr.n : p.c} — ${left <= 0 ? 'SIAP PANEN' : fm(left)}`] })
    for (let i = f.plots.length; i < cap; i++) rows.push([`#${i + 1}`, 'kosong'])
    return UI.say(ctx, { glyph: G.plant, title: 'Kebun', sub: u.name, quote: [`Petak ${f.plots.length}/${cap} (naik tiap 25 level, maks 8)`, `Total panen: ${fmt(f.harvests)}`], rows,
      hint: `${prefix}tanam <${Object.keys(CROPS).filter(k => CROPS[k].min <= u.level).join('|')}> [jumlah]` })
  },
}
