/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// COMPANION GACHA: summon, companion, setcompanion
const { R, need } = require('../../lib/rpgctx')
const D = R.D

function roll() {
  let x = Math.random() * 100, rar = 'N'
  for (const [k, v] of Object.entries(D.RARITY)) { if (x < v.rate) { rar = k; break } x -= v.rate }
  const pool = D.COMPANIONS.filter(c => c.r === rar)
  return pool[Math.floor(Math.random() * pool.length)]
}
const perkTxt = (c, star) => {
  const b = D.RARITY[c.r].bonus * (1 + (star - 1) * 0.5)
  return ({ atk: `ATK +${Math.floor(b * 5)}`, def: `DEF +${Math.floor(b * 3)}`, hp: `HP +${Math.floor(b * 30)}`, exp: `EXP +${b.toFixed(0)}%`, gold: `Gold +${b.toFixed(0)}%` })[c.perk]
}

module.exports = {
  name: 'summon',
  alias: ['companion', 'setcompanion', 'setwaifu'],
  category: 'rpg',
  cmds: ['summon', 'companion', 'setcompanion'],
  desc: 'Summon companion anime (gacha), lihat koleksi, pasang companion',
  run: async (ctx) => {
    const { command, args, prefix, reply } = ctx
    const u = need(ctx); if (!u) return

    if (['summon', 'gacha'].includes(command)) {
      const times = args[0] === '10' ? 10 : 1, priceG = 1500
      let tickets = Math.min(times, u.inv.summon_ticket || 0), gold = (times - tickets) * priceG
      if (u.gold < gold) return reply(`🎴 *SUMMON COMPANION*\n1x = 1 🎟️ Summon Ticket atau ${R.fmt(priceG)} gold\n10x = 10 tiket/gold (garansi minimal 1 SR!)\n\nTiket kamu: ${u.inv.summon_ticket || 0} • Gold: ${R.fmt(u.gold)}\nDapat tiket dari ${prefix}daily, ${prefix}weekly, dungeon boss & world boss.\n\n❌ Dana tidak cukup untuk ${times}x.`)
      if (tickets) R.take(u, 'summon_ticket', tickets); u.gold -= gold
      const res = []
      for (let i = 0; i < times; i++) {
        let c = roll()
        if (times === 10 && i === 9 && !res.some(r => ['SR', 'SSR', 'UR'].includes(r.r))) { const p = D.COMPANIONS.filter(x => ['SR', 'SSR'].includes(x.r)); c = p[Math.floor(Math.random() * p.length)] }
        res.push(c)
      }
      let t = `🎴 *SUMMON ${times}x*\n\n`, newc = 0
      for (const c of res) {
        const had = u.comp.owned[c.id]; u.comp.owned[c.id] = Math.min(5, (had || 0) + 1)
        if (!had) newc++
        t += `${c.e} ${D.RARITY[c.r].star} *${c.n}* [${c.r}] ${had ? (had >= 5 ? '(MAX ★, +300g)' : `→ ★${u.comp.owned[c.id]} naik bintang!`) : '🆕'}\n`
        if (had >= 5) u.gold += 300
        R.track(u, 'gacha')
      }
      if (!u.comp.active) { u.comp.active = res[0].id; t += `\n_${res[0].n} otomatis dipasang._` }
      R.save()
      const cap = t + `\n\n🎟️ Tiket dipakai ${tickets} • 💰 -${R.fmt(gold)}\nLihat koleksi: ${prefix}companion`
      try { // sertakan gambar anime
        const im = await require('../../../lib/animeimg').randomImage()
        if (im.buffer && ctx.sock?.sendMessage) return await ctx.sock.sendMessage(ctx.from || ctx.m?.chat || ctx.m?.key?.remoteJid, { image: im.buffer, caption: cap }, { quoted: ctx.m })
        console.log('[summon] gambar gagal:', (im.errors || []).join(' | '))
      } catch (e) { console.log('[summon] kirim gambar gagal:', e?.message || e) }
      return reply(cap)
    }

    if (['companion', 'waifu'].includes(command)) {
      const own = Object.entries(u.comp.owned); if (!own.length) return reply(`Kamu belum punya companion. Coba *${prefix}summon*!`)
      const lines = own.map(([id, st]) => D.COMPANIONS.find(c => c.id === id)).filter(Boolean).sort((a, b) => Object.keys(D.RARITY).indexOf(b.r) - Object.keys(D.RARITY).indexOf(a.r))
        .map(c => `${u.comp.active === c.id ? '👉' : '▫️'} ${c.e} *${c.n}* [${c.r}] ★${u.comp.owned[c.id]} — ${perkTxt(c, u.comp.owned[c.id])}\n    \`${c.id}\``)
      return reply(`🎴 *KOLEKSI COMPANION* (${own.length}/${D.COMPANIONS.length})\n\n${lines.join('\n')}\n\nPasang: ${prefix}setcompanion <id>`)
    }

    if (['setcompanion', 'setwaifu'].includes(command)) {
      const id = (args[0] || '').toLowerCase(), c = D.COMPANIONS.find(x => x.id === id || x.n.toLowerCase().includes(args.join(' ').toLowerCase()) && args.length)
      if (!c || !u.comp.owned[c.id]) return reply(`Contoh: ${prefix}setcompanion fox_miko\nCek koleksi: ${prefix}companion`)
      u.comp.active = c.id; R.save(); return reply(`${c.e} *${c.n}* kini menemanimu!\nBonus: ${perkTxt(c, u.comp.owned[c.id])}`)
    }
  },
}
