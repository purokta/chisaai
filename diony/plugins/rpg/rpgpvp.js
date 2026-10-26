/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PVP & BOSS: duel, arena, worldboss, attackboss
const { R, need, target } = require('../../lib/rpgctx')
const D = R.D
const UI = require('../../lib/rpgui'), { G, fmt } = UI
const GOLD = '#fbbf24', GREEN = '#34d399', RED = '#f87171', BLUE = '#38bdf8'

// simulasi duel (HP penuh, tidak merusak HP asli)
function duelSim(a, b) {
  const sa = R.stats(a), sb = R.stats(b)
  const P = [{ u: a, s: sa, hp: sa.maxhp, mp: sa.maxmp }, { u: b, s: sb, hp: sb.maxhp, mp: sb.maxmp }]
  let first = sa.agi >= sb.agi ? 0 : 1, round = 0
  while (P[0].hp > 0 && P[1].hp > 0 && round < 60) {
    round++
    for (const i of [first, 1 - first]) {
      const at = P[i], df = P[1 - i]; if (at.hp <= 0 || df.hp <= 0) break
      if (Math.random() * 100 < Math.min(30, df.s.agi * 0.25)) continue
      let d = Math.max(1, Math.round(at.s.atk * (0.85 + Math.random() * 0.3) - df.s.defv * 0.5))
      if (Math.random() * 100 < at.s.crit) d = Math.round(d * 1.8)
      if (round % 3 === 0 && at.mp >= 10) { at.mp -= 10; d = Math.round(d * D.CLASSES[at.u.cls].mult) }
      df.hp -= d
    }
  }
  return { winner: P[0].hp > P[1].hp ? 0 : 1, rounds: round, left: [Math.max(0, P[0].hp), Math.max(0, P[1].hp)], max: [sa.maxhp, sb.maxhp] }
}

module.exports = {
  name: 'duel',
  alias: ['pvp', 'arena', 'worldboss', 'boss', 'attackboss', 'serangboss'],
  category: 'rpg',
  cmds: ['duel','arena','worldboss','attackboss'],
  desc: 'Duel PvP taruhan gold, arena rival, world boss global',
  run: async (ctx) => {
    const { command, args, prefix, reply, m, sock } = ctx
    const u = need(ctx); if (!u) return
    const s = R.stats(u)

    if (['duel', 'pvp'].includes(command)) {
      const t = target(ctx), bet = parseInt([...args].reverse().find(a => /^\d{1,9}$/.test(a) && a.length < 10)) || 0
      if (!t || t === m.sender) return reply(`⚔️ Contoh: ${prefix}duel @user 500\n(tag lawan, taruhan opsional)`)
      const o = R.get(t); if (!o) return reply('Lawan belum punya karakter RPG.')
      const wager = t.includes(String(bet)) ? 0 : bet
      if (wager > Math.min(u.gold, o.gold)) return reply(`Taruhan terlalu besar. Gold kamu ${R.fmt(u.gold)}, lawan ${R.fmt(o.gold)}.`)
      const left = R.cooldown(u, 'duel', 90); if (left) return UI.say(ctx, { glyph: G.sun, title: 'Cooldown', quote: [`Tunggu *${R.dur(left)}* lagi untuk duel.`] })
      const r = duelSim(u, o), win = r.winner === 0 ? u : o, lose = r.winner === 0 ? o : u, iWin = win === u
      win.wins++; lose.losses++; if (wager) { win.gold += wager; lose.gold -= wager }
      const ex = R.addExp(win, 40 + win.level * 6); R.track(win, 'duel')
      R.save()
      const so = R.stats(o)
      return UI.send(ctx, u, { glyph: G.lion, title: 'Duel PvP', sub: `vs ${o.name}`, cardSub: `${u.name} Lv.${u.level} vs ${o.name} Lv.${o.level}`, tone: iWin ? 'win' : 'lose', headline: iWin ? 'Kamu Menang' : 'Kamu Kalah', ex: iWin ? ex : null,
        quote: [`*${u.name}* Lv.${u.level}  VS  *${o.name}* Lv.${o.level}`, `Power ${fmt(s.power)} vs ${fmt(so.power)}`, `${r.rounds} ronde — sisa HP ${fmt(r.left[0])} vs ${fmt(r.left[1])}`, `${G.lion} Pemenang: *${win.name}*`,
          !iWin && ex.up && `${G.ankh} ${win.name} naik ke *Lv.${ex.lvl}* (Rank ${ex.rank.tier})`],
        rows: [['PEMENANG', win.name], wager && ['TARUHAN', `${fmt(wager)} gold`], ['EXP', `+${fmt(ex.amt)} (${win.name})`]],
        chips: [{ l: 'Pemenang', v: win.name, c: iWin ? GREEN : RED }, { l: 'Ronde', v: String(r.rounds), c: BLUE }, wager ? { l: 'Taruhan', v: `${iWin ? '+' : '-'}${fmt(wager)}`, c: iWin ? GOLD : RED } : { l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }],
        log: [`Power ${fmt(s.power)} vs ${fmt(so.power)}`, `Sisa HP ${fmt(r.left[0])} vs ${fmt(r.left[1])}`], mentions: [t] })
    }

    if (command === 'arena') {
      if (u.hp < s.maxhp * 0.2) return reply(`🩸 HP terlalu rendah. Pulihkan dulu (${prefix}heal / ${prefix}rest).`)
      const left = R.cooldown(u, 'arena', 90); if (left) return UI.say(ctx, { glyph: G.sun, title: 'Cooldown', quote: [`Tunggu *${R.dur(left)}* lagi.`] })
      const f = 0.8 + Math.random() * 0.4, names = ['Ronin Akira', 'Kunoichi Sakura', 'Ace Hunter Rei', 'Blade Dancer Yui', 'Dark Mage Kaito', 'Shrine Maiden Hinata']
      const rival = { n: R.pick(names), e: '🥷', hp: Math.floor(s.maxhp * f), atk: Math.floor(s.atk * f * 0.9), def: Math.floor(s.defv * f * 0.6), exp: 60 + u.level * 8, gold: 80 + u.level * 25 }
      const r = R.fight(u, rival); const lost = R.applyResult(u, r), lg = r.log.map(l => l.replace(/^➤\s*/, ''))
      const b = { glyph: G.lion, title: 'Arena Guild', sub: rival.n, cardSub: `Lawan: ${rival.n} (HP ${fmt(rival.hp)})`, log: lg }
      if (r.win) {
        u.wins++; R.track(u, 'duel'); const ex = R.addExp(u, rival.exp), g = R.addGold(u, rival.gold); R.save()
        return UI.send(ctx, u, { ...b, tone: 'win', headline: 'Victory', ex, quote: [`Lawan: *${rival.n}* (HP ${fmt(rival.hp)})`, ...lg, `${G.lion} *MENANG!*`, UI.vitals(u)], rows: [['EXP', `+${fmt(ex.amt)}`], ['GOLD', `+${fmt(g)}`]],
          chips: [{ l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }, { l: 'Gold', v: `+${fmt(g)}`, c: GOLD }, { l: 'Menang', v: `${u.wins}x`, c: GREEN }] })
      }
      u.losses++; R.save()
      return UI.send(ctx, u, { ...b, tone: 'lose', headline: 'Kalah', quote: [`Lawan: *${rival.n}* (HP ${fmt(rival.hp)})`, ...lg, `${G.cobra} *KALAH.* -${fmt(lost)} gold`, UI.vitals(u)], hint: 'Latihan lagi!', chips: [{ l: 'Gold hilang', v: `-${fmt(lost)}`, c: RED }, { l: 'Lawan', v: rival.n, c: BLUE }] })
    }

    // ── WORLD BOSS ──
    let b = R.db.boss
    if (!b || (b.dead && Date.now() - b.diedAt > 3600000)) b = R.spawnBoss()
    const medal = ['𝐈', '𝐈𝐈', '𝐈𝐈𝐈', '𝐈𝐕', '𝐕']
    const boardOf = (bo) => Object.entries(bo.dmg).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([j, d], i) => `${medal[i]} ${R.get(j)?.name || j.split('@')[0]} — ${fmt(d)}`)

    if (['worldboss', 'boss'].includes(command)) {
      if (b.dead) return UI.say(ctx, { glyph: G.cobra, title: 'World Boss', quote: [`*${b.n}* sudah dikalahkan!`, `Boss baru muncul dalam *${R.dur(Math.max(1, Math.ceil((b.diedAt + 3600000 - Date.now()) / 1000)))}*`] })
      const bd = boardOf(b)
      return UI.say(ctx, { glyph: G.cobra, title: 'World Boss', sub: b.n,
        quote: [`${G.ankh} HP ${R.bar(b.hp, b.maxhp, 14)} *${(b.hp / b.maxhp * 100).toFixed(1)}%*`, `${fmt(b.hp)} / ${fmt(b.maxhp)}`, `${G.lion} ATK ${b.atk}  •  DEF ${b.def}`],
        rows: bd.length ? null : null, tail: ['*Top Damage*', ...(bd.length ? bd : ['belum ada yang menyerang'])],
        hint: `Serang: ${prefix}attackboss (cooldown 2 menit) • hadiah dibagi sesuai damage` })
    }
    if (['attackboss', 'serangboss'].includes(command)) {
      if (b.dead) return UI.say(ctx, { glyph: G.cobra, title: 'World Boss', quote: ['Boss sudah mati. Tunggu boss baru.'], hint: `${prefix}worldboss` })
      if (u.hp < s.maxhp * 0.2) return UI.say(ctx, { glyph: G.cobra, title: 'HP Kritis', quote: ['HP terlalu rendah untuk melawan boss.'] })
      const left = R.cooldown(u, 'boss', 120); if (left) return UI.say(ctx, { glyph: G.sun, title: 'Cooldown', quote: [`Tunggu *${R.dur(left)}* lagi.`] })
      const r = R.fight(u, { n: b.n, e: b.e, hp: b.hp, atk: b.atk, def: b.def }); const dmg = Math.min(b.hp, r.dealt), lg = r.log.map(l => l.replace(/^➤\s*/, ''))
      b.hp -= dmg; b.dmg[m.sender] = (b.dmg[m.sender] || 0) + dmg; u.bossDmg += dmg
      u.hp = Math.max(1, r.hp || Math.floor(s.maxhp * 0.1)); u.mp = r.mp
      const pct = Math.max(0, b.hp / b.maxhp * 100).toFixed(1), tail = []; let myEx = null, myG = 0
      if (b.hp <= 0) {
        b.dead = true; b.diedAt = Date.now(); b.hp = 0
        const total = Object.values(b.dmg).reduce((a, c) => a + c, 0), rank = Object.entries(b.dmg).sort((x, y) => y[1] - x[1])
        tail.push(`${G.cobra} *${b.n} TUMBANG!* Hadiah dibagikan:`)
        rank.forEach(([j, d], i) => {
          const o = R.get(j); if (!o) return; const sh = d / total
          const g = R.addGold(o, Math.floor(500 + 40000 * sh)), ex = R.addExp(o, Math.floor(800 + 80000 * sh))
          if (j === m.sender) { myEx = ex; myG = g }
          if (i < 3) R.give(o, 'summon_ticket', 3 - i); if (i === 0) R.give(o, 'mythril', 2)
          if (i < 5) tail.push(`${medal[i]} *${o.name}* ${fmt(d)} dmg ➜ +${fmt(g)}g, +${fmt(ex.amt)} EXP${i < 3 ? `, +${3 - i} tiket` : ''}`)
        })
        tail.push(`Semua peserta (${rank.length}) mendapat hadiah.`)
      }
      R.save()
      return UI.send(ctx, u, { glyph: G.cobra, title: 'World Boss', sub: b.n, cardSub: `${b.n} — sisa HP ${pct}%`, tone: b.dead ? 'win' : 'info', headline: b.dead ? 'Boss Tumbang' : 'Serangan Boss', ex: myEx, log: lg,
        quote: [...lg, `${G.lion} Total damage: *${fmt(dmg)}*`, `${G.ankh} Boss ${R.bar(b.hp, b.maxhp, 12)} *${pct}%*`, UI.vitals(u)], tail,
        chips: [{ l: 'Damage', v: fmt(dmg), c: RED }, { l: 'HP Boss', v: `${pct}%`, c: BLUE }, b.dead && myG ? { l: 'Hadiah', v: `+${fmt(myG)} gold`, c: GOLD } : { l: 'Total damage', v: fmt(b.dmg[m.sender] || 0), c: GOLD }] })
    }
  },
}
