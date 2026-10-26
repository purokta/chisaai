/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// JUDI & KRIMINAL: coinflip, slot gold, dan rob (curi gold di kantong pemain lain; gold di BANK aman).
//   .coinflip <gold|all> <head|tail> • .rpgslot <gold|all> • .rob @user
const { R, need, target } = require('../../lib/rpgctx')
const DV = require('../../lib/dev')
const UI = require('../../lib/rpgui'), { G, fmt } = UI

const maxBet = (u) => 50000 + u.level * 2000
const parseBet = (s, u) => /^(all|semua)$/i.test(s || '') ? Math.min(u.gold, maxBet(u)) : DV.parseAmount(s)

// slot: peluang & pengali (RTP ≈ 89%)
const REEL = [['🍒', 35, 4], ['🍋', 30, 6], ['🔔', 20, 10], ['💎', 10, 25], ['7️⃣', 5, 60]], PAIR = 0.8
const spin = () => { let r = Math.random() * 100; for (const s of REEL) { if ((r -= s[1]) < 0) return s } return REEL[0] }

module.exports = {
  name: 'coinflip', alias: ['cf', 'lemparkoin', 'rpgslot', 'slotrpg', 'rob', 'curi', 'rampok'], category: 'rpg', cmds: ['coinflip', 'rpgslot', 'rob'],
  desc: 'Judi gold (coinflip, slot) & rob pemain lain (gold bank aman)',
  run: async (ctx) => {
    const { command: c, args, prefix, reply, m } = ctx
    const u = need(ctx); if (!u) return
    const wait = (left) => UI.say(ctx, { glyph: G.sun, title: 'Cooldown', quote: [`Tunggu *${R.dur(left)}* lagi.`] })

    if (['coinflip', 'cf', 'lemparkoin'].includes(c)) {
      const side = (args[1] || '').toLowerCase(), s = ['head', 'kepala', 'h'].includes(side) ? 'head' : ['tail', 'ekor', 't'].includes(side) ? 'tail' : null
      const bet = parseBet(args[0], u)
      if (!s || !Number.isFinite(bet) || bet < 10) return reply(`Contoh: ${prefix}coinflip 500 head\n(taruhan min 10, maks ${fmt(maxBet(u))} • head/tail • boleh 5k / all)`)
      if (bet > maxBet(u)) return reply(`Taruhan maksimal ${fmt(maxBet(u))} gold untuk level-mu.`)
      if (bet > u.gold) return reply(`Gold tidak cukup (punya ${fmt(u.gold)}).`)
      const left = R.cooldown(u, 'coinflip', 8); if (left) return wait(left)
      const win = Math.random() < 0.48 ? s : (s === 'head' ? 'tail' : 'head')   // peluang menang 48%
      const ok = win === s; u.gold += ok ? bet : -bet; R.save()
      return UI.say(ctx, { glyph: G.scarab, title: 'Coinflip', quote: [`Koin berputar... mendarat di *${win === 'head' ? 'HEAD (kepala)' : 'TAIL (ekor)'}*`, ok ? `${G.ankh} *MENANG!* +${fmt(bet)} gold` : `${G.cobra} *KALAH.* -${fmt(bet)} gold`, `Gold sekarang: ${fmt(u.gold)}`] })
    }

    if (['rpgslot', 'slotrpg'].includes(c)) {
      const bet = parseBet(args[0], u)
      if (!Number.isFinite(bet) || bet < 10) return reply(`Contoh: ${prefix}rpgslot 500\n(min 10, maks ${fmt(maxBet(u))})\n\n3 sama: 🍒x4 🍋x6 🔔x10 💎x25 7️⃣x60 • 2 sama: x${PAIR}`)
      if (bet > maxBet(u)) return reply(`Taruhan maksimal ${fmt(maxBet(u))} gold untuk level-mu.`)
      if (bet > u.gold) return reply(`Gold tidak cukup (punya ${fmt(u.gold)}).`)
      const left = R.cooldown(u, 'rpgslot', 8); if (left) return wait(left)
      const r = [spin(), spin(), spin()], three = r[0][0] === r[1][0] && r[1][0] === r[2][0], two = !three && (r[0][0] === r[1][0] || r[1][0] === r[2][0] || r[0][0] === r[2][0])
      const mult = three ? r[0][2] : two ? PAIR : 0, pay = Math.floor(bet * mult), diff = pay - bet
      u.gold += diff; R.save()
      return UI.say(ctx, { glyph: G.scarab, title: 'Slot Isekai', quote: [`[ ${r.map(x => x[0]).join(' | ')} ]`, three ? `${G.ankh} *JACKPOT x${mult}!* +${fmt(diff)} gold` : two ? (diff >= 0 ? `Dua sama — balik modal` : `Dua sama (x${PAIR}) — ${fmt(diff)} gold`) : `${G.cobra} Zonk. -${fmt(bet)} gold`, `Gold sekarang: ${fmt(u.gold)}`] })
    }

    // ROB
    const t = target(ctx)
    if (!t || t === m.sender) return reply(`Contoh: ${prefix}rob @user\nCurian 5–15% gold di kantong (gold BANK aman). Berisiko didenda kalau gagal.`)
    const v = R.get(t); if (!v) return reply('Target belum punya karakter RPG.')
    if (u.level < 10) return reply('Butuh minimal Lv.10 untuk merampok.')
    if (v.level < 10) return reply('Target terlalu pemula (di bawah Lv.10) — tidak adil, urungkan niatmu.')
    if (u.clan && u.clan === v.clan) return reply('Merampok teman satu clan? Pengkhianat!')
    const X = require('../../lib/rpgextra'), pa = X.partyOf(u); if (pa && pa === X.partyOf(v)) return reply('Merampok rekan satu party? Pengkhianat!')
    if (v.robbedAt && Date.now() - v.robbedAt < 1800000) return reply(`${v.name} baru saja dirampok — dia sedang dijaga ketat (±${R.dur(Math.ceil((1800000 - (Date.now() - v.robbedAt)) / 1000))}).`)
    if (v.gold < 500) return reply(`Kantong ${v.name} nyaris kosong (${fmt(v.gold)} gold). Tidak sepadan.`)
    const left = R.cooldown(u, 'rob', 600); if (left) return wait(left)
    const sa = R.stats(u), sv = R.stats(v), chance = Math.max(0.2, Math.min(0.7, 0.45 + (sa.agi - sv.agi) * 0.006 + (u.level - v.level) * 0.003))
    if (Math.random() < chance) {
      const pct = R.rnd(5, 15) / 100, take = Math.min(Math.floor(v.gold * pct), 100000 + u.level * 1000)
      v.gold -= take; u.gold += take; v.robbedAt = Date.now(); u.robWins = (u.robWins || 0) + 1; R.save()
      return UI.say(ctx, { glyph: G.cobra, title: 'Rob Berhasil', mentions: [t], quote: [`Dalam bayangan, kamu menyelinap dan merampok @${t.split('@')[0]}!`, `${G.offer} Hasil curian: *+${fmt(take)} gold*`, `Peluang sukses tadi ${Math.round(chance * 100)}%`], hint: 'Simpan gold di bank (.setor) supaya aman dari perampok.' })
    }
    const fine = Math.min(u.gold, Math.max(200, Math.floor(u.gold * R.rnd(5, 10) / 100))), hpLoss = Math.floor(sa.maxhp * 0.1)
    u.gold -= fine; v.gold += Math.floor(fine / 2); u.hp = Math.max(1, u.hp - hpLoss); R.save()
    return UI.say(ctx, { glyph: G.cobra, title: 'Rob Gagal', mentions: [t], quote: [`@${t.split('@')[0]} memergokimu! Penjaga guild menangkapmu.`, `Denda: *-${fmt(fine)} gold* (separuh untuk korban) • HP -${fmt(hpLoss)}`, `Peluang sukses tadi ${Math.round(chance * 100)}%`] })
  },
}
