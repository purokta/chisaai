/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// CLAN RAID: leader memanggil boss raksasa (bayar dari kas clan), seluruh anggota menyerang bergantian selama 24 jam.
//   .clanraid (info) • .clanraid start (leader) • .raidhit (serang, jeda 10 menit) • .raidtop (peringkat damage)
const { R, need } = require('../../lib/rpgctx')
const UI = require('../../lib/rpgui'), { G, fmt } = UI
const DUR = 86400000, REST = 6 * 3600000, HIT_CD = 600
const POOL = [
  { n: 'Raja Goblin Berserk', e: '👺' }, { n: 'Naga Es Abadi', e: '🐲' }, { n: 'Golem Reruntuhan Kuno', e: '🗿' },
  { n: 'Hydra Rawa Maut', e: '🐍' }, { n: 'Kraken Samudra Hitam', e: '🦑' }, { n: 'Phoenix Api Neraka', e: '🔥' },
]
const startCost = (c) => 3000 * c.level
const nameOf = (j) => (R.get(j) && R.get(j).name) || j.split('@')[0]
const bar = (c, m) => `${R.bar(c, m, 14)} ${Math.max(0, Math.ceil(c / m * 100))}%`

function finish(c, win) {
  const r = c.raid, entries = Object.entries(r.dmg).sort((a, b) => b[1] - a[1]), total = entries.reduce((t, e) => t + e[1], 0) || 1
  const k = win ? 1 : 0.1, goldPool = Math.floor(r.maxhp / 4 * k), expPool = Math.floor(r.maxhp / 6 * k), lines = []
  for (const [j, d] of entries) {
    const u = R.get(j); if (!u) continue
    const sh = d / total, g = Math.floor(goldPool * sh), ex = R.addExp(u, Math.floor(expPool * sh), { raw: true }); u.gold += g
    lines.push(`${lines.length + 1}. ${nameOf(j)} — ${fmt(d)} dmg (${Math.round(sh * 100)}%) ➜ +${fmt(g)}g +${fmt(ex.amt)}xp${ex.up ? ` ⬆Lv.${ex.lvl}` : ''}`)
  }
  let mvp = null
  if (win && entries.length) { const u = R.get(entries[0][0]); if (u) { R.give(u, 'raid_trophy'); R.give(u, 'summon_ticket'); mvp = u.name } c.treasury += Math.floor(goldPool * 0.3); c.raidWins = (c.raidWins || 0) + 1 }
  c.raidEnd = Date.now(); c.raid = null; R.save()
  return { lines, mvp, goldPool, members: entries.map(e => e[0]) }
}

module.exports = {
  name: 'clanraid', alias: ['raid', 'raidhit', 'serangraid', 'raidtop'], category: 'rpg', cmds: ['clanraid', 'raidhit', 'raidtop'],
  desc: 'Raid boss clan: .clanraid start, .raidhit, .raidtop',
  run: async (ctx) => {
    const { command: cm, args, prefix, reply, m } = ctx
    const u = need(ctx); if (!u) return
    const c = u.clan && R.clans()[u.clan]; if (!c) return reply(`Kamu belum punya clan. ${prefix}clancreate / ${prefix}clanjoin`)
    const now = Date.now()
    if (c.raid && c.raid.end <= now) { const f = finish(c, false); await UI.say(ctx, { glyph: G.cobra, title: 'Raid Gagal', sub: c.name, mentions: f.members, quote: ['Waktu 24 jam habis — boss kabur!', ...f.lines.slice(0, 5)], tail: ['Hadiah hanya 10% untuk yang ikut berjuang.'] }) }
    const r = c.raid

    if (cm === 'clanraid' || cm === 'raid') {
      if ((args[0] || '').toLowerCase() === 'start') {
        if (c.leader !== m.sender) return reply('Hanya *leader clan* yang bisa memanggil raid.')
        if (r) return reply('Raid sedang berlangsung. Gunakan ' + prefix + 'raidhit.')
        const rest = (c.raidEnd || 0) + REST - now; if (rest > 0) return reply(`Clan masih beristirahat. Raid berikutnya dalam *${R.dur(Math.ceil(rest / 1000))}*.`)
        const cost = startCost(c); if (c.treasury < cost) return reply(`Kas clan kurang. Butuh *${fmt(cost)}* (kas ${fmt(c.treasury)}). Donasi: ${prefix}clandonate`)
        const ms = c.members.map(j => R.get(j)).filter(Boolean), avg = Math.round(ms.reduce((t, x) => t + x.level, 0) / Math.max(1, ms.length)), b = R.pick(POOL)
        const maxhp = Math.max(30000, R.clanPower(c) * 40)
        c.treasury -= cost; c.raid = { boss: b.n, e: b.e, hp: maxhp, maxhp, atk: 40 + avg * 6, dmg: {}, end: now + DUR, by: m.sender }; R.save()
        return UI.say(ctx, { glyph: G.lion, title: 'Raid Dimulai', sub: c.name, mentions: c.members, quote: [`${b.e} *${b.n}* muncul di wilayah clan!`, `HP: *${fmt(maxhp)}* • waktu 24 jam`, `Biaya ${fmt(cost)} gold dari kas clan`, `Seluruh anggota: ketik *${prefix}raidhit* (jeda 10 menit)`] })
      }
      if (!r) return UI.say(ctx, { glyph: G.lion, title: 'Clan Raid', sub: c.name, quote: ['Belum ada raid aktif.', `Leader bisa memulai: *${prefix}clanraid start* (biaya ${fmt(startCost(c))} dari kas • kas sekarang ${fmt(c.treasury)})`, `Raid sukses: ${c.raidWins || 0}x`], hint: 'Hadiah: gold/EXP dibagi sesuai damage, MVP dapat Trofi Raid + Summon Ticket, kas clan +30%.' })
      const top = Object.entries(r.dmg).sort((a, b) => b[1] - a[1]).slice(0, 5)
      return UI.say(ctx, { glyph: G.lion, title: 'Clan Raid', sub: c.name, quote: [`${r.e} *${r.boss}*`, bar(r.hp, r.maxhp), `HP ${fmt(r.hp)} / ${fmt(r.maxhp)} • sisa waktu ${R.dur(Math.ceil((r.end - now) / 1000))}`, ...top.map(([j, d], i) => `${i + 1}. ${nameOf(j)} — ${fmt(d)}`)], hint: `${prefix}raidhit untuk menyerang` })
    }
    if (!r) return reply(`Tidak ada raid aktif. Leader mulai dengan ${prefix}clanraid start`)

    if (cm === 'raidtop') {
      const top = Object.entries(r.dmg).sort((a, b) => b[1] - a[1]).slice(0, 10)
      return UI.say(ctx, { glyph: G.lion, title: 'Damage Raid', sub: r.boss, quote: top.length ? top.map(([j, d], i) => `${i + 1}. ${nameOf(j)} — ${fmt(d)}`) : ['Belum ada yang menyerang.'] })
    }

    // raidhit / serangraid
    const s = R.stats(u)
    if (u.hp < s.maxhp * 0.2) return reply(`HP terlalu rendah (${fmt(u.hp)}/${fmt(s.maxhp)}). ${prefix}heal dulu.`)
    const left = R.cooldown(u, 'raidhit', HIT_CD); if (left) return UI.say(ctx, { glyph: G.sun, title: 'Cooldown', quote: [`Tunggu *${R.dur(left)}* lagi untuk menyerang.`] })
    const crit = Math.random() * 100 < s.crit, dmg = Math.floor(s.atk * R.rnd(7, 11) * (crit ? 1.8 : 1)), counter = Math.max(1, Math.round(r.atk * 1.2 - s.defv * 0.5))
    u.hp = Math.max(1, u.hp - counter); r.hp = Math.max(0, r.hp - dmg); r.dmg[m.sender] = (r.dmg[m.sender] || 0) + dmg
    const head = [`${r.e} Kamu menyerang *${r.boss}*${crit ? ' 💥CRIT' : ''} — *${fmt(dmg)}* dmg`, `Serangan balik: -${fmt(counter)} HP (sisa ${fmt(u.hp)})`]
    if (r.hp <= 0) {
      const f = finish(c, true)
      return UI.say(ctx, { glyph: G.lion, title: 'Raid Tuntas!', sub: c.name, mentions: f.members, quote: [...head, `${G.ankh} *${r.boss} TUMBANG!*`, ...f.lines.slice(0, 8)], tail: [f.mvp && `MVP: *${f.mvp}* — Trofi Raid + Summon Ticket`, `Kas clan +${fmt(Math.floor(f.goldPool * 0.3))}`] })
    }
    R.save()
    return UI.say(ctx, { glyph: G.lion, title: 'Serangan Raid', sub: c.name, quote: [...head, bar(r.hp, r.maxhp), `Sisa HP boss ${fmt(r.hp)} • total damage-mu ${fmt(r.dmg[m.sender])}`] })
  },
}
