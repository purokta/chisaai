/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PENCAPAIAN: target jangka panjang dengan hadiah gold / EXP / tiket. Dihitung otomatis dari datamu.
//   .achievement [kategori]   daftar & progres   •   .claimach   klaim semua yang sudah tercapai
const { R, need } = require('../../lib/rpgctx')
const UI = require('../../lib/rpgui'), { G, fmt } = UI
const bankBal = (u) => (u.bank && u.bank.bal) || 0
const A = (id, cat, txt, have, need_, g, x, t = 0) => ({ id, cat, txt, have, need: need_, g, x, t })
function list(u) {
  const cnt = u.cnt || {}, comp = Object.keys((u.comp && u.comp.owned) || {}).length, wealth = u.gold + bankBal(u)
  return [
    A('kill10', 'Tempur', 'Kalahkan 10 monster', u.kills, 10, 300, 100), A('kill100', 'Tempur', 'Kalahkan 100 monster', u.kills, 100, 2000, 600),
    A('kill500', 'Tempur', 'Kalahkan 500 monster', u.kills, 500, 8000, 2500, 1), A('kill2000', 'Tempur', 'Kalahkan 2.000 monster', u.kills, 2000, 30000, 9000, 3),
    A('win5', 'Tempur', 'Menangkan 5 duel PvP', u.wins, 5, 800, 300), A('win25', 'Tempur', 'Menangkan 25 duel PvP', u.wins, 25, 5000, 1500, 1), A('win100', 'Tempur', 'Menangkan 100 duel PvP', u.wins, 100, 25000, 8000, 3),
    A('lv10', 'Level', 'Capai Level 10', u.level, 10, 1000, 0), A('lv25', 'Level', 'Capai Level 25', u.level, 25, 5000, 0, 1), A('lv50', 'Level', 'Capai Level 50', u.level, 50, 20000, 0, 2), A('lv100', 'Level', 'Capai Level 100', u.level, 100, 80000, 0, 5),
    A('fl10', 'Dungeon', 'Tembus lantai 10', u.bestFloor, 10, 1500, 500), A('fl25', 'Dungeon', 'Tembus lantai 25', u.bestFloor, 25, 8000, 2500, 1), A('fl50', 'Dungeon', 'Tembus lantai 50', u.bestFloor, 50, 40000, 12000, 3),
    A('gold10k', 'Harta', 'Miliki total 10.000 gold (tas + bank)', wealth, 1e4, 500, 0), A('gold100k', 'Harta', 'Miliki total 100.000 gold', wealth, 1e5, 3000, 0, 1), A('gold1m', 'Harta', 'Miliki total 1.000.000 gold', wealth, 1e6, 20000, 0, 3),
    A('comp5', 'Koleksi', 'Kumpulkan 5 companion berbeda', comp, 5, 1500, 400, 1), A('comp15', 'Koleksi', 'Kumpulkan 15 companion berbeda', comp, 15, 12000, 3000, 3),
    A('streak7', 'Rutinitas', 'Streak daily 7 hari', u.streak || 0, 7, 1000, 300, 1), A('streak30', 'Rutinitas', 'Streak daily 30 hari', u.streak || 0, 30, 15000, 4000, 4),
    A('cook10', 'Rutinitas', 'Memasak 10 kali', cnt.cook || 0, 10, 1200, 400), A('exped10', 'Rutinitas', 'Selesaikan 10 ekspedisi', cnt.exped || 0, 10, 4000, 1500, 1),
    A('clan', 'Sosial', 'Bergabung ke sebuah clan', u.clan ? 1 : 0, 1, 700, 200),
  ]
}
const fm = (n) => n >= 1e6 ? (n / 1e6) + 'jt' : n >= 1e4 ? (n / 1e3) + 'rb' : R.fmt(n)

module.exports = {
  name: 'achievement', alias: ['ach', 'pencapaian', 'prestasi', 'claimach', 'klaimach'], category: 'rpg', cmds: ['achievement', 'claimach'],
  desc: 'Pencapaian dengan hadiah gold/EXP/tiket (.achievement, .claimach)',
  run: async (ctx) => {
    const { command, args, prefix, reply } = ctx
    const u = need(ctx); if (!u) return
    u.ach = u.ach || {}; const all = list(u)

    if (['claimach', 'klaimach'].includes(command)) {
      const ready = all.filter(a => !u.ach[a.id] && a.have >= a.need)
      if (!ready.length) return reply(`Belum ada pencapaian yang siap diklaim. Cek *${prefix}achievement*`)
      let g = 0, x = 0, tk = 0
      for (const a of ready) { u.ach[a.id] = Date.now(); g += a.g; x += a.x; tk += a.t }
      const gg = R.addGold(u, g); const ex = x ? R.addExp(u, x) : { amt: 0, up: 0 }; if (tk) R.give(u, 'summon_ticket', tk); R.save()
      return UI.send(ctx, u, { glyph: G.star, title: 'Pencapaian', sub: `${ready.length} diklaim`, tone: 'win', headline: 'Pencapaian', ex, cardSub: `${ready.length} pencapaian diklaim`, log: ready.map(a => a.txt),
        quote: ready.map(a => `${G.star} ${a.txt}`), rows: [['GOLD', `+${fmt(gg)}`], ex.amt && ['EXP', `+${fmt(ex.amt)}`], tk && ['TIKET', `Summon Ticket x${tk}`]],
        chips: [{ l: 'Gold', v: `+${fmt(gg)}`, c: '#fbbf24' }, ex.amt ? { l: 'EXP', v: `+${fmt(ex.amt)}`, c: '#fbbf24' } : { l: 'Diklaim', v: `${ready.length}`, c: '#34d399' }, tk ? { l: 'Tiket', v: `+${tk}`, c: '#34d399' } : { l: 'Total', v: `${all.filter(a => u.ach[a.id]).length}/${all.length}`, c: '#38bdf8' }] })
    }
    const cats = [...new Set(all.map(a => a.cat))], want = (args[0] || '').toLowerCase()
    const pick = cats.find(c => c.toLowerCase() === want)
    const done = all.filter(a => u.ach[a.id]).length, ready = all.filter(a => !u.ach[a.id] && a.have >= a.need).length
    if (want && !pick) return reply(`Kategori: ${cats.join(', ').toLowerCase()}\nContoh: ${prefix}achievement tempur`)
    const show = pick ? all.filter(a => a.cat === pick) : all
    const out = []
    for (const c of (pick ? [pick] : cats)) {
      out.push(`*${c.toUpperCase()}*`)
      for (const a of show.filter(x => x.cat === c)) out.push(`${u.ach[a.id] ? '✅' : a.have >= a.need ? '🟡' : '⬜'} ${a.txt}${u.ach[a.id] ? '' : ` — ${fm(Math.min(a.have, a.need))}/${fm(a.need)}`}`)
      out.push('')
    }
    return UI.say(ctx, { glyph: G.star, title: 'Pencapaian', sub: `${done}/${all.length} selesai${ready ? `, ${ready} siap klaim` : ''}`,
      quote: out.map(l => l.replace(/\*/g, '')).filter(l => l !== '').map(l => /^[A-Z ]+$/.test(l) ? `*${l}*` : l.replace('✅', '✓').replace('🟡', '◆').replace('⬜', '◇')),
      hint: ready ? `Klaim: ${prefix}claimach` : `Filter: ${prefix}achievement <${cats.map(c => c.toLowerCase()).join('|')}>` })
  },
}
