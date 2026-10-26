/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// SKILL PASIF: poin skill (1 per 2 level + 6 per rebirth) dipakai untuk bonus permanen.
//   .skills (daftar & poin) • .learn <id> (naikkan 1 level) • .skillreset (kembalikan semua poin, bayar gold)
const { R, need } = require('../../lib/rpgctx')
const X = require('../../lib/rpgextra')
const UI = require('../../lib/rpgui'), { G, fmt } = UI

module.exports = {
  name: 'skills', alias: ['skill', 'skilltree', 'pohonskill', 'learn', 'skillup', 'belajar', 'skillreset', 'resetskill'], category: 'rpg', noLimit: true,
  cmds: ['skills', 'learn', 'skillreset'], desc: 'Skill pasif permanen: .skills, .learn <id>, .skillreset',
  run: async (ctx) => {
    const { command: c, args, prefix, reply } = ctx
    const u = need(ctx); if (!u) return
    u.sk = u.sk || {}

    if (['learn', 'skillup', 'belajar'].includes(c)) {
      const id = (args[0] || '').toLowerCase(), sk = X.SKILLS[id]
      if (!sk) return reply(`Contoh: ${prefix}learn tebasan\nDaftar id: ${Object.keys(X.SKILLS).join(', ')}`)
      const lv = X.skillLv(u, id); if (lv >= X.SKILL_MAX) return reply(`*${sk.n}* sudah maksimal (Lv.${X.SKILL_MAX}).`)
      const cost = X.costOf(lv), free = X.freePts(u)
      if (free < cost) return reply(`Poin skill kurang. Butuh *${cost}*, kamu punya *${free}*.\n_Poin bertambah +1 tiap 2 level (dan +6 tiap rebirth)._`)
      u.sk[id] = lv + 1; R.save()
      return UI.say(ctx, { glyph: G.owl, title: 'Skill Naik', sub: sk.n, quote: [`*${sk.n}* ➜ Lv.${lv + 1}/${X.SKILL_MAX}`, `Efek total: +${((lv + 1) * sk.per)}${sk.unit}`, `Poin tersisa: *${X.freePts(u)}*`] })
    }
    if (['skillreset', 'resetskill'].includes(c)) {
      const spent = X.spentPts(u); if (!spent) return reply('Belum ada skill yang dipelajari.')
      const cost = 3000 + u.level * 150
      if ((args[0] || '').toLowerCase() !== 'ya') return reply(`Reset skill mengembalikan *${spent}* poin.\nBiaya: *${fmt(cost)} gold*.\nKonfirmasi: ${prefix}skillreset ya`)
      if (u.gold < cost) return reply(`Gold kurang (butuh ${fmt(cost)}).`)
      u.gold -= cost; u.sk = {}; R.save()
      return UI.say(ctx, { glyph: G.scarab, title: 'Reset Skill', quote: [`Semua skill dikembalikan. Poin: *${X.freePts(u)}*`, `Biaya ${fmt(cost)} gold.`] })
    }
    return UI.say(ctx, { glyph: G.owl, title: 'Skill Pasif', sub: u.name,
      quote: [`Poin skill: *${X.freePts(u)}*  (terpakai ${X.spentPts(u)} / total ${X.totalPts(u)})`, 'Biaya naik Lv.n = n poin  •  maks Lv.5'],
      rows: Object.entries(X.SKILLS).map(([id, sk]) => [id, `${sk.n} Lv.${X.skillLv(u, id)}/${X.SKILL_MAX}  (+${X.skillLv(u, id) * sk.per}${sk.unit})`]),
      hint: `${prefix}learn <id>  •  contoh: ${prefix}learn tebasan` })
  },
}
