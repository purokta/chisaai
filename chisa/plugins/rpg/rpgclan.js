/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// CLAN: buat, gabung, info (canvas), kas, upgrade, war, kick, leave
const { R, need, target, mentioned } = require('../../lib/rpgctx')
const card = require('../../lib/rpgcard')

const findClan = (name) => { const k = Object.keys(R.clans()).find(x => x.toLowerCase() === String(name || '').trim().toLowerCase()); return k ? R.clans()[k] : null }

module.exports = {
  name: 'clancreate',
  alias: ['buatclan', 'clanjoin', 'joinclan', 'clanleave', 'keluarclan', 'claninfo', 'clan', 'clanlist', 'listclan', 'clandonate', 'donasiclan', 'clanupgrade', 'clanwar', 'clankick', 'topclan', 'clanbio'],
  category: 'rpg',
  cmds: ['clancreate','clanjoin','claninfo','clanlist','clandonate','clanupgrade','clanwar','clankick','clanleave'],
  menu: ['clancreate','clanjoin','clanleave','claninfo','clanlist','clandonate','clanupgrade','clanwar','clankick','topclan'],
  desc: 'Sistem clan: buat, gabung, kas, upgrade, war, kick',
  run: async (ctx) => {
    const { command, args, text, prefix, reply, m, sock } = ctx
    const u = need(ctx); if (!u) return
    const myClan = () => u.clan && R.clans()[u.clan]
    const nameOf = (j) => R.get(j)?.name || j.split('@')[0]

    if (['clancreate', 'buatclan'].includes(command)) {
      const name = text.trim().replace(/\s+/g, ' ')
      if (u.clan) return reply(`Kamu sudah di clan *${u.clan}*. Keluar dulu dengan ${prefix}clanleave.`)
      if (u.level < 10) return reply('Butuh minimal Lv.10 untuk membuat clan.')
      if (!/^[\p{L}\p{N} ]{3,18}$/u.test(name)) return reply(`Contoh: ${prefix}clancreate Crimson Lotus\n(3-18 karakter, huruf/angka/spasi)`)
      if (findClan(name)) return reply('Nama clan sudah dipakai.')
      if (u.gold < 5000) return reply(`Biaya membuat clan 5.000 gold (kamu ${R.fmt(u.gold)}).`)
      u.gold -= 5000; R.clans()[name] = { name, leader: m.sender, members: [m.sender], level: 1, treasury: 0, wins: 0, lastWar: 0, createdAt: Date.now() }; u.clan = name; R.save()
      const img = await card.clanCard({ name, leader: u.name, level: 1, members: 1, max: 15, treasury: 0, power: R.stats(u).power, wins: 0, next: R.clanUpCost({ level: 1 }), rankPos: null })
      return sock.sendMessage(m.chat, { image: img, caption: `🏯 Clan *${name}* resmi berdiri!\nAjak teman: ${prefix}clanjoin ${name}` }, { quoted: m })
    }

    if (['clanjoin', 'joinclan'].includes(command)) {
      if (u.clan) return reply(`Kamu sudah di clan *${u.clan}*.`)
      const c = findClan(text); if (!c) return reply(`Contoh: ${prefix}clanjoin Crimson Lotus\nDaftar clan: ${prefix}clanlist`)
      if (c.members.length >= R.clanMax(c)) return reply('Clan sudah penuh.')
      c.members.push(m.sender); u.clan = c.name; R.save(); return reply(`🎉 Kamu bergabung ke clan *${c.name}*! Bonus clan: +${c.level * 2}% EXP, +${c.level}% gold.`)
    }

    if (['clanleave', 'keluarclan'].includes(command)) {
      const c = myClan(); if (!c) return reply('Kamu tidak punya clan.')
      c.members = c.members.filter(j => j !== m.sender); u.clan = null
      if (!c.members.length) { delete R.clans()[c.name]; R.save(); return reply(`Clan *${c.name}* bubar karena tak ada member.`) }
      if (c.leader === m.sender) c.leader = c.members[0]
      R.save(); return reply(`Kamu keluar dari clan *${c.name}*.${c.leader !== m.sender ? ` Leader baru: ${nameOf(c.leader)}` : ''}`)
    }

    if (['claninfo', 'clan', 'clanbio'].includes(command)) {
      const c = text.trim() ? findClan(text) : myClan(); if (!c) return reply(text.trim() ? 'Clan tidak ditemukan.' : `Kamu belum punya clan. ${prefix}clancreate / ${prefix}clanjoin`)
      const sorted = Object.values(R.clans()).sort((a, b) => R.clanPower(b) - R.clanPower(a))
      const img = await card.clanCard({ name: c.name, leader: nameOf(c.leader), level: c.level, members: c.members.length, max: R.clanMax(c), treasury: c.treasury, power: R.clanPower(c), wins: c.wins, next: R.clanUpCost(c), rankPos: sorted.indexOf(c) + 1 })
      const top = [...c.members].map(j => R.get(j)).filter(Boolean).sort((a, b) => b.level - a.level).slice(0, 8)
      return sock.sendMessage(m.chat, { image: img, caption: `🏯 *${c.name}*\n\n*Member teratas*\n` + top.map((x, i) => `${i + 1}. ${x.name}${x.id === c.leader ? ' 👑' : ''} — Lv.${x.level}`).join('\n') + `\n\n_${prefix}clandonate • ${prefix}clanupgrade • ${prefix}clanwar_` }, { quoted: m })
    }

    if (['clanlist', 'listclan', 'topclan'].includes(command)) {
      const list = Object.values(R.clans()).sort((a, b) => R.clanPower(b) - R.clanPower(a)).slice(0, 10)
      if (!list.length) return reply(`Belum ada clan. Jadi yang pertama: ${prefix}clancreate <nama>`)
      return reply(`🏆 *TOP CLAN*\n\n` + list.map((c, i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} *${c.name}* Lv.${c.level}\n    👥 ${c.members.length}/${R.clanMax(c)} • 💪 ${R.fmt(R.clanPower(c))} • 🏆 ${c.wins} war`).join('\n'))
    }

    if (['clandonate', 'donasiclan'].includes(command)) {
      const c = myClan(); if (!c) return reply('Kamu tidak punya clan.')
      const n = parseInt(args[0]); if (!n || n < 100) return reply(`Contoh: ${prefix}clandonate 1000 (min 100)`)
      if (u.gold < n) return reply('Gold kurang.'); u.gold -= n; c.treasury += n; R.save()
      return reply(`💰 Donasi ${R.fmt(n)} gold ke kas clan. Kas sekarang ${R.fmt(c.treasury)}.`)
    }

    if (command === 'clanupgrade') {
      const c = myClan(); if (!c) return reply('Kamu tidak punya clan.'); if (c.leader !== m.sender) return reply('Hanya leader yang bisa upgrade clan.')
      if (c.level >= 10) return reply('Clan sudah level maksimal!'); const cost = R.clanUpCost(c)
      if (c.treasury < cost) return reply(`Kas kurang. Butuh ${R.fmt(cost)} (ada ${R.fmt(c.treasury)}).`)
      c.treasury -= cost; c.level++; R.save()
      return reply(`🆙 Clan *${c.name}* naik ke Lv.${c.level}!\nBonus: +${c.level * 2}% EXP, +${c.level}% gold • Kapasitas ${R.clanMax(c)} member`)
    }

    if (command === 'clankick') {
      const c = myClan(); if (!c || c.leader !== m.sender) return reply('Hanya leader clan yang bisa kick.')
      const t = target(ctx); if (!t || !c.members.includes(t) || t === m.sender) return reply(`Contoh: ${prefix}clankick @member`)
      c.members = c.members.filter(j => j !== t); const o = R.get(t); if (o) o.clan = null; R.save(); return reply(`🚪 ${nameOf(t)} dikeluarkan dari clan.`)
    }

    if (command === 'clanwar') {
      const c = myClan(); if (!c || c.leader !== m.sender) return reply('Hanya leader clan yang bisa memulai war.')
      const e = findClan(text); if (!e || e === c) return reply(`Contoh: ${prefix}clanwar <nama clan lawan>\nCooldown 6 jam.`)
      if (Date.now() - c.lastWar < 21600000) return reply(`⏳ Clan baru berperang. Tunggu ${R.dur(Math.ceil((c.lastWar + 21600000 - Date.now()) / 1000))}.`)
      c.lastWar = Date.now()
      const pa = R.clanPower(c) * (0.85 + Math.random() * 0.3), pb = R.clanPower(e) * (0.85 + Math.random() * 0.3), win = pa >= pb ? c : e, lose = win === c ? e : c
      win.wins++; const loot = Math.min(lose.treasury, Math.floor(lose.treasury * 0.1)); lose.treasury -= loot; win.treasury += loot + 1000
      for (const j of win.members) { const o = R.get(j); if (o) { R.addGold(o, 500 + o.level * 20); R.addExp(o, 200 + o.level * 10) } }
      R.save()
      return reply(`⚔️ *CLAN WAR*\n\n🏯 ${c.name}  💪 ${R.fmt(pa)}\n      VS\n🏯 ${e.name}  💪 ${R.fmt(pb)}\n\n🏆 Pemenang: *${win.name}*!\n💰 Rampasan kas ${R.fmt(loot)} + bonus 1.000 ke kas\n🎁 Semua member ${win.name} dapat gold & EXP`)
    }
  },
}
