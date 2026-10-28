/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// GELAR & REBIRTH
//   .gelar (daftar gelar) • .settitle <id>  — gelar tampil di profil & sambutan otomatis
//   .rebirth (info) • .rebirth confirm — reset level ke 1 demi bonus PERMANEN (maks 10x)
const { R, need } = require('../../lib/rpgctx')
const X = require('../../lib/rpgextra')
const UI = require('../../lib/rpgui'), { G, fmt } = UI

module.exports = {
  name: 'gelar', alias: ['gelarku', 'gelarlist', 'settitle', 'pakaigelar', 'rebirth', 'lahirkembali'], category: 'rpg', noLimit: true,
  cmds: ['gelar', 'settitle', 'rebirth'], desc: 'Gelar petualang & Rebirth (bonus permanen)',
  run: async (ctx) => {
    const { command: c, args, prefix, reply } = ctx
    const u = need(ctx); if (!u) return

    if (['settitle', 'pakaigelar'].includes(c)) {
      const id = (args[0] || '').toLowerCase()
      if (id === 'off' || id === 'lepas') { u.title = null; R.save(); return reply('Gelar dilepas.') }
      if (!X.TITLES[id]) return reply(`Contoh: ${prefix}settitle pembantai\nLihat daftar: ${prefix}gelar`)
      if (!X.unlocked(u).includes(id)) return reply(`Gelar *${X.TITLES[id].n}* belum terbuka (${X.TITLES[id].hint}).`)
      u.title = id; R.save(); return UI.say(ctx, { glyph: G.scarab, title: 'Gelar Dipakai', quote: [`Gelarmu kini: *${X.TITLES[id].n}*`] })
    }
    if (['gelar', 'gelarku', 'gelarlist'].includes(c)) {
      const un = X.unlocked(u); R.save()
      return UI.say(ctx, { glyph: G.scarab, title: 'Gelar Petualang', sub: u.name,
        quote: [`Aktif: *${X.titleOf(u) || 'belum dipasang'}*`, `Terbuka ${un.length}/${Object.keys(X.TITLES).length}`],
        rows: Object.entries(X.TITLES).map(([id, t]) => [id, `${un.includes(id) ? '✔' : '✖'} ${t.n}${un.includes(id) ? '' : '  — ' + t.hint}`]), hint: `Pakai: ${prefix}settitle <id>` })
    }

    // REBIRTH
    const n = u.rebirth || 0, cost = X.rebirthCost(n)
    if (n >= X.REBIRTH_MAX) return UI.say(ctx, { glyph: G.sun, title: 'Rebirth', quote: [`Kamu sudah mencapai Rebirth maksimum (*${X.REBIRTH_MAX}x*).`, 'Roda samsara tak punya apa pun lagi untukmu.'] })
    const nb = X.rebirthBonus({ rebirth: n + 1 })
    if ((args[0] || '').toLowerCase() !== 'confirm') {
      return UI.say(ctx, { glyph: G.sun, title: 'Rebirth', sub: `ke-${n + 1}`,
        quote: [`Rebirth sekarang: *${n}x* (bonus aktif: ATK/DEF/HP +${n * 5}%, EXP/Gold +${n * 3}%)`, `Syarat: *Lv.${X.REBIRTH_LV}+* • biaya *${fmt(cost)} gold*`, `Hasil: level kembali ke 1 (stat point dibagi ulang), lantai dungeon reset.`, `Bonus permanen baru: ATK/DEF/HP *+${nb.atk}%*, EXP/Gold *+${nb.exp}%*, +6 poin skill, +${(n + 1) * 3} Summon Ticket.`, 'Gear, gold sisa, companion, clan, skill & gelar tetap dimiliki.'],
        tail: [`Kamu: Lv.${u.level} • gold ${fmt(u.gold)}`], hint: `Yakin? ${prefix}rebirth confirm` })
    }
    if (u.level < X.REBIRTH_LV) return reply(`Butuh minimal Lv.${X.REBIRTH_LV} (kamu Lv.${u.level}).`)
    if (u.gold < cost) return reply(`Butuh ${fmt(cost)} gold (kamu ${fmt(u.gold)}).`)
    X.unlocked(u)                                  // simpan gelar yang sudah terbuka
    u.spBase = (u.spBase || 0) + Math.floor(u.level / 2)   // poin skill dari level lama tetap milikmu
    u.gold -= cost; u.rebirth = n + 1; u.level = 1; u.exp = 0; u.pts = 0; u.a = { str: 0, def: 0, agi: 0, int: 0 }; u.floor = 1; u.bounty = null
    R.give(u, 'summon_ticket', (n + 1) * 3)
    const s = R.stats(u); u.hp = s.maxhp; u.mp = s.maxmp; R.save()
    return UI.say(ctx, { glyph: G.sun, title: 'Terlahir Kembali', sub: `Rebirth ${u.rebirth}x`,
      quote: [`Rohmu menembus roda samsara — kamu kembali ke *Lv.1* dengan kekuatan baru!`, `Bonus permanen: ATK/DEF/HP +${nb.atk}%, EXP/Gold +${nb.exp}%`, `+${(n + 1) * 3} Summon Ticket • +6 poin skill`], hint: `Atur skill: ${prefix}skills` })
  },
}
