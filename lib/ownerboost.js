// Owner bot: koin/poin, tiket gacha, dan limit game selalu 99999+ (tidak pernah habis).
const BIG = 99999999
function apply(ctx) {
  try {
    const numOf = require('./limits').numOf
    const id = numOf(ctx.sender)
    const ids = new Set([id].filter(Boolean))
    const fruit = require('./fruit'), gacha = require('./gacha')
    for (const k of ids) {
      const u = fruit.user(k)
      if ((u.coins || 0) < BIG) { fruit.save(k, { ...u, coins: BIG }) }
    }
    const k = id
    const g = gacha.gachaUser(k)
    if (g.free || g.paid || g.tickets < 99999) gacha.saveGacha(k, { ...g, day: g.day, free: 0, paid: 0, tickets: Math.max(g.tickets, 99999) })
  } catch (e) { /* tidak boleh mengganggu perintah */ }
}
module.exports = { apply, BIG }
