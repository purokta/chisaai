/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// EKONOMI: daily, weekly, work, transfer, shop, buy, sell, inventory, use, equip, craft
const { R, need, target, itemName } = require('../../lib/rpgctx')
const D = R.D
const UI = require('../../lib/rpgui'), { G, fmt } = UI
const GOLD = '#fbbf24', GREEN = '#34d399'

function findItem(str) {
  const q = String(str || '').toLowerCase().replace(/\s+/g, '_'); if (!q) return null
  if (D.ITEMS[q]) return q
  return Object.keys(D.ITEMS).find(k => D.ITEMS[k].n.toLowerCase().replace(/\s+/g, '_') === q) || Object.keys(D.ITEMS).find(k => k.includes(q) || D.ITEMS[k].n.toLowerCase().replace(/\s+/g, '_').includes(q)) || null
}
const sellValue = (id) => {
  const it = D.ITEMS[id]; if (it.price > 0) return Math.floor(it.price * (it.type === 'mat' ? 0.7 : 0.5))
  const rc = D.RECIPES[id]; return rc ? Math.floor(rc.gold * 0.5 + 1000) : 0
}
const slotOf = (it) => it.type === 'weapon' ? 'weapon' : it.type === 'armor' ? 'armor' : it.type === 'acc' ? 'acc' : null
const statLine = (it) => [it.atk && `ATK+${it.atk}`, it.def && `DEF+${it.def}`, it.hp && `HP+${it.hp}`, it.luck && `Luck+${it.luck}`, it.heal && `Heal ${it.heal}`, it.mp && `MP+${it.mp}`].filter(Boolean).join(' ')

module.exports = {
  name: 'daily',
  alias: ['weekly', 'work', 'kerja', 'transfer', 'tf', 'shop', 'toko', 'buy', 'beli', 'sell', 'jual', 'inv', 'inventory', 'tas', 'use', 'pakai', 'equip', 'unequip', 'craft'],
  category: 'rpg',
  cmds: ['daily','weekly','work','transfer','shop','buy','sell','inv','use','equip','unequip','craft'],
  desc: 'Hadiah harian/mingguan, kerja, transfer, toko, inventory, equip, craft',
  run: async (ctx) => {
    const { command, args, prefix, reply, m } = ctx
    const u = need(ctx); if (!u) return
    const s = R.stats(u)

    if (command === 'daily') {
      const prev = u.cd.daily || 0, left = R.cooldown(u, 'daily', 86400)
      if (left) return UI.say(ctx, { glyph: G.sun, title: 'Hadiah Harian', quote: ['Sudah diambil hari ini.', `Tunggu *${R.dur(left)}* lagi.`] })
      u.streak = Date.now() - prev < 172800000 && prev ? (u.streak || 0) + 1 : 1
      const bonus = 1 + Math.min(0.5, (u.streak - 1) * 0.05)
      const g = R.addGold(u, Math.floor((300 + u.level * 40) * bonus)), ex = R.addExp(u, Math.floor((100 + u.level * 10) * bonus))
      R.give(u, 'hp_potion', 2); const tk = u.streak % 7 === 0; if (tk) R.give(u, 'summon_ticket'); R.save()
      return UI.send(ctx, u, { glyph: G.scarab, title: 'Hadiah Harian', sub: `Streak ${u.streak} hari`, tone: 'gain', headline: 'Hadiah Harian', ex, cardSub: `Streak ${u.streak} hari  •  bonus +${Math.round((bonus - 1) * 100)}%`,
        quote: [`Streak *${u.streak} hari* (bonus +${Math.round((bonus - 1) * 100)}%)`], rows: [['GOLD', `+${fmt(g)}`], ['EXP', `+${fmt(ex.amt)}`], ['ITEM', 'HP Potion x2'], tk && ['BONUS 7 HARI', 'Summon Ticket x1']],
        chips: [{ l: 'Gold', v: `+${fmt(g)}`, c: GOLD }, { l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }, { l: 'Item', v: tk ? 'Potion x2 + Tiket' : 'HP Potion x2', c: GREEN }], log: [`Streak ${u.streak} hari berturut-turut`] })
    }
    if (command === 'weekly') {
      const left = R.cooldown(u, 'weekly', 604800); if (left) return UI.say(ctx, { glyph: G.sun, title: 'Hadiah Mingguan', quote: ['Sudah diambil.', `Tunggu *${R.dur(left)}* lagi.`] })
      const g = R.addGold(u, 3000 + u.level * 300), ex = R.addExp(u, 400 + u.level * 40); R.give(u, 'summon_ticket', 2); R.give(u, 'hp_potion2', 3); R.give(u, 'mp_potion2', 2); R.save()
      return UI.send(ctx, u, { glyph: G.offer, title: 'Hadiah Mingguan', tone: 'gain', headline: 'Hadiah Mingguan', ex, cardSub: 'Kiriman mingguan dari Guild',
        quote: ['Kiriman Guild untuk petualang setia.'], rows: [['GOLD', `+${fmt(g)}`], ['EXP', `+${fmt(ex.amt)}`], ['TIKET', 'Summon Ticket x2'], ['POTION', 'High HP x3, High MP x2']],
        chips: [{ l: 'Gold', v: `+${fmt(g)}`, c: GOLD }, { l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }, { l: 'Item', v: 'Tiket x2 + Potion', c: GREEN }], log: ['Summon Ticket x2', 'High HP Potion x3  •  High MP Potion x2'] })
    }
    if (['work', 'kerja'].includes(command)) {
      const left = R.cooldown(u, 'work', 300); if (left) return UI.say(ctx, { glyph: G.sun, title: 'Kerja', quote: [`Kamu kelelahan. Istirahat *${R.dur(left)}* lagi.`] })
      const job = R.pick(D.JOBS), g = R.addGold(u, R.rnd(60, 160) + u.level * 14), ex = R.addExp(u, 15 + u.level * 2); R.save()
      return UI.send(ctx, u, { glyph: G.offer, title: 'Kerja', tone: 'gain', headline: 'Upah Kerja', ex, cardSub: `Kamu bekerja ${job}`, quote: [`Kamu bekerja ${job}.`], rows: [['GOLD', `+${fmt(g)}`], ['EXP', `+${fmt(ex.amt)}`]],
        chips: [{ l: 'Gold', v: `+${fmt(g)}`, c: GOLD }, { l: 'EXP', v: `+${fmt(ex.amt)}`, c: GOLD }], log: [`Bekerja ${job}`] })
    }
    if (['transfer', 'tf'].includes(command)) {
      const t = target(ctx), amt = parseInt([...args].reverse().find(a => /^\d{1,9}$/.test(a))) || 0
      if (!t || t === m.sender || !amt) return reply(`Contoh: ${prefix}transfer @user 1000\n(biaya admin 5%)`)
      const o = R.get(t); if (!o) return reply('Penerima belum punya karakter RPG.')
      if (amt < 10) return reply('Minimal 10 gold.'); const fee = Math.ceil(amt * 0.05)
      if (u.gold < amt + fee) return reply(`Gold kurang. Butuh ${R.fmt(amt + fee)} (termasuk fee ${R.fmt(fee)}).`)
      u.gold -= amt + fee; o.gold += amt; R.save(); return reply(`✅ Transfer ${R.fmt(amt)} gold ke ${o.name} berhasil (fee ${R.fmt(fee)}).`)
    }

    if (['shop', 'toko'].includes(command)) {
      const grp = { potion: '🧪 POTION', weapon: '⚔️ SENJATA', armor: '🛡️ ARMOR', acc: '💍 AKSESORI', ticket: '🎟️ LAINNYA' }
      let t = `🏪 *TOKO GUILD*  (gold kamu: ${R.fmt(u.gold)})\n`
      for (const [ty, label] of Object.entries(grp)) {
        const rows = Object.entries(D.ITEMS).filter(([, i]) => i.type === ty && i.price > 0)
        if (rows.length) t += `\n*${label}*\n` + rows.map(([k, i]) => `${i.e} ${i.n} — ${R.fmt(i.price)}g ${statLine(i) ? `(${statLine(i)})` : ''}\n   ↳ \`${k}\``).join('\n') + '\n'
      }
      return reply(t + `\n_Beli:_ ${prefix}buy <id> [jumlah]\n_Senjata/armor lanjutan hanya lewat_ ${prefix}craft`)
    }
    if (['buy', 'beli'].includes(command)) {
      const id = findItem(args[0]), n = Math.max(1, Math.min(99, parseInt(args[1]) || 1))
      if (!id) return reply(`Contoh: ${prefix}buy hp_potion 5\nLihat daftar: ${prefix}shop`)
      const it = D.ITEMS[id]; if (!(it.price > 0) || it.type === 'mat') return reply('Item itu tidak dijual di toko.' + (D.RECIPES[id] ? ` Buat lewat ${prefix}craft ${id}` : ''))
      const cost = it.price * n; if (u.gold < cost) return reply(`Gold kurang. Butuh ${R.fmt(cost)}.`)
      u.gold -= cost; R.give(u, id, n); R.save(); return reply(`🛒 Membeli ${it.e} ${it.n} x${n} (-${R.fmt(cost)}g)`)
    }
    if (['sell', 'jual'].includes(command)) {
      if ((args[0] || '').toLowerCase() === 'all') {
        let tot = 0, c = 0; for (const [id, q] of Object.entries(u.inv)) if (D.ITEMS[id]?.type === 'mat') { tot += sellValue(id) * q; c += q; delete u.inv[id] }
        if (!c) return reply('Tidak ada bahan untuk dijual.'); u.gold += tot; R.save(); return reply(`💰 Menjual ${c} bahan → +${R.fmt(tot)} gold`)
      }
      const id = findItem(args[0]); if (!id || !has(u, id)) return reply(`Contoh: ${prefix}sell iron_ore 10  atau  ${prefix}sell all (semua bahan)`)
      const q = Math.min(u.inv[id], Math.max(1, parseInt(args[1]) || 1)), v = sellValue(id) * q
      if (Object.values(u.eq).includes(id) && u.inv[id] - q < 0) return reply('Item sedang dipakai.')
      R.take(u, id, q); u.gold += v; R.save(); return reply(`💰 Menjual ${itemName(id)} x${q} → +${R.fmt(v)} gold`)
    }

    if (['inv', 'inventory', 'tas'].includes(command)) {
      const by = { potion: [], mat: [], weapon: [], armor: [], acc: [], ticket: [] }
      for (const [id, q] of Object.entries(u.inv)) { const it = D.ITEMS[id]; if (it) by[it.type].push(`${it.e} ${it.n} x${q}${statLine(it) ? ` (${statLine(it)})` : ''}`) }
      const eq = (k) => u.eq[k] ? itemName(u.eq[k]) : '-'
      let t = `🎒 *INVENTORY ${u.name}*\n💰 ${R.fmt(u.gold)} gold\n\n*Terpasang*\nSenjata  › ${eq('weapon')}\nArmor    › ${eq('armor')}\nAksesori › ${eq('acc')}\n`
      for (const [k, label] of [['potion', '🧪 Potion'], ['weapon', '⚔️ Senjata'], ['armor', '🛡️ Armor'], ['acc', '💍 Aksesori'], ['ticket', '🎟️ Tiket'], ['mat', '📦 Bahan']]) if (by[k].length) t += `\n*${label}*\n${by[k].join('\n')}\n`
      return reply(t)
    }
    if (['use', 'pakai'].includes(command)) {
      const id = findItem(args[0]), n = Math.max(1, Math.min(50, parseInt(args[1]) || 1))
      if (!id || !has(u, id)) return reply(`Contoh: ${prefix}use hp_potion 2`)
      const it = D.ITEMS[id]; if (it.type !== 'potion') return reply('Item itu tidak bisa dipakai. Senjata/armor pakai ' + prefix + 'equip.')
      const q = Math.min(n, u.inv[id]); let used = 0
      for (let i = 0; i < q; i++) { if (it.heal && u.hp >= s.maxhp) break; if (it.mp && u.mp >= s.maxmp) break; if (it.heal) u.hp = Math.min(s.maxhp, u.hp + it.heal); if (it.mp) u.mp = Math.min(s.maxmp, u.mp + it.mp); R.take(u, id, 1); used++ }
      R.save(); return reply(used ? `${it.e} Memakai ${it.n} x${used}\n❤️ ${R.fmt(u.hp)}/${R.fmt(s.maxhp)} • 💧 ${R.fmt(u.mp)}/${R.fmt(s.maxmp)}` : 'Sudah penuh, tidak perlu dipakai.')
    }
    if (command === 'equip') {
      const id = findItem(args[0]); if (!id || !has(u, id)) return reply(`Contoh: ${prefix}equip iron_sword\nLihat tas: ${prefix}inv`)
      const slot = slotOf(D.ITEMS[id]); if (!slot) return reply('Item itu bukan equipment.')
      const old = u.eq[slot]; R.take(u, id); if (old) R.give(u, old); u.eq[slot] = id
      const n = R.stats(u); u.hp = Math.min(u.hp, n.maxhp); R.save(); return reply(`✅ Memakai ${itemName(id)} (${statLine(D.ITEMS[id])})${old ? `\n↩️ ${itemName(old)} kembali ke tas` : ''}`)
    }
    if (command === 'unequip') {
      const slot = ({ weapon: 'weapon', senjata: 'weapon', armor: 'armor', baju: 'armor', acc: 'acc', aksesori: 'acc' })[(args[0] || '').toLowerCase()]
      if (!slot || !u.eq[slot]) return reply(`Contoh: ${prefix}unequip weapon | armor | acc`)
      R.give(u, u.eq[slot]); const nm = itemName(u.eq[slot]); u.eq[slot] = null; R.save(); return reply(`↩️ ${nm} dilepas.`)
    }

    if (command === 'craft') {
      const id = findItem(args[0])
      if (!id || !D.RECIPES[id]) {
        return reply(`⚒️ *RESEP CRAFT*\n\n` + Object.entries(D.RECIPES).map(([k, r]) => `${itemName(k)} \`${k}\`\n   ${R.fmt(r.gold)}g + ` + Object.entries(r.mats).map(([mi, q]) => `${D.ITEMS[mi].n} ${(u.inv[mi] || 0)}/${q}`).join(', ')).join('\n\n') + `\n\n_Craft:_ ${prefix}craft <id>`)
      }
      const r = D.RECIPES[id], miss = Object.entries(r.mats).filter(([mi, q]) => (u.inv[mi] || 0) < q)
      if (u.gold < r.gold || miss.length) return reply(`❌ Bahan kurang untuk ${itemName(id)}:\n` + (u.gold < r.gold ? `• Gold ${R.fmt(u.gold)}/${R.fmt(r.gold)}\n` : '') + miss.map(([mi, q]) => `• ${D.ITEMS[mi].n} ${u.inv[mi] || 0}/${q}`).join('\n'))
      u.gold -= r.gold; for (const [mi, q] of Object.entries(r.mats)) R.take(u, mi, q); R.give(u, id); R.save()
      return reply(`⚒️ *CRAFT BERHASIL!*\nKamu membuat ${itemName(id)} ${statLine(D.ITEMS[id]) ? `(${statLine(D.ITEMS[id])})` : ''}\nPakai: ${prefix}equip ${id}`)
    }
  },
}
function has(u, id) { return (u.inv[id] || 0) > 0 }
