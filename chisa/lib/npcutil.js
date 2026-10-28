/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Helper bersama untuk plugin NPC layanan: header karakter + tambah hubungan
const ND = require('./npcdata'), NDB = require('./npcdb'), RPG = require('./rpg')
const hearts = (i) => '✦'.repeat(i) + '◦'.repeat(NDB.LEVELS.length - 1 - i)
const head = (id, jid) => { const n = ND.byId[id]; return `${n.emoji || ''} *${n.name}* — ${n.title}  ${jid ? hearts(NDB.lv(jid, id)) : ''}`.trim() }
// tambah hubungan setelah layanan dipakai; kembalikan teks level-up (jika ada)
function bump(jid, id, n = 2) {
  const r = NDB.add(jid, id, n); if (!r.up) return ''
  const u = RPG.get(jid); let t = `\n\n💖 Hubungan dengan ${ND.byId[id].name} naik menjadi *${NDB.LEVELS[r.up].name}*!`
  if (u) { const g = 300 * r.up; u.gold += g; t += ` Hadiah +${RPG.fmt(g)} gold`; if (r.up === NDB.LEVELS.length - 1) { RPG.give(u, 'summon_ticket', 2); t += ' +2 tiket summon' } RPG.save() }
  return t
}
module.exports = { hearts, head, bump }
