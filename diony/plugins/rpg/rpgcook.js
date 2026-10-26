/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// MASAK: ubah bahan jadi makanan — pulihkan HP/MP dan beri buff sementara (ATK / DEF / EXP).
//   .cook   daftar resep & stok bahanmu   •   .cook <id>   masak satu porsi (jeda 20 detik)
const { R, need, itemName } = require('../../lib/rpgctx')
const MIN = 60000
const RECIPES = {
  bakar:   { n: '🐟 Ikan Bakar',          mats: { fish: 2 },                                   hp: 0.30,                 txt: 'Pulihkan 30% HP' },
  sup:     { n: '🍲 Sup Herba',           mats: { herb: 3, fish: 1 },                          hp: 0.50, mp: 0.25,       txt: 'Pulihkan 50% HP + 25% MP' },
  steak:   { n: '🥩 Steak Monster',       mats: { rabbit_horn: 2, goblin_ear: 2, herb: 1 },    buff: { atk: 30 },         txt: 'ATK +15% selama 30 menit' },
  roti:    { n: '🍞 Roti Zirah',          mats: { iron_ore: 2, wood: 2, herb: 2 },             buff: { def: 30 },         txt: 'DEF +15% selama 30 menit' },
  teh:     { n: '🍵 Teh Kristal',         mats: { crystal: 1, herb: 2 },                       buff: { exp: 30 },         txt: 'EXP +20% selama 30 menit' },
  pesta:   { n: '👑 Hidangan Raja',       mats: { rare_fish: 2, herb: 5, gold_ore: 1 },        hp: 1, mp: 1, buff: { atk: 45, def: 45, exp: 45 }, txt: 'Pulihkan penuh + ATK/DEF/EXP selama 45 menit' },
}
const matLine = (u, mats) => Object.entries(mats).map(([id, q]) => `${itemName(id)} ${R.has(u, id, q) ? '✅' : '❌'} ${u.inv[id] || 0}/${q}`).join(' • ')

module.exports = {
  name: 'cook', alias: ['masak', 'menumasak', 'dapur'], category: 'rpg', cmds: ['cook'],
  desc: 'Masak makanan dari bahan: pulihkan HP/MP + buff ATK/DEF/EXP (.cook <id>)',
  run: async (ctx) => {
    const { args, prefix, reply } = ctx
    const u = need(ctx); if (!u) return
    const id = String(args[0] || '').toLowerCase(), rc = RECIPES[id]
    if (!rc) {
      return reply(`🍳 *DAPUR PETUALANG*\n_Bahan didapat dari hunt, mine, fish, chop, explore._\n\n` + Object.entries(RECIPES).map(([k, r]) => `*${k}* — ${r.n}\n   ${r.txt}\n   ${matLine(u, r.mats)}`).join('\n\n') + `\n\nMasak: *${prefix}cook <id>*  (contoh: ${prefix}cook sup)`)
    }
    for (const [mid, q] of Object.entries(rc.mats)) if (!R.has(u, mid, q)) return reply(`Bahan kurang untuk ${rc.n}:\n${matLine(u, rc.mats)}`)
    const left = R.cooldown(u, 'cook', 20); if (left) return reply(`🔥 Kompor masih panas, tunggu ${R.dur(left)}.`)
    for (const [mid, q] of Object.entries(rc.mats)) R.take(u, mid, q)
    const s = R.stats(u), now = Date.now(); let t = `🍳 Kamu memasak *${rc.n}*!`
    if (rc.hp) { const before = u.hp; u.hp = Math.min(s.maxhp, u.hp + Math.floor(s.maxhp * rc.hp)); t += `\n❤️ HP +${R.fmt(u.hp - before)} (${R.fmt(u.hp)}/${R.fmt(s.maxhp)})` }
    if (rc.mp) { const before = u.mp; u.mp = Math.min(s.maxmp, u.mp + Math.floor(s.maxmp * rc.mp)); t += `\n💧 MP +${R.fmt(u.mp - before)} (${R.fmt(u.mp)}/${R.fmt(s.maxmp)})` }
    if (rc.buff) {
      u.buff = u.buff || {}
      for (const [k, mins] of Object.entries(rc.buff)) u.buff[k] = Math.max(now, u.buff[k] || 0) + mins * MIN
      t += `\n✨ Buff aktif: ${rc.txt.replace(/^Pulihkan penuh \+ /, '')}`
    }
    u.cnt = u.cnt || {}; u.cnt.cook = (u.cnt.cook || 0) + 1
    R.save(); return reply(t + `\n\n_Total masakan: ${u.cnt.cook}_`)
  },
}
