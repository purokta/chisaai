/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PETUALANGAN: hunt, dungeon, explore, mine, fish, chop, heal, rest — semua hasil tampil sebagai kartu canvas
const { R, need, itemName } = require('../../lib/rpgctx')
const UI = require('../../lib/rpgui'), { G, fmt } = UI
const D = R.D

function lowHp(u, ctx) {
  const s = R.stats(u)
  if (u.hp < s.maxhp * 0.2) {
    UI.say(ctx, { glyph: G.cobra, title: 'HP Kritis', quote: [`HP kamu tinggal *${fmt(u.hp)}/${fmt(s.maxhp)}*`], hint: `Pulihkan dulu: ${ctx.prefix}heal • ${ctx.prefix}rest • ${ctx.prefix}use hp_potion` }); return true
  }
  return false
}
const wait = (ctx, left, what) => UI.say(ctx, { glyph: G.sun, title: 'Cooldown', quote: [`Tunggu *${R.dur(left)}* lagi ${what}.`] })
function reward(u, mob, mult = 1) {
  const ex = R.addExp(u, Math.floor(mob.exp * mult)), g = R.addGold(u, Math.floor(mob.gold * mult))
  return { ex, g }
}
// hasil drop: kembalikan { id, q } atau null
function dropRoll(u, mob, chance, qtyMax = 2) {
  if (Math.random() * 100 > chance) return null
  const q = R.rnd(1, qtyMax); R.give(u, mob.drop, q); return { id: mob.drop, q }
}
const plainItem = (id) => R.D.ITEMS[id] ? R.D.ITEMS[id].n : id
const hook = (u, mob, m) => R.killHooks(u, mob, require('../../lib/npcdb').lv(m.sender, 'noa'))
// hasil killHooks (teks) -> baris kutipan bersih
const hookLines = (t) => String(t || '').split('\n').map(x => x.trim()).filter(Boolean)
const logTxt = (log) => log.map(l => l.replace(/^➤\s*/, ''))
const GOLD = '#fbbf24', GREEN = '#34d399', RED = '#f87171', BLUE = '#38bdf8'

module.exports = {
  name: 'hunt',
  alias: ['berburu', 'dungeon', 'dg', 'explore', 'jelajah', 'mine', 'nambang', 'fish', 'mancing', 'chop', 'tebang', 'heal', 'rest', 'istirahat'],
  category: 'rpg',
  cmds: ['hunt', 'dungeon', 'explore', 'mine', 'fish', 'chop', 'heal', 'rest'],
  desc: 'Berburu, dungeon, explore, mining, memancing, menebang, penyembuhan',
  run: async (ctx) => {
    const { m, command, prefix } = ctx
    const u = need(ctx); if (!u) return
    const s = R.stats(u)

    // ── HUNT ──
    if (['hunt', 'berburu'].includes(command)) {
      if (lowHp(u, ctx)) return
      const left = R.cooldown(u, 'hunt', 35); if (left) return wait(ctx, left, 'sebelum berburu')
      const zone = R.zoneFor(u), mob = R.scaleMob(R.pick(zone.mobs), u, zone)
      const r = R.fight(u, mob); const lost = R.applyResult(u, r)
      const base = { glyph: G.lion, title: 'Hunt', sub: zone.name, cardSub: `${mob.n} (HP ${fmt(mob.hp)}) di ${zone.name}`, log: logTxt(r.log) }
      if (r.win) {
        u.kills++; R.track(u, 'kill'); const { ex, g } = reward(u, mob), dr = dropRoll(u, mob, 55)
        const extra = hookLines(hook(u, mob, m))
        return UI.send(ctx, u, { ...base, tone: 'win', headline: 'Victory', ex,
          quote: [`Bertemu *${mob.n}* (HP ${fmt(mob.hp)})`, ...logTxt(r.log), `${G.lion} *MENANG!*`],
          rows: [['EXP', `+${fmt(ex.amt)}`], ['GOLD', `+${fmt(g)}`], dr && ['DROP', `${plainItem(dr.id)} x${dr.q}`]],
          tail: [...extra, UI.vitals(u)],
          chips: [{ l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }, { l: 'Gold', v: `+${fmt(g)}`, c: GOLD }, dr ? { l: 'Drop', v: `${plainItem(dr.id)} x${dr.q}`, c: GREEN } : { l: 'Kill', v: fmt(u.kills), c: BLUE }] })
      }
      return UI.send(ctx, u, { ...base, tone: 'lose', headline: 'Kalah',
        quote: [`Bertemu *${mob.n}* (HP ${fmt(mob.hp)})`, ...logTxt(r.log), `${G.cobra} *KALAH...* ${mob.n} terlalu kuat.`, `Gold hilang: *${fmt(lost)}*`, UI.vitals(u)],
        hint: 'Perkuat gear & naikkan level dulu.', chips: [{ l: 'Gold hilang', v: `-${fmt(lost)}`, c: RED }, { l: 'Musuh', v: mob.n, c: BLUE }] })
    }

    // ── DUNGEON ──
    if (['dungeon', 'dg'].includes(command)) {
      if (lowHp(u, ctx)) return
      const fl = u.floor, zi = Math.min(D.ZONES.length - 1, Math.floor((fl - 1) / 5)), zone = D.ZONES[zi]
      if (u.level < zone.min) return UI.say(ctx, { glyph: G.town, title: 'Dungeon Terkunci', quote: [`Lantai ${fl} ada di *${zone.name}*`, `Butuh *Lv.${zone.min}* — kamu Lv.${u.level}`] })
      const left = R.cooldown(u, 'dungeon', 50); if (left) return wait(ctx, left, 'untuk masuk dungeon')
      const boss = fl % 5 === 0, endless = Math.max(0, fl - 35) * 0.12
      const base = boss ? zone.boss : R.pick(zone.mobs)
      let mob = R.scaleMob(base, u, zone); if (endless) mob = { ...mob, hp: Math.floor(mob.hp * (1 + endless)), atk: Math.floor(mob.atk * (1 + endless)), exp: Math.floor(mob.exp * (1 + endless)), gold: Math.floor(mob.gold * (1 + endless)) }
      const r = R.fight(u, mob); const lost = R.applyResult(u, r)
      const b = { glyph: G.town, title: 'Dungeon', sub: `Lantai ${fl}${boss ? ' • BOSS' : ''}`, cardSub: `${zone.name} — ${mob.n} (HP ${fmt(mob.hp)})`, log: logTxt(r.log) }
      if (r.win) {
        u.floor++; u.bestFloor = Math.max(u.bestFloor, fl); u.kills++; R.track(u, 'kill'); R.track(u, 'floor')
        const { ex, g } = reward(u, mob, boss ? 1.5 : 1), dr = dropRoll(u, mob, boss ? 100 : 45, boss ? 3 : 2)
        let tk = false; if (boss && Math.random() < 0.35) { R.give(u, 'summon_ticket'); tk = true }
        const extra = hookLines(hook(u, mob, m))
        return UI.send(ctx, u, { ...b, tone: 'win', headline: `Lantai ${fl} Clear`, ex,
          quote: [`${zone.name} — *${mob.n}* (HP ${fmt(mob.hp)})`, ...logTxt(r.log), `${G.lion} *LANTAI ${fl} CLEAR!*`],
          rows: [['EXP', `+${fmt(ex.amt)}`], ['GOLD', `+${fmt(g)}`], dr && ['DROP', `${plainItem(dr.id)} x${dr.q}`], tk && ['BONUS', 'Summon Ticket x1']],
          tail: [...extra, `${G.falcon} Lanjut ke *lantai ${u.floor}*`, UI.vitals(u)],
          chips: [{ l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }, { l: 'Gold', v: `+${fmt(g)}`, c: GOLD }, dr ? { l: 'Drop', v: `${plainItem(dr.id)} x${dr.q}`, c: GREEN } : { l: 'Lantai', v: `${u.floor} berikutnya`, c: BLUE }] })
      }
      return UI.send(ctx, u, { ...b, tone: 'lose', headline: `Gagal lantai ${fl}`,
        quote: [`${zone.name} — *${mob.n}* (HP ${fmt(mob.hp)})`, ...logTxt(r.log), `${G.cobra} *GAGAL di lantai ${fl}.*`, `Gold hilang: *${fmt(lost)}*`, UI.vitals(u)],
        hint: 'Pulihkan diri lalu coba lagi.', chips: [{ l: 'Gold hilang', v: `-${fmt(lost)}`, c: RED }, { l: 'Lantai', v: String(fl), c: BLUE }] })
    }

    // ── EXPLORE ──
    if (['explore', 'jelajah'].includes(command)) {
      const left = R.cooldown(u, 'explore', 60); if (left) return wait(ctx, left, '')
      const ev = R.pick(D.EVENTS), gold = R.rnd(60, 220) + u.level * 8
      const rows = [], chips = []; let ex = null, tone = 'gain', headline = 'Penjelajahan'
      if (ev.t === 'treasure') { const g = R.addGold(u, gold * 2); rows.push(['GOLD', `+${fmt(g)}`]); chips.push({ l: 'Gold', v: `+${fmt(g)}`, c: GOLD }); headline = 'Harta Karun'; if (Math.random() < 0.25) { R.give(u, 'summon_ticket'); rows.push(['BONUS', 'Summon Ticket x1']); chips.push({ l: 'Bonus', v: 'Summon Ticket', c: GREEN }) } }
      else if (ev.t === 'spring') { u.hp = s.maxhp; u.mp = s.maxmp; rows.push(['PULIH', 'HP & MP penuh']); chips.push({ l: 'Pulih', v: 'HP & MP penuh', c: GREEN }); tone = 'info'; headline = 'Mata Air Suci' }
      else if (ev.t === 'trap') { const d = Math.floor(s.maxhp * R.rnd(8, 18) / 100); u.hp = Math.max(1, u.hp - d); rows.push(['HP', `-${fmt(d)}`]); chips.push({ l: 'HP', v: `-${fmt(d)}`, c: RED }); tone = 'lose'; headline = 'Terkena Jebakan' }
      else if (ev.t === 'merchant') { R.give(u, 'hp_potion', 2); R.give(u, 'mp_potion', 1); rows.push(['ITEM', 'HP Potion x2, MP Potion x1']); chips.push({ l: 'Item', v: 'Potion x3', c: GREEN }); headline = 'Pedagang Misterius' }
      else if (ev.t === 'herb') { const q = R.rnd(2, 5); R.give(u, 'herb', q); rows.push(['ITEM', `Herba x${q}`]); chips.push({ l: 'Item', v: `Herba x${q}`, c: GREEN }); headline = 'Menemukan Herba' }
      else { const g = R.addGold(u, gold); ex = R.addExp(u, 20 + u.level * 4); rows.push(['EXP', `+${fmt(ex.amt)}`], ['GOLD', `+${fmt(g)}`]); chips.push({ l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }, { l: 'Gold', v: `+${fmt(g)}`, c: GOLD }); headline = 'Penemuan' }
      R.save()
      return UI.send(ctx, u, { glyph: G.falcon, title: 'Explore', cardSub: ev.msg.replace(/[^\x20-\x7EÀ-ɏ]/g, '').trim(), tone, headline, ex, quote: [ev.msg], rows, chips, log: [ev.msg.replace(/[^\x20-\x7EÀ-ɏ]/g, '').trim()] })
    }

    // ── GATHERING ──
    if (['mine', 'nambang'].includes(command)) {
      const left = R.cooldown(u, 'mine', 45); if (left) return wait(ctx, left, '')
      const got = {}; const add = (id, n) => { got[id] = (got[id] || 0) + n; R.give(u, id, n) }
      add('iron_ore', R.rnd(1, 4)); if (u.level >= 8 && Math.random() < 0.3) add('crystal', R.rnd(1, 2))
      if (u.level >= 18 && Math.random() < 0.15) add('gold_ore', R.rnd(1, 3)); if (u.level >= 50 && Math.random() < 0.04) add('mythril', 1)
      const ex = R.addExp(u, 6 + u.level), tg0 = R.rnd(0, 1) ? 0 : R.rnd(5, 20) * (1 + Math.floor(u.level / 10)), tg = tg0 ? R.addGold(u, tg0) : 0; R.track(u, 'mine')
      R.save()
      const items = Object.entries(got).map(([k, v]) => `${plainItem(k)} x${v}`)
      return UI.send(ctx, u, { glyph: G.offer, title: 'Menambang', tone: 'gain', headline: 'Hasil Tambang', ex, cardSub: 'Kamu menggali di dalam tambang', log: items,
        quote: items.map(x => `${G.offer} ${x}`), rows: [['EXP', `+${fmt(ex.amt)}`], tg && ['GOLD', `+${fmt(tg)}`]],
        chips: [{ l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }, tg ? { l: 'Gold', v: `+${fmt(tg)}`, c: GOLD } : { l: 'Bahan', v: `${items.length} jenis`, c: GREEN }] })
    }
    if (['fish', 'mancing'].includes(command)) {
      const left = R.cooldown(u, 'fish', 45); if (left) return wait(ctx, left, '')
      const roll = Math.random(); let line, headline = 'Hasil Pancingan', chip
      if (roll < 0.08) { const g = R.rnd(40, 120) + u.level * 3, got = R.addGold(u, g); line = `Sepatu bekas... di dalamnya ada ${fmt(got)} gold!`; headline = 'Sepatu Berisi Emas'; chip = { l: 'Gold', v: `+${fmt(got)}`, c: GOLD } }
      else if (roll < 0.2) { R.give(u, 'rare_fish'); line = 'WOW! Ikan Langka x1'; headline = 'Ikan Langka!'; chip = { l: 'Tangkapan', v: 'Ikan Langka x1', c: GREEN } }
      else { const q = R.rnd(1, 3); R.give(u, 'fish', q); line = `Ikan x${q}`; chip = { l: 'Tangkapan', v: `Ikan x${q}`, c: GREEN } }
      const ex = R.addExp(u, 5 + u.level); R.track(u, 'fish'); R.save()
      return UI.send(ctx, u, { glyph: G.water, title: 'Memancing', tone: 'info', headline, ex, cardSub: 'Kamu duduk tenang di tepi danau', log: [line],
        quote: [`${G.water} ${line}`], rows: [['EXP', `+${fmt(ex.amt)}`]], chips: [chip, { l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }] })
    }
    if (['chop', 'tebang'].includes(command)) {
      const left = R.cooldown(u, 'chop', 40); if (left) return wait(ctx, left, '')
      const q = R.rnd(2, 6); R.give(u, 'wood', q); const lines = [`Kayu x${q}`]
      if (Math.random() < 0.3) { const h = R.rnd(1, 3); R.give(u, 'herb', h); lines.push(`Herba x${h}`) }
      const ex = R.addExp(u, 5 + u.level); R.save()
      return UI.send(ctx, u, { glyph: G.plant, title: 'Menebang Pohon', tone: 'gain', headline: 'Hasil Tebangan', ex, cardSub: 'Kapakmu menebas batang pohon tua', log: lines,
        quote: lines.map(x => `${G.plant} ${x}`), rows: [['EXP', `+${fmt(ex.amt)}`]], chips: [{ l: 'Bahan', v: lines.join(' • '), c: GREEN }, { l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }] })
    }

    // ── PEMULIHAN ──
    if (['heal'].includes(command)) {
      const cost = u.level * 15
      if (u.hp >= s.maxhp && u.mp >= s.maxmp) return UI.say(ctx, { glyph: G.ankh, title: 'Penginapan Guild', quote: ['Kamu sudah segar bugar.'] })
      if (u.gold < cost) return UI.say(ctx, { glyph: G.town, title: 'Penginapan Guild', quote: [`Biaya pulih penuh: *${fmt(cost)}* gold`, 'Gold kamu kurang.'], hint: `Gratis: ${prefix}rest (30% tiap 5 menit)` })
      u.gold -= cost; u.hp = s.maxhp; u.mp = s.maxmp; R.save()
      return UI.send(ctx, u, { glyph: G.town, title: 'Penginapan Guild', tone: 'info', headline: 'Pulih Penuh', cardSub: `Biaya menginap ${fmt(cost)} gold`, quote: [`Menginap di Guild (-${fmt(cost)} gold)`, UI.vitals(u)], chips: [{ l: 'Biaya', v: `-${fmt(cost)}`, c: RED }, { l: 'HP & MP', v: 'Penuh', c: GREEN }] })
    }
    if (['rest', 'istirahat'].includes(command)) {
      const left = R.cooldown(u, 'rest', 300); if (left) return wait(ctx, left, 'untuk istirahat lagi')
      u.hp = Math.min(s.maxhp, u.hp + Math.floor(s.maxhp * 0.3)); u.mp = Math.min(s.maxmp, u.mp + Math.floor(s.maxmp * 0.3)); R.save()
      return UI.send(ctx, u, { glyph: G.sun, title: 'Api Unggun', tone: 'info', headline: 'Istirahat', cardSub: 'Memulihkan 30% HP & MP', quote: ['Istirahat di api unggun...', UI.vitals(u)], chips: [{ l: 'HP', v: `${fmt(u.hp)}/${fmt(s.maxhp)}`, c: GREEN }, { l: 'MP', v: `${fmt(u.mp)}/${fmt(s.maxmp)}`, c: BLUE }] })
    }
  },
}
