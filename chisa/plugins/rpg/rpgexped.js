/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// EKSPEDISI: kirim karaktermu menjelajah dalam waktu nyata (idle). Pulang → klaim gold, EXP, dan bahan.
//   .expedisi <pendek|sedang|panjang>  mulai (1 / 3 / 6 jam)   •   .expedisi  cek status   •   .klaimexp  ambil hasil
// Makin lama makin besar hadiahnya, tapi risikonya (pulang terluka, hadiah dipotong) juga naik. Minimal Lv.5.
const { R, need, itemName } = require('../../lib/rpgctx'), D = R.D
const UI = require('../../lib/rpgui'), { G, fmt } = UI
const HOUR = 3600000
const TYPES = {
  pendek:  { h: 1, risk: 0.05, name: 'Ekspedisi Pendek (1 jam)' },
  sedang:  { h: 3, risk: 0.12, name: 'Ekspedisi Sedang (3 jam)' },
  panjang: { h: 6, risk: 0.20, name: 'Ekspedisi Panjang (6 jam)' },
}
const dur = (ms) => R.dur(Math.max(0, Math.ceil(ms / 1000)))

module.exports = {
  name: 'expedisi', alias: ['ekspedisi', 'exped', 'klaimexp', 'ambilexp', 'misiluar'], category: 'rpg', cmds: ['expedisi', 'klaimexp'],
  desc: 'Ekspedisi idle 1/3/6 jam, klaim gold + EXP + bahan (.expedisi, .klaimexp)',
  run: async (ctx) => {
    const { command, args, prefix, reply } = ctx
    const u = need(ctx); if (!u) return
    const now = Date.now(), ex = u.exped

    if (['klaimexp', 'ambilexp'].includes(command)) {
      if (!ex) return UI.say(ctx, { glyph: G.falcon, title: 'Ekspedisi', quote: ['Kamu tidak sedang berekspedisi.'], hint: `Mulai: ${prefix}expedisi pendek|sedang|panjang` })
      if (now < ex.until) return UI.say(ctx, { glyph: G.falcon, title: 'Ekspedisi', quote: [`Belum kembali. Sisa waktu: *${dur(ex.until - now)}*`] })
      const T = TYPES[ex.type], zone = R.zoneFor(u), s = R.stats(u), hurt = Math.random() < T.risk, mult = hurt ? 0.5 : 1
      const g = R.addGold(u, Math.floor((200 + u.level * 30) * T.h * R.rnd(80, 130) / 100 * mult))
      const x = R.addExp(u, Math.floor((60 + u.level * 8) * T.h * mult))
      const drops = {}; const rolls = Math.max(1, Math.round(T.h * (hurt ? 1 : 2)))
      for (let i = 0; i < rolls; i++) { const mob = R.pick(zone.mobs), q = R.rnd(1, 2); drops[mob.drop] = (drops[mob.drop] || 0) + q }
      const items = Object.entries(drops).map(([id, q]) => { R.give(u, id, q); return `${D.ITEMS[id] ? D.ITEMS[id].n : id} x${q}` })
      const tk = !hurt && ex.type === 'panjang' && Math.random() < 0.35; if (tk) R.give(u, 'summon_ticket')
      u.cnt = u.cnt || {}; u.cnt.exped = (u.cnt.exped || 0) + 1
      u.exped = null; R.save()
      return UI.send(ctx, u, { glyph: G.falcon, title: 'Ekspedisi Selesai', sub: T.name, cardSub: `${zone.name} — ${T.name}`, tone: hurt ? 'lose' : 'win', headline: hurt ? 'Pulang Terluka' : 'Ekspedisi Selesai', ex: x,
        log: items.slice(0, 4), quote: [`${zone.name}`, hurt && `${G.cobra} Kamu diserang di jalan! Hadiah dipotong separuh.`], rows: [['GOLD', `+${fmt(g)}`], ['EXP', `+${fmt(x.amt)}`], ...items.map(i => ['BAHAN', i]), tk && ['BONUS', 'Summon Ticket x1']],
        chips: [{ l: 'Gold', v: `+${fmt(g)}`, c: '#fbbf24' }, { l: 'EXP', v: `+${fmt(x.amt)}`, c: '#fbbf24' }, { l: 'Bahan', v: `${items.length} jenis${tk ? ' + Tiket' : ''}`, c: '#34d399' }] })
    }

    // .expedisi
    const type = String(args[0] || '').toLowerCase()
    if (ex) {
      const T = TYPES[ex.type]
      return UI.say(ctx, { glyph: G.falcon, title: 'Ekspedisi', sub: T.name, quote: [now >= ex.until ? 'Sudah kembali!' : `Sedang berjalan. Sisa waktu: *${dur(ex.until - now)}*`], hint: `Klaim: ${prefix}klaimexp` })
    }
    if (!TYPES[type]) return UI.say(ctx, { glyph: G.falcon, title: 'Ekspedisi', sub: 'idle', quote: ['Kirim karaktermu menjelajah sambil kamu istirahat.'], rows: Object.entries(TYPES).map(([k, v]) => [k, `${v.h} jam • risiko ${Math.round(v.risk * 100)}%`]), hint: `Mulai: ${prefix}expedisi sedang • minimal Lv.5 • ambil hasil: ${prefix}klaimexp` })
    if (u.level < 5) return reply(`🔒 Ekspedisi butuh minimal Lv.5 (kamu Lv.${u.level}).`)
    if (u.hp < R.stats(u).maxhp * 0.3) return reply(`🩸 HP terlalu rendah untuk berangkat. Pulihkan dulu: *${prefix}heal*`)
    u.exped = { type, start: now, until: now + TYPES[type].h * HOUR }; R.save()
    return UI.say(ctx, { glyph: G.falcon, title: 'Ekspedisi Dimulai', sub: TYPES[type].name, quote: [`Kembali dalam *${TYPES[type].h} jam*.`], hint: `Cek: ${prefix}expedisi • Klaim: ${prefix}klaimexp` })
  },
}
