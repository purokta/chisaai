/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// BANK GUILD: simpan gold dengan aman (tidak ikut hilang saat kalah) + bunga harian.
//   .bank   info saldo & bunga   •   .setor <jumlah|all>   •   .tarikbank <jumlah|all>   (jumlah boleh 5k / 2jt)
// Bunga 2% per hari penuh (maks 7 hari menumpuk, maks 10.000 gold per hari). Kapasitas naik sesuai level.
const { R, need } = require('../../lib/rpgctx'), DV = require('../../lib/dev')
const DAY = 86400000, RATE = 0.02, MAXDAYS = 7, MAXPERDAY = 10000
const capOf = (u) => 50000 + u.level * 10000

function accrue(u) {
  const b = u.bank = u.bank || { bal: 0, at: Date.now() }
  const days = Math.min(MAXDAYS, Math.floor((Date.now() - b.at) / DAY))
  if (days > 0) {
    let got = 0
    for (let i = 0; i < days; i++) { const g = Math.min(MAXPERDAY, Math.floor(b.bal * RATE)); b.bal += g; got += g }
    b.at += Math.floor((Date.now() - b.at) / DAY) * DAY
    return got
  }
  return 0
}
module.exports = {
  name: 'bank', alias: ['setor', 'tarikbank', 'wd', 'saldobank', 'bankrpg'], category: 'rpg', cmds: ['bank', 'setor', 'tarikbank'],
  desc: 'Bank guild: simpan gold aman + bunga 2%/hari (.bank, .setor, .tarikbank)',
  run: async (ctx) => {
    const { command, args, prefix, reply } = ctx
    const u = need(ctx); if (!u) return
    const bonus = accrue(u), b = u.bank, cap = capOf(u)
    const parse = (s) => /^(all|semua)$/i.test(s || '') ? 'all' : DV.parseAmount(s)

    if (command === 'setor') {
      let n = parse(args[0]); if (n === 'all') n = u.gold
      if (!Number.isFinite(n) || n <= 0) return reply(`Contoh: ${prefix}setor 5000  atau  ${prefix}setor all`)
      if (n > u.gold) return reply(`Gold di tas tidak cukup (punya ${R.fmt(u.gold)}).`)
      const room = cap - b.bal; if (room <= 0) return reply(`🏦 Brankas penuh (${R.fmt(cap)}). Naik level untuk menambah kapasitas.`)
      n = Math.min(n, room); u.gold -= n; b.bal += n; R.save()
      return reply(`🏦 Menyetor *${R.fmt(n)} gold*.\nSaldo bank: ${R.fmt(b.bal)} / ${R.fmt(cap)}\nGold di tas: ${R.fmt(u.gold)}`)
    }
    if (['tarikbank', 'wd'].includes(command)) {
      let n = parse(args[0]); if (n === 'all') n = b.bal
      if (!Number.isFinite(n) || n <= 0) return reply(`Contoh: ${prefix}tarikbank 5000  atau  ${prefix}tarikbank all`)
      if (n > b.bal) return reply(`Saldo bank tidak cukup (saldo ${R.fmt(b.bal)}).`)
      b.bal -= n; u.gold += n; R.save()
      return reply(`🏦 Menarik *${R.fmt(n)} gold*.\nSaldo bank: ${R.fmt(b.bal)}\nGold di tas: ${R.fmt(u.gold)}`)
    }
    R.save()
    const nextIn = Math.max(0, Math.ceil((b.at + DAY - Date.now()) / 1000)), perDay = Math.min(MAXPERDAY, Math.floor(b.bal * RATE))
    return reply(`🏦 *BANK GUILD*\n━━━━━━━━━━━━━━\n💰 Saldo   : ${R.fmt(b.bal)} / ${R.fmt(cap)}\n🪙 Di tas  : ${R.fmt(u.gold)}\n📈 Bunga   : 2%/hari (≈ +${R.fmt(perDay)} gold berikutnya, ${R.dur(nextIn)} lagi)${bonus ? `\n🎉 Bunga masuk barusan: +${R.fmt(bonus)} gold` : ''}\n\nGold di bank *aman* — tidak berkurang saat kalah bertarung.\n${prefix}setor <jumlah|all> • ${prefix}tarikbank <jumlah|all>`)
  },
}
