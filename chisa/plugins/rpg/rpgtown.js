/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KOTA GUILD: layanan NPC — tempa, pedagang harian, berkah, bounty, ramalan, kedai, bestiary
const { R, need, itemName } = require('../../lib/rpgctx')
const NDB = require('../../lib/npcdb')
const ND = require('../../lib/npcdata')
const D = R.D
const { B } = require('../../lib/style')

// tambah hubungan karena memakai layanan; kembalikan teks level-up bila ada
function bump(jid, id, n = 3) {
  const r = NDB.add(jid, id, n); if (!r.up) return ''
  const u = R.get(jid), g = 300 * r.up; u.gold += g; let t = `\n💖 Hubungan dengan ${ND.byId[id].name} naik menjadi *${NDB.LEVELS[r.up].name}*! +${R.fmt(g)} gold`
  if (r.up === NDB.LEVELS.length - 1) { R.give(u, 'summon_ticket', 2); t += ' +2 tiket summon' }
  return t
}
const hearts = (i) => '✦'.repeat(i) + '◦'.repeat(NDB.LEVELS.length - 1 - i)

// RNG harian (sama untuk semua pemain)
function rng(seedStr) { let h = 1779033703; for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) } let a = h >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const POOL = ['hp_potion2', 'hp_potion3', 'mp_potion2', 'summon_ticket', 'crystal', 'gold_ore', 'mythril', 'dragon_scale', 'dark_essence', 'lucky_ring', 'power_amulet', 'iron_ore', 'herb', 'rare_fish', 'fire_core', 'ice_core', 'frost_fang', 'orc_tusk']
function stockToday() {
  const r = rng('mimi-' + R.today()), ids = [...POOL].sort(() => r() - 0.5).slice(0, 5)
  return ids.map(id => ({ id, mult: 0.55 + r() * 0.3, stock: id === 'summon_ticket' || id === 'hp_potion3' ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 4) }))
}

const RATES = [100, 95, 90, 80, 70, 60, 50, 40, 30, 20]
const enhCost = (n, aff) => ({ gold: Math.floor(200 * (n + 1) ** 2 * (1 - 0.04 * aff)), mats: { iron_ore: (n + 1) * 3, ...(n >= 4 ? { crystal: n - 2 } : {}), ...(n >= 7 ? { mythril: n - 6 } : {}) } })

const LORE = {
  forest: 'Hutan tertua di kerajaan. Para petualang pemula berlatih di sini, tapi legenda mengatakan Raja Goblin menyimpan mahkota tua yang dulu milik raja manusia.',
  cave: 'Gua yang dindingnya dipenuhi kristal berdenyut. Kelelawar raksasa menjaga lorongnya, dan Sang Ratu Kristal konon tidur di jantung gua.',
  fortress: 'Benteng yang direbut klan Orc setelah perang seratus tahun. Panglima mereka menempa kapak dari besi yang diambil dari baju zirah para ksatria.',
  frost: 'Puncak yang tak pernah mencair. Serigala es berburu dalam kabut, dan di puncaknya Naga Es mendengkur, membekukan langit di sekitarnya.',
  dragon: 'Kawah vulkanik tempat naga-naga kuno bersarang. Sisik mereka lebih keras dari baja, dan hati naga dikabarkan bisa menghidupkan yang hampir mati.',
  demon: 'Kastil hitam yang muncul dari retakan bumi. Raja Iblis memerintah dari singgasana tulang, dikawal ksatria maut yang tak mengenal lelah.',
  abyss: 'Jurang tanpa dasar tempat realitas retak. Hanya pahlawan terkuat yang kembali dari sini, dan mereka bercerita tentang Dewa Kehancuran yang menunggu.',
}
const TIPS = [
  'Dungeon boss tiap 5 lantai: bawa banyak HP Potion dan jangan lupa .rest.', 'Bahan dari .mine sangat berguna untuk .craft dan .enhance, jangan dijual semua.',
  'Hadiah ke NPC yang mereka sukai memberi 3x poin hubungan. Cek .npc <nama>.', 'Companion bertipe EXP bagus untuk leveling, tipe ATK bagus untuk boss.',
  'World boss membagi hadiah sesuai damage. Serang tiap 2 menit supaya masuk peringkat.', 'Clan level tinggi memberi bonus EXP dan gold ke semua anggotanya.',
  '.daily berturut-turut menambah bonus streak sampai +50%.', 'Berkah Elaine +20% EXP selama 30 menit sangat berguna sebelum farming panjang.',
  'Ramalan Madam Zora memberi bonus gold dan EXP seharian penuh, ambil tiap hari.', 'Tempa senjata sampai +5 dulu; setelah itu peluang gagal naik, simpan bahan crystal.',
  'Bounty Rin hadiahnya jauh lebih besar dari berburu biasa. Ambil yang monsternya sering kamu temui.', 'Class Priest memulihkan HP saat memakai skill, cocok untuk dungeon panjang.',
  'Stat INT menaikkan MP; Mage dan Priest paling terbantu.', 'Jangan gunakan semua stat point ke satu stat; DEF juga menaikkan HP maksimum.',
  'Mimi menjual Summon Ticket diskon kalau beruntung. Cek .merchant tiap hari.', 'Pedagang dan pandai besi lebih murah kalau hubunganmu dengan mereka tinggi.',
  'Bestiary mencatat tiap monster. Milestone 10/50/100/250 kill memberi gold, 100 kill memberi tiket summon.', 'Craft Frostbite Edge butuh Frost Fang dan Ice Core dari Puncak Beku.',
]

module.exports = {
  name: 'town', menuCat: 'kota',
  alias: ['kota', 'smith', 'tempa', 'merchant', 'pedagang', 'mbuy', 'blessing', 'berkah', 'bounty', 'fortune', 'ramalan', 'rumor', 'gamble', 'dice', 'bestiary', 'lore'],
  category: 'rpg',
  cmds: ['town', 'smith', 'merchant', 'mbuy', 'blessing', 'bounty', 'fortune', 'rumor', 'gamble', 'bestiary', 'lore'],
  desc: 'Kota Guild: tempa, pedagang, berkah, bounty, ramalan, kedai, bestiary',
  run: async (ctx) => {
    const { command, args, prefix, reply, m } = ctx
    const u = need(ctx); if (!u) return
    const jid = m.sender, aff = (id) => NDB.lv(jid, id), s = R.stats(u)

    if (['town', 'kota'].includes(command)) {
      return reply(`✦ ${B('KOTA GUILD')}\n━━━━━━━━━━━━━━━━━━━━\n\n` + ND.NPCS.filter(n => n.group === 'kota').map(n => `*${n.name}* — ${n.title}\n   ${hearts(aff(n.id))} ${NDB.get(jid, n.id).name}\n   ${n.service}`).join('\n\n') + `\n\n_Ngobrol dengan mereka: ${prefix}<nama> <pesan>  (mis. ${prefix}gorun)_\n_Hadiah menaikkan hubungan: ${prefix}gift <npc> <item>_`)
    }

    // ── GORUN: tempa ──
    if (['smith', 'tempa', 'enhance'].includes(command)) {
      const a = aff('gorun'), slotMap = { weapon: 'weapon', senjata: 'weapon', armor: 'armor', baju: 'armor', acc: 'acc', aksesori: 'acc' }
      const slot = slotMap[(args[0] || '').toLowerCase()]
      u.enhLv = u.enhLv || {}
      if (command !== 'enhance' || !slot) {
        const rows = ['weapon', 'armor', 'acc'].map(k => { const id = u.eq[k]; if (!id) return `${k}: -`; const n = u.enhLv[id] || 0, c = enhCost(n, a), rate = Math.min(100, RATES[n] + a * 2); return n >= 10 ? `${itemName(id)} +10 (MAX)` : `${itemName(id)} *+${n}* → +${n + 1}\n    ${R.fmt(c.gold)}g + ${Object.entries(c.mats).map(([i, q]) => `${D.ITEMS[i].n} x${q}`).join(', ')} • peluang ${rate}%` })
        return reply(`🔨 *PANDAI BESI GORUN* ${hearts(a)}\n"${a >= 3 ? 'Kawan lama! Aku kasih harga bagus.' : 'Bawa bahan, aku tempa jadi legenda!'}"\n\n${rows.join('\n')}\n\nTempa: ${prefix}enhance weapon|armor|acc\nTiap +1 menambah 10% stat dasar item. Gagal = bahan hangus, item aman.`)
      }
      const id = u.eq[slot]; if (!id) return reply('Slot itu kosong. Pasang item dulu (.equip).')
      const it = D.ITEMS[id]; if (!(it.atk || it.def || it.hp)) return reply(`${it.n} tidak bisa ditempa (tidak punya stat dasar).`)
      const n = u.enhLv[id] || 0; if (n >= 10) return reply('Item sudah +10, batas tertinggi!')
      const c = enhCost(n, a), miss = Object.entries(c.mats).filter(([i, q]) => (u.inv[i] || 0) < q)
      if (u.gold < c.gold || miss.length) return reply(`❌ Kurang:\n${u.gold < c.gold ? `• Gold ${R.fmt(u.gold)}/${R.fmt(c.gold)}\n` : ''}${miss.map(([i, q]) => `• ${D.ITEMS[i].n} ${u.inv[i] || 0}/${q}`).join('\n')}`)
      u.gold -= c.gold; for (const [i, q] of Object.entries(c.mats)) R.take(u, i, q)
      const rate = Math.min(100, RATES[n] + a * 2 + (u.enhPity || 0) * 5), ok = Math.random() * 100 < rate
      let t
      if (ok) { u.enhLv[id] = n + 1; u.enhPity = 0; t = `✨ *TEMPA BERHASIL!* ${itemName(id)} sekarang *+${n + 1}* (+${(n + 1) * 10}% stat)\n"Hahaha! Lihat kilaunya!"` }
      else { u.enhPity = (u.enhPity || 0) + 1; t = `💥 *TEMPA GAGAL.* Bahan hangus, ${itemName(id)} tetap +${n}.\n"Tenang, besi itu keras kepala. Coba lagi!" (+5% peluang di percobaan berikutnya)` }
      t += bump(jid, 'gorun'); R.save(); return reply(t)
    }

    // ── MIMI: pedagang ──
    if (['merchant', 'pedagang', 'mbuy'].includes(command)) {
      const a = aff('mimi'), st = stockToday(), disc = 1 - 0.03 * a
      if (!u.merch || u.merch.day !== R.today()) u.merch = { day: R.today(), bought: {} }
      const price = (x) => Math.max(1, Math.floor(D.ITEMS[x.id].price * x.mult * disc))
      if (command !== 'mbuy') {
        return reply(`🛍️ *PEDAGANG MIMI* ${hearts(a)}\n"Stok spesial hari ini, diskon sampai ${Math.round((1 - 0.55 * disc) * 100)}%!"\n\n` + st.map((x, i) => { const left = x.stock - (u.merch.bought[x.id] || 0); return `${i + 1}. ${itemName(x.id)} — *${R.fmt(price(x))}g* ${left > 0 ? `(stok ${left})` : '(habis)'}\n    normal ${R.fmt(D.ITEMS[x.id].price)}g` }).join('\n') + `\n\nBeli: ${prefix}mbuy <no> [jumlah]\nGold kamu: ${R.fmt(u.gold)}`)
      }
      const x = st[(parseInt(args[0]) || 0) - 1]; if (!x) return reply(`Contoh: ${prefix}mbuy 2 3  (lihat nomor di ${prefix}merchant)`)
      const left = x.stock - (u.merch.bought[x.id] || 0), q = Math.max(1, Math.min(left, parseInt(args[1]) || 1))
      if (left <= 0) return reply('Stok barang itu habis hari ini.')
      const cost = price(x) * q; if (u.gold < cost) return reply(`Gold kurang. Butuh ${R.fmt(cost)}.`)
      u.gold -= cost; R.give(u, x.id, q); u.merch.bought[x.id] = (u.merch.bought[x.id] || 0) + q
      const t = `🛍️ Membeli ${itemName(x.id)} x${q} seharga ${R.fmt(cost)}g.\n"Terima kasih banyak~ Datang lagi besok!"` + bump(jid, 'mimi', 2); R.save(); return reply(t)
    }

    // ── ELAINE: berkah ──
    if (['blessing', 'berkah'].includes(command)) {
      const a = aff('elaine'), mult = 1 - 0.04 * a, now = Date.now(); u.buff = u.buff || {}
      const T = { exp: ['EXP +20%', 60], atk: ['ATK +15%', 50], def: ['DEF +15%', 50] }, type = (args[0] || '').toLowerCase()
      const left = (k) => u.buff[k] > now ? `aktif ${R.dur(Math.ceil((u.buff[k] - now) / 1000))}` : 'tidak aktif'
      if (!T[type]) return reply(`⛪ *SUSTER ELAINE* ${hearts(a)}\n"Semoga cahaya melindungimu."\n\n` + Object.entries(T).map(([k, [l, p]]) => `*${k}* — ${l} (30 menit)\n   ${R.fmt(Math.floor(p * u.level * mult))}g • ${left(k)}`).join('\n\n') + `\n\nTerima: ${prefix}blessing exp|atk|def`)
      const cost = Math.floor(T[type][1] * u.level * mult); if (u.gold < cost) return reply(`Persembahan kurang. Butuh ${R.fmt(cost)} gold.`)
      u.gold -= cost; u.buff[type] = Math.max(now, u.buff[type] || 0) + 30 * 60000
      const t = `⛪ Berkah *${T[type][0]}* diberikan selama 30 menit.\n"Pergilah dengan tenang, petualang."` + bump(jid, 'elaine'); R.save(); return reply(t)
    }

    // ── RIN: bounty ──
    if (command === 'bounty') {
      const a = aff('rin'), sub = (args[0] || '').toLowerCase()
      let b = R.bounty(u)
      if (sub === 'cancel') { u.bounty = null; R.save(); return reply('Bounty dibatalkan. Ambil yang baru dengan .bounty') }
      if (sub === 'claim') {
        if (!b) return reply(`Belum ada bounty. Ketik ${prefix}bounty`)
        if (b.have < b.need) return reply(`Bounty belum selesai: ${b.have}/${b.need} ${b.mob}.`)
        const g = R.addGold(u, b.g), ex = R.addExp(u, b.x), tk = b.ticket; if (tk) R.give(u, 'summon_ticket')
        const bn = b.mob; u.bounty = null; const bt = bump(jid, 'rin', 5); R.save()
        const UI = require('../../lib/rpgui')
        return UI.send(ctx, u, { glyph: UI.G.owl, title: 'Bounty Selesai', sub: bn, cardSub: `Bounty ${bn} dituntaskan`, tone: 'win', headline: 'Bounty Selesai', ex, log: [`Bounty ${bn} dituntaskan`, 'Kerja bagus! Guild bangga padamu!'],
          quote: ['"Kerja bagus! Guild bangga padamu!"'], rows: [['GOLD', `+${R.fmt(g)}`], ['EXP', `+${R.fmt(ex.amt)}`], tk && ['BONUS', 'Summon Ticket x1']], tail: bt.split('\n').map(x => x.trim()).filter(Boolean),
          chips: [{ l: 'Gold', v: `+${R.fmt(g)}`, c: '#fbbf24' }, { l: 'EXP', v: `+${R.fmt(ex.amt)}`, c: '#fbbf24' }, tk ? { l: 'Bonus', v: 'Summon Ticket', c: '#34d399' } : { l: 'Target', v: bn, c: '#38bdf8' }] })
      }
      if (!b) { b = R.newBounty(u, a); R.save() }
      return reply(`📋 *BOUNTY GUILD* ${hearts(a)}\n"${a >= 2 ? 'Spesial untukmu, kutaruh yang bagus.' : 'Ada permintaan baru dari warga!'}"\n\nBuru: ${b.e} *${b.mob}* x${b.need}\nProgres: ${R.bar(b.have, b.need, 10)} ${b.have}/${b.need}\nHadiah: ${R.fmt(b.g)}g + ${R.fmt(b.x)} EXP${b.ticket ? ' + 🎟️' : ''}\nBatas: ${R.dur(Math.max(1, Math.ceil((b.until - Date.now()) / 1000)))}\n\nBerburu lewat ${prefix}hunt / ${prefix}dungeon, lalu ${prefix}bounty claim`)
    }

    // ── ZORA: ramalan ──
    if (['fortune', 'ramalan'].includes(command)) {
      const a = aff('zora')
      if (u.fortune && u.fortune.day === R.today()) { const f = u.fortune; return reply(`🔮 Ramalan hari ini sudah dibaca:\n*${f.n}*\nBonus aktif: gold +${f.gold}%, EXP +${f.exp}%\n"${f.txt}"`) }
      const ws = R.FORTUNES.map((f, i) => f.w * (i < 2 ? 1 + a * 0.35 : 1)), tot = ws.reduce((x, y) => x + y, 0); let r = Math.random() * tot, idx = 0
      for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) { idx = i; break } }
      const f = R.FORTUNES[idx], lucky = { warna: R.pick(['merah', 'biru', 'hijau', 'emas', 'ungu', 'putih']), angka: R.rnd(1, 99), item: itemName(R.pick(['hp_potion', 'crystal', 'herb', 'iron_ore', 'rare_fish'])) }
      u.fortune = { day: R.today(), n: f.n, gold: f.gold, exp: f.exp, txt: f.txt }
      const t = `🔮 *MADAM ZORA* ${hearts(a)}\n"Kartu-kartu telah berbicara..."\n\n*${f.n}*\n${f.txt}\n\nBonus seharian: gold +${f.gold}%, EXP +${f.exp}%\nWarna: ${lucky.warna} • Angka: ${lucky.angka} • Benda: ${lucky.item}\n_(ramalan hanya hiburan)_` + bump(jid, 'zora'); R.save(); return reply(t)
    }

    // ── JACK: kedai ──
    if (command === 'rumor') {
      if (u.gold < 50) return reply('Jack: "Kabar angin butuh 50 gold, Kawan."')
      u.gold -= 50; let tip = R.pick(TIPS); const roll = Math.random()
      if (roll < 0.25 && R.db.boss) tip = R.db.boss.dead ? 'Dengar-dengar world boss baru saja tumbang. Tunggu sampai ia bangkit lagi.' : `Kabarnya ${R.db.boss.n} masih mengamuk dengan sisa ${(R.db.boss.hp / R.db.boss.maxhp * 100).toFixed(0)}% nyawa. Cek .worldboss!`
      else if (roll < 0.4) { const top = R.allUsers().sort((x, y) => y.level - x.level)[0]; if (top) tip = `Petualang paling kuat saat ini katanya ${top.name}, sudah Lv.${top.level}. Siapa yang berani menantangnya?` }
      const t = `🍺 *JACK BERBISIK*\n"${tip}"\n\n_(-50 gold)_` + bump(jid, 'jack', 2); R.save(); return reply(t)
    }
    if (['gamble', 'dice'].includes(command)) {
      const a = aff('jack'), max = 3000 + u.level * 200, bet = (args[0] || '').toLowerCase() === 'all' ? Math.min(u.gold, max) : parseInt(args[0])
      if (!bet || bet < 10) return reply(`🎲 *DADU JACK* ${hearts(a)}\n"Taruhan gold, bukan nyawa!"\n\nMenang 1:1 (peluang ${44 + a}%), jackpot 5x (2%).\nContoh: ${prefix}gamble 100  (min 10, maks ${R.fmt(max)})`)
      if (bet > u.gold) return reply('Gold kamu tidak cukup.'); if (bet > max) return reply(`Taruhan maksimal ${R.fmt(max)} gold untukmu.`)
      const left = R.cooldown(u, 'gamble', 6); if (left) return reply(`Jack: "Tenang dulu, tunggu ${R.dur(left)}."`)
      const r = Math.random() * 100, d = () => 1 + Math.floor(Math.random() * 6), mine = d() + d(), his = d() + d()
      let t = `🎲 Kamu: *${mine}*   vs   Jack: *${his}*\n`
      if (r < 2) { u.gold += bet * 4; t += `🎰 *JACKPOT!* Dadu emas! +${R.fmt(bet * 4)} gold` }
      else if (r < 44 + a) { u.gold += bet; t += `✅ Kamu menang! +${R.fmt(bet)} gold\n"Hah, beruntung kau!"` }
      else { u.gold -= bet; t += `❌ Kamu kalah. -${R.fmt(bet)} gold\n"Rumah selalu... hampir selalu menang."` }
      t += `\n💰 Gold: ${R.fmt(u.gold)}` + bump(jid, 'jack', 1); R.save(); return reply(t)
    }

    // ── NOA: bestiary ──
    if (command === 'bestiary') {
      u.best = u.best || {}; const a = aff('noa'); let seen = 0, total = 0
      const body = D.ZONES.map(z => { const rows = [...z.mobs, z.boss].map(mb => { total++; const k = u.best[mb.n] || 0; if (k) seen++; const nx = R.MILESTONES.find(x => k < x); return `${k ? mb.e : '❔'} ${k ? mb.n : '???'}${k ? ` — ${k} kill${nx ? ` (→${nx})` : ' ★'}` : ''}` }); return `*${z.emoji} ${z.name}*\n${rows.join('\n')}` }).join('\n\n')
      return reply(`📖 *BESTIARY — Arsiparis Noa* ${hearts(a)}\nTercatat: ${seen}/${total} monster\n\n${body}\n\nMilestone 10/50/100/250 kill = hadiah gold (100 kill = tiket summon).\nLore zona: ${prefix}lore <forest|cave|fortress|frost|dragon|demon|abyss>`)
    }
    if (command === 'lore') {
      const z = D.ZONES.find(x => x.id === (args[0] || '').toLowerCase())
      if (!z) return reply(`Zona: ${D.ZONES.map(x => x.id).join(', ')}\nContoh: ${prefix}lore dragon`)
      const t = `📜 *${z.emoji} ${z.name}* (Lv.${z.min}+)\n\n"${LORE[z.id]}"\n\nMonster: ${z.mobs.map(x => x.e + ' ' + x.n).join(', ')}\nBos: ${z.boss.e} ${z.boss.n}\n— Noa, Arsiparis` + bump(jid, 'noa', 1); R.save(); return reply(t)
    }
  },
}
