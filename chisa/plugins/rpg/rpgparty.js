/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PARTY: tim kecil maks 5 orang. Bonus EXP/gold tiap anggota tambahan + Party Dungeon (co-op estafet).
//   .partycreate <nama> • .partyinvite @user • .partyjoin <nama|id> • .partyleave • .partykick @user • .partydisband
//   .partyinfo • .partyopen on|off • .partyname <nama baru> • .partytop • .pdungeon (leader)
const { R, need, target } = require('../../lib/rpgctx')
const X = require('../../lib/rpgextra')
const UI = require('../../lib/rpgui'), { G, fmt } = UI
const D = R.D
const GOLD = '#fbbf24', GREEN = '#34d399', RED = '#f87171', BLUE = '#38bdf8'
const INV_TTL = 600000, DG_CD = 300   // undangan 10 menit • cooldown party dungeon 5 menit

const store = () => (R.db.parties = R.db.parties || {})
const find = (s) => { const k = String(s || '').trim().toLowerCase(); return Object.values(store()).find(p => p.id.toLowerCase() === k || p.name.toLowerCase() === k) || null }
const powerOf = (p) => p.members.reduce((t, j) => t + (R.get(j) ? R.stats(R.get(j)).power : 0), 0)
const nameOf = (j) => (R.get(j) && R.get(j).name) || j.split('@')[0]
const tag = (j) => '@' + j.split('@')[0]
const validName = (n) => /^[\p{L}\p{N} ]{3,18}$/u.test(n)

function leave(p, u) {
  p.members = p.members.filter(j => j !== u.id); u.party = null
  if (!p.members.length) { delete store()[p.id]; return 'bubar' }
  if (p.leader === u.id) p.leader = p.members[0]
  return 'ok'
}

// ── PARTY DUNGEON: anggota bertarung estafet melawan SATU monster besar (HP gabungan) ──
function dungeon(p) {
  const mem = p.members.map(j => R.get(j)).filter(Boolean)
  const ready = mem.filter(x => x.hp >= R.stats(x).maxhp * 0.2)
  if (ready.length < 2) return { err: `Minimal *2 anggota* dengan HP di atas 20% untuk masuk (siap: ${ready.length}).` }
  const avgLv = Math.round(ready.reduce((t, x) => t + x.level, 0) / ready.length)
  const fl = p.floor, zone = D.ZONES[Math.min(D.ZONES.length - 1, Math.floor((fl - 1) / 5))]
  if (avgLv < zone.min) return { err: `Lantai ${fl} ada di *${zone.name}* — butuh rata-rata *Lv.${zone.min}* (party kalian Lv.${avgLv}).` }
  const boss = fl % 5 === 0, endless = Math.max(0, fl - 35) * 0.12, n = ready.length
  let mob = R.scaleMob(boss ? zone.boss : R.pick(zone.mobs), { level: avgLv }, zone)
  const k = 1 + endless
  mob = { ...mob, hp: Math.floor(mob.hp * k * (1 + 0.7 * (n - 1))), atk: Math.floor(mob.atk * k * (1 + 0.1 * (n - 1))), exp: Math.floor(mob.exp * k), gold: Math.floor(mob.gold * k) }
  const order = [...ready].sort((a, b) => R.stats(b).power - R.stats(a).power)
  let left = mob.hp, killer = null; const steps = []
  for (const x of order) {
    const r = R.fight(x, { ...mob, hp: left }), dealt = left - r.mobHp
    left = r.mobHp; x.hp = r.hp; x.mp = r.mp
    steps.push({ u: x, dealt, win: left <= 0 })
    if (left <= 0) { killer = x; break }
    x.hp = Math.max(1, Math.floor(R.stats(x).maxhp * 0.1))   // tumbang: mundur, tanpa kehilangan gold
  }
  return { ok: left <= 0, mob, zone, boss, fl, n, avgLv, order, steps, killer, left }
}

module.exports = {
  name: 'party',
  alias: ['partycreate', 'pcreate', 'buatparty', 'partyinvite', 'pinvite', 'partyjoin', 'pjoin', 'partyleave', 'pleave', 'partykick', 'pkick', 'partydisband', 'pdisband',
    'partyinfo', 'pinfo', 'partyopen', 'popen', 'partyname', 'prename', 'partytop', 'toppary', 'pdungeon', 'partydungeon', 'pdg'],
  category: 'rpg', noLimit: true,
  cmds: ['partycreate', 'partyinvite', 'partyjoin', 'partyleave', 'partykick', 'partyinfo', 'partyopen', 'partytop', 'pdungeon'],
  menu: ['partycreate', 'partyinvite', 'partyjoin', 'partyleave', 'partykick', 'partydisband', 'partyinfo', 'partyopen', 'partyname', 'partytop', 'pdungeon'],
  desc: 'Party maks 5 orang: bonus EXP, party dungeon co-op, peringkat party',
  run: async (ctx) => {
    const { command: c, text, args, prefix, reply, m } = ctx
    const u = need(ctx); if (!u) return
    const mine = () => X.partyOf(u)
    const only = (p) => p.leader === m.sender
    const say = (o) => UI.say(ctx, o)

    if (['partytop', 'toppary'].includes(c)) {
      const list = Object.values(store()).sort((a, b) => powerOf(b) - powerOf(a)).slice(0, 10)
      if (!list.length) return reply(`Belum ada party. Buat: ${prefix}partycreate <nama>`)
      return say({ glyph: G.lion, title: 'Peringkat Party', quote: list.map((p, i) => `${['𝐈', '𝐈𝐈', '𝐈𝐈𝐈'][i] || (i + 1) + '.'} *${p.name}* — ${p.members.length}/${X.PARTY_MAX} orang • Power ${fmt(powerOf(p))} • Lantai terbaik ${p.best || 0}`) })
    }

    if (['partycreate', 'pcreate', 'buatparty'].includes(c)) {
      if (mine()) return reply(`Kamu sudah di party *${mine().name}*. Keluar dulu: ${prefix}partyleave`)
      const name = text.trim().replace(/\s+/g, ' ')
      if (!validName(name)) return reply(`Contoh: ${prefix}partycreate Pasukan Fajar\n(3-18 karakter, huruf/angka/spasi)`)
      if (find(name)) return reply('Nama party sudah dipakai.')
      let id; do { id = 'P' + R.rnd(1000, 9999) } while (store()[id])
      store()[id] = { id, name, leader: m.sender, members: [m.sender], open: false, inv: {}, floor: 1, best: 0, wins: 0, cd: 0, createdAt: Date.now() }
      u.party = id; R.save()
      return say({ glyph: G.falcon, title: 'Party Dibentuk', sub: name, quote: [`ID party: *${id}*`, `Kapasitas ${X.PARTY_MAX} orang • bonus EXP +4% / gold +2% per anggota tambahan`], hint: `Undang: ${prefix}partyinvite @user  •  buka bebas: ${prefix}partyopen on` })
    }

    if (['partyjoin', 'pjoin'].includes(c)) {
      if (mine()) return reply(`Kamu sudah di party *${mine().name}*.`)
      const p = find(text); if (!p) return reply(`Contoh: ${prefix}partyjoin Pasukan Fajar  (atau ID, mis. P1234)\nDaftar: ${prefix}partytop`)
      if (p.members.length >= X.PARTY_MAX) return reply('Party sudah penuh.')
      const inv = p.inv && p.inv[m.sender] > Date.now()
      if (!p.open && !inv) return reply('Party ini tertutup. Minta leader mengundangmu dengan *' + prefix + 'partyinvite*.')
      p.members.push(m.sender); u.party = p.id; if (p.inv) delete p.inv[m.sender]; R.save()
      return say({ glyph: G.ankh, title: 'Gabung Party', sub: p.name, mentions: p.members, quote: [`${tag(m.sender)} bergabung ke *${p.name}*!`, `Anggota: ${p.members.length}/${X.PARTY_MAX} • bonus EXP +${(p.members.length - 1) * 4}%`] })
    }

    const p = mine()
    if (['partyinfo', 'pinfo', 'party'].includes(c)) {
      const t = text.trim() ? find(text) : p
      if (!t) return reply(text.trim() ? 'Party tidak ditemukan.' : `Kamu belum punya party. ${prefix}partycreate <nama> / ${prefix}partyjoin <nama>`)
      const rows = t.members.map(j => R.get(j)).filter(Boolean).sort((a, b) => b.level - a.level)
      return say({ glyph: G.falcon, title: t.name, sub: `ID ${t.id}`, mentions: [t.leader],
        quote: [`Leader: ${tag(t.leader)}`, `Anggota ${t.members.length}/${X.PARTY_MAX} • ${t.open ? 'terbuka' : 'tertutup'} • Power ${fmt(powerOf(t))}`, `Bonus: EXP +${(t.members.length - 1) * 4}% • Gold +${(t.members.length - 1) * 2}%`, `Party Dungeon: lantai *${t.floor}* (terbaik ${t.best || 0}, ${t.wins || 0} menang)`],
        rows: rows.map(x => [(x.id === t.leader ? '♛ ' : '· ') + x.name.slice(0, 14), `Lv.${x.level} ${R.rankOf(x.level).tier} • ${fmt(R.stats(x).power)}`]) })
    }

    if (!p) return reply(`Kamu belum punya party. ${prefix}partycreate <nama> / ${prefix}partyjoin <nama>`)

    if (['partyleave', 'pleave'].includes(c)) {
      const r = leave(p, u); R.save()
      return reply(r === 'bubar' ? `Party *${p.name}* bubar karena kosong.` : `Kamu keluar dari party *${p.name}*.${p.leader !== m.sender ? ` Leader sekarang: ${nameOf(p.leader)}` : ''}`)
    }
    if (['partydisband', 'pdisband'].includes(c)) {
      if (!only(p)) return reply('Hanya leader yang bisa membubarkan party.')
      for (const j of p.members) { const x = R.get(j); if (x) x.party = null }
      delete store()[p.id]; R.save(); return reply(`💥 Party *${p.name}* dibubarkan.`)
    }
    if (['partyinvite', 'pinvite'].includes(c)) {
      if (!only(p)) return reply('Hanya leader yang bisa mengundang.')
      if (p.members.length >= X.PARTY_MAX) return reply('Party sudah penuh.')
      const t = target(ctx); if (!t || t === m.sender) return reply(`Contoh: ${prefix}partyinvite @user`)
      const o = R.get(t); if (!o) return reply('Target belum punya karakter RPG.')
      if (X.partyOf(o)) return reply('Target sudah punya party.')
      p.inv = p.inv || {}; p.inv[t] = Date.now() + INV_TTL; R.save()
      return say({ glyph: G.falcon, title: 'Undangan Party', sub: p.name, mentions: [t], quote: [`${tag(t)}, kamu diundang ke party *${p.name}*!`, 'Berlaku 10 menit.'], hint: `Terima: ${prefix}partyjoin ${p.name}` })
    }
    if (['partykick', 'pkick'].includes(c)) {
      if (!only(p)) return reply('Hanya leader yang bisa mengeluarkan anggota.')
      const t = target(ctx); if (!t || t === m.sender || !p.members.includes(t)) return reply(`Contoh: ${prefix}partykick @anggota`)
      const o = R.get(t); p.members = p.members.filter(j => j !== t); if (o) o.party = null; R.save()
      return say({ glyph: G.cobra, title: 'Keluar Party', mentions: [t], quote: [`${tag(t)} dikeluarkan dari *${p.name}*.`] })
    }
    if (['partyopen', 'popen'].includes(c)) {
      if (!only(p)) return reply('Hanya leader yang bisa mengubah ini.')
      const v = (args[0] || '').toLowerCase(); if (!['on', 'off'].includes(v)) return reply(`Contoh: ${prefix}partyopen on|off\nSaat ini: ${p.open ? 'terbuka' : 'tertutup'}`)
      p.open = v === 'on'; R.save(); return reply(`Party kini *${p.open ? 'terbuka (siapa saja bisa gabung)' : 'tertutup (hanya undangan)'}*.`)
    }
    if (['partyname', 'prename'].includes(c)) {
      if (!only(p)) return reply('Hanya leader yang bisa mengganti nama.')
      const name = text.trim().replace(/\s+/g, ' ')
      if (!validName(name)) return reply(`Contoh: ${prefix}partyname Pasukan Senja`)
      const ex = find(name); if (ex && ex.id !== p.id) return reply('Nama party sudah dipakai.')
      p.name = name; R.save(); return reply(`Nama party sekarang *${name}*.`)
    }

    if (['pdungeon', 'partydungeon', 'pdg'].includes(c)) {
      if (!only(p)) return reply('Hanya *leader* yang bisa memulai party dungeon.')
      const left = Math.ceil((((p.cd || 0) + DG_CD * 1000) - Date.now()) / 1000)
      if (left > 0) return say({ glyph: G.sun, title: 'Cooldown Party', quote: [`Party masih memulihkan diri. Tunggu *${R.dur(left)}* lagi.`] })
      const r = dungeon(p); if (r.err) return reply(r.err)
      p.cd = Date.now()
      const nm = (x) => x.name.slice(0, 12)
      const steps = r.steps.map(s => `${s.win ? '💥' : '🩸'} ${nm(s.u)} — ${fmt(s.dealt)} dmg${s.win ? ' (pukulan terakhir!)' : ' (tumbang, mundur)'}`)
      if (!r.ok) {
        R.save()
        return UI.send(ctx, u, { glyph: G.falcon, title: 'Party Dungeon', sub: `Lantai ${r.fl}`, tone: 'lose', headline: 'Party Mundur', cardSub: `${p.name} vs ${r.mob.n}`,
          quote: [`*${p.name}* (${r.n} orang) menantang *${r.mob.n}* di ${r.zone.name}`, ...steps, `${G.cobra} *GAGAL.* Sisa HP musuh ${fmt(r.left)} / ${fmt(r.mob.hp)}`, 'Semua anggota mundur dengan 10% HP (tanpa kehilangan gold).'],
          hint: `Pulihkan dulu: ${prefix}heal • lalu coba lagi`, log: steps.map(s => s.replace(/^[^\w]+/, '')), chips: [{ l: 'Sisa HP musuh', v: fmt(r.left), c: RED }, { l: 'Lantai', v: String(r.fl), c: BLUE }], mentions: p.members })
      }
      // menang: semua anggota yang ikut mendapat hadiah (pembagi menyesuaikan HP gabungan)
      const rm = (1 + 0.7 * (r.n - 1)) / r.n * 1.15, lines = []; let leaderEx = null
      for (const x of r.order) {
        const bonus = x === r.killer ? 1.2 : 1
        const ex = R.addExp(x, Math.floor(r.mob.exp * rm * bonus)), g = R.addGold(x, Math.floor(r.mob.gold * rm * bonus))
        x.kills++; R.track(x, 'kill')
        let dr = ''; if (Math.random() < (r.boss ? 0.8 : 0.4)) { R.give(x, r.mob.drop, 1); dr = ` + ${(D.ITEMS[r.mob.drop] || {}).n || r.mob.drop}` }
        if (x.id === m.sender) leaderEx = ex
        lines.push(`${nm(x)}: +${fmt(ex.amt)} EXP, +${fmt(g)} gold${dr}${ex.up ? ` ⬆ Lv.${ex.lvl}` : ''}`)
      }
      let tk = ''; if (r.boss && Math.random() < 0.5) { const w = R.pick(r.order); R.give(w, 'summon_ticket'); tk = `🎟️ ${nm(w)} mendapat Summon Ticket!` }
      p.floor++; p.best = Math.max(p.best || 0, r.fl); p.wins = (p.wins || 0) + 1; R.save()
      return UI.send(ctx, u, { glyph: G.falcon, title: 'Party Dungeon', sub: `Lantai ${r.fl}${r.boss ? ' • BOSS' : ''}`, tone: 'win', headline: `Lantai ${r.fl} Clear`, ex: leaderEx, cardSub: `${p.name} mengalahkan ${r.mob.n}`,
        quote: [`*${p.name}* (${r.n} orang, rata-rata Lv.${r.avgLv}) vs *${r.mob.n}* (HP ${fmt(r.mob.hp)})`, ...steps, `${G.lion} *LANTAI ${r.fl} CLEAR!*`],
        rows: lines.map(l => ['•', l]), tail: [tk, `${G.falcon} Lanjut ke *lantai ${p.floor}* (cooldown 5 menit)`], log: steps.map(s => s.replace(/^[^\w]+/, '')), mentions: p.members,
        chips: [{ l: 'Lantai', v: `${r.fl} clear`, c: GREEN }, { l: 'Anggota', v: `${r.n} orang`, c: BLUE }, { l: 'Pukulan akhir', v: nm(r.killer), c: GOLD }] })
    }
  },
}
