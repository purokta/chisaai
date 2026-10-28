/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Guild Master: NPC AI yang tahu stat RPG kamu dan memberi saran
const ai = require('../../lib/ai')
const { R, need, itemName } = require('../../lib/rpgctx')

module.exports = {
  name: 'gm',
  alias: ['gm', 'sensei'],
  category: 'rpg',
  cmds: [],
  desc: 'Tanya Guild Master AI: saran build, farming, craft sesuai stat kamu',
  run: async (ctx) => {
    const { sock, m, reply, text, prefix, isCreator } = ctx
    const u = need(ctx); if (!u) return
    if (!text) return reply(`Tanya Guild Master tentang petualanganmu.\nContoh:\n${prefix}guildmaster aku harus ngapain biar cepat naik level?\n${prefix}guildmaster cara bikin Dragon Slayer?`)
    const s = R.stats(u), c = R.D.CLASSES[u.cls], rk = R.rankOf(u.level), zone = R.zoneFor(u)
    const eq = ['weapon', 'armor', 'acc'].map(k => u.eq[k] ? itemName(u.eq[k]) : '-').join(' | ')
    const mats = Object.entries(u.inv).filter(([id]) => R.D.ITEMS[id]?.type === 'mat').map(([id, q]) => `${R.D.ITEMS[id].n} x${q}`).join(', ') || '-'
    const zones = R.D.ZONES.map(z => `${z.name} (Lv.${z.min}+)`).join(', ')
    const recipes = Object.entries(R.D.RECIPES).map(([k, r]) => `${R.D.ITEMS[k].n}: ${R.fmt(r.gold)}g + ${Object.entries(r.mats).map(([i, q]) => `${R.D.ITEMS[i].n} x${q}`).join(', ')}`).join('; ')
    const extra = `Peranmu: Guild Master tua yang bijak dan hangat di dunia isekai "Chisa AI RPG". Bicara singkat (maks ~8 baris) ala NPC anime, beri saran konkret yang bisa langsung dilakukan.
Data pemain: ${u.name}, class ${c.name} (skill ${c.skill}), Lv.${u.level}, rank ${rk.tier} ${rk.name}, gold ${R.fmt(u.gold)}, power ${R.fmt(s.power)}, ATK ${s.atk}, DEF ${s.defv}, HP ${R.fmt(s.maxhp)}, stat point sisa ${u.pts}, equipment: ${eq}, bahan: ${mats}, dungeon lantai ${u.floor}, clan: ${u.clan || 'tidak ada'}. Zona terbaik sekarang: ${zone.name}.
Pengetahuan game: zona ${zones}. Perintah (prefix ${prefix}): hunt, dungeon, explore, mine, fish, chop, daily, weekly, work, shop, buy, sell, craft, equip, addstat, summon, worldboss, attackboss, duel, arena, quest, clancreate, clanjoin. Resep craft: ${recipes}.
Hanya sarankan hal yang ada di game ini. Jangan mengarang fitur.`
    await sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
    try { const r = await ai.ask({ uid: 'gm:' + m.sender, text, extra }); return reply(`*Guild Master*\n\n${r.text}`) }
    catch (e) { console.log('[gm]', e.message, e.details || ''); return reply('Guild Master sedang bermeditasi... coba lagi sebentar.' + (isCreator && e.details ? '\n\n_Detail:_ ' + e.details.join(' | ') : '')) }
  },
}
