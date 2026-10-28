/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// RPG INTI: daftar, profil, rank, stat, class
const { R, need, cardFor, clanInfo } = require('../../lib/rpgctx')
const D = R.D
const { B } = require('../../lib/style')
const UI = require('../../lib/rpgui'), { G, fmt } = UI

module.exports = {
  name: 'rpgstart',
  alias: ['daftarrpg', 'rpgdaftar', 'profil', 'me', 'rpgcard', 'rank', 'rankinfo', 'addstat', 'statpoint', 'changeclass', 'gantiklas', 'classlist', 'kelas', 'rpgmenu', 'rpg', 'resetrpg'],
  category: 'rpg',
  cmds: ['rpgstart', 'profil', 'rank', 'addstat', 'changeclass', 'classlist', 'rpgmenu'],
  menu: ['rpgstart','profil','rank','addstat','changeclass','classlist','rpgmenu','resetrpg'],
  desc: 'Daftar karakter, profil canvas, rank, stat point, ganti class',
  run: async (ctx) => {
    const { sock, m, command, args, prefix, reply, pushname, isCreator } = ctx
    const clsList = () => Object.entries(D.CLASSES).map(([k, c]) => `${G.lion} *${k}* — ${c.name}\n> ${c.desc}\n> Skill: _${c.skill}_\n\`\`\`HP ${c.hp}  STR ${c.str}  DEF ${c.def}  AGI ${c.agi}  INT ${c.int}\`\`\``).join('\n\n')

    if (['classlist', 'kelas'].includes(command)) return reply(`${G.eye} *DAFTAR CLASS*\n\n${clsList()}\n\n_Pilih: ${prefix}rpgstart <class>_`)

    if (['rpgstart', 'daftarrpg', 'rpgdaftar'].includes(command)) {
      if (R.get(m.sender)) return reply(`Kamu sudah terdaftar. Ketik *${prefix}profil* untuk lihat karakter.`)
      const cls = (args[0] || '').toLowerCase()
      if (!D.CLASSES[cls]) return reply(`${G.eye} *SELAMAT DATANG DI DUNIA ISEKAI*\n> Pilih class pertamamu:\n\n${clsList()}\n\n*Contoh:* \`${prefix}rpgstart swordsman\``)
      const u = R.create(m.sender, pushname, cls), c = D.CLASSES[cls]
      const img = await cardFor(sock, m.sender, u, u.name, 'GUILD CARD DIBUAT', 'Selamat datang, petualang!')
      return sock.sendMessage(m.chat, { image: img, caption: UI.compose({ glyph: G.ankh, title: 'Karakter Dibuat', sub: c.name, quote: [`Bekal: *500 gold*, 3 HP Potion, Wooden Sword`], rows: [['hunt', 'berburu monster'], ['daily', 'hadiah harian'], ['quest', 'misi harian'], ['rpgmenu', 'semua fitur RPG']].map(([k, v]) => [prefix + k, v]) }) }, { quoted: m })
    }

    if (['rpgmenu', 'rpg'].includes(command)) {
      return reply(`${B('CHISA AI RPG')}\n${B('ISEKAI ADVENTURE')}\n━━━━━━━━━━━━━━━━━━━━

✦ ${B("KARAKTER")}
${prefix}rpgstart • ${prefix}profil • ${prefix}rank • ${prefix}addstat • ${prefix}changeclass • ${prefix}classlist

✦ ${B("PETUALANGAN")}
${prefix}hunt • ${prefix}dungeon • ${prefix}explore • ${prefix}mine • ${prefix}fish • ${prefix}chop
${prefix}worldboss • ${prefix}attackboss

✦ ${B("PVP")}
${prefix}duel @user <taruhan> • ${prefix}arena

✦ ${B("EKONOMI")}
${prefix}daily • ${prefix}weekly • ${prefix}work • ${prefix}transfer
${prefix}shop • ${prefix}buy • ${prefix}sell • ${prefix}inv • ${prefix}use • ${prefix}equip • ${prefix}unequip • ${prefix}craft • ${prefix}heal

✦ ${B("COMPANION (GACHA)")}
${prefix}summon [1/10] • ${prefix}companion • ${prefix}setcompanion

✦ ${B("BUDAK & JINAK")}
${prefix}pasarbudak • ${prefix}budakku • ${prefix}jinakkan • ${prefix}skilljinak • ${prefix}ras
${prefix}pasangbudak • ${prefix}kerjasemua • ${prefix}rawat • ${prefix}latih • ${prefix}lepasbudak

✦ ${B("KOTA GUILD (NPC)")}
${prefix}town • ${prefix}smith • ${prefix}enhance • ${prefix}merchant • ${prefix}mbuy • ${prefix}blessing
${prefix}bounty • ${prefix}fortune • ${prefix}rumor • ${prefix}gamble • ${prefix}bestiary • ${prefix}lore
${prefix}guildmaster • ${prefix}npc (23 NPC bisa diajak ngobrol)

✦ ${B("CLAN")}
${prefix}clancreate • ${prefix}clanjoin • ${prefix}claninfo • ${prefix}clanlist • ${prefix}clandonate
${prefix}clanupgrade • ${prefix}clanwar • ${prefix}clankick • ${prefix}clanleave

✦ ${B("BANK, MASAK & EKSPEDISI")}
${prefix}bank • ${prefix}setor • ${prefix}tarikbank • ${prefix}cook • ${prefix}expedisi • ${prefix}klaimexp

✦ ${B("PARTY & RAID")}
${prefix}partycreate • ${prefix}partyinvite • ${prefix}partyjoin • ${prefix}partyinfo • ${prefix}partyleave • ${prefix}partykick • ${prefix}partyopen • ${prefix}partytop
${prefix}pdungeon (co-op) • ${prefix}clanraid • ${prefix}raidhit • ${prefix}raidtop

✦ ${B("SKILL, GELAR & REBIRTH")}
${prefix}skills • ${prefix}learn • ${prefix}skillreset • ${prefix}gelar • ${prefix}settitle • ${prefix}rebirth

✦ ${B("KEBUN, PASAR & JUDI")}
${prefix}kebun • ${prefix}tanam • ${prefix}panen • ${prefix}pasar • ${prefix}jualpasar • ${prefix}belipasar • ${prefix}batalpasar • ${prefix}pasarku
${prefix}coinflip • ${prefix}rpgslot • ${prefix}rob

✦ ${B("PENCAPAIAN")}
${prefix}achievement • ${prefix}claimach

✦ ${B("LAINNYA")}
${prefix}quest • ${prefix}claimquest • ${prefix}toprpg • ${prefix}topgold • ${prefix}topclan

_Tap tombol *Semua Menu RPG* di bawah, tidak perlu mengetik._`)
    }

    if (command === 'resetrpg') {
      if (!isCreator) return reply(global.mess.owner)
      const t = (m.msg?.contextInfo?.mentionedJid?.[0]) || m.quoted?.sender || (((args[0] || '').replace(/\D/g, '')) + '@s.whatsapp.net')
      if (!R.get(t)) return reply('User itu belum punya karakter.')
      delete R.db.users[t]; R.save(); return reply('♻️ Data RPG user dihapus.')
    }

    const u = need(ctx); if (!u) return

    if (['profile', 'profil', 'me', 'status', 'rpgcard'].includes(command)) {
      const s = R.stats(u), c = D.CLASSES[u.cls], r = R.rankOf(u.level), nr = R.nextRank(u.level)
      const img = await cardFor(sock, m.sender, u, u.name, 'ADVENTURER GUILD CARD', new Date().toLocaleDateString('id-ID', { timeZone: global.settingsDefault.timezone, day: 'numeric', month: 'short', year: 'numeric' }))
      const w = u.eq.weapon && D.ITEMS[u.eq.weapon], a = u.eq.armor && D.ITEMS[u.eq.armor], ac = u.eq.acc && D.ITEMS[u.eq.acc]
      const nm = (id) => id ? D.ITEMS[id].n : '-'
      return sock.sendMessage(m.chat, { image: img, caption: UI.compose({ glyph: G.eye, title: 'Profil Petualang', sub: u.name,
        quote: [`${c.name}  •  Rank *${r.tier}* (${r.name})${nr ? ` ➜ ${nr.tier} di Lv.${nr.min}` : ' • MAX'}`, !!(require('../../lib/rpgextra').titleOf(u) || u.rebirth) && `${require('../../lib/rpgextra').titleOf(u) ? 'Gelar: *' + require('../../lib/rpgextra').titleOf(u) + '*' : ''}${u.rebirth ? '  •  Rebirth *' + u.rebirth + 'x*' : ''}`, `Level *${u.level}*  •  Skill: ${c.skill}`],
        rows: [['STR', `${s.str}   (poin sisa ${u.pts})`], ['DEF', s.def], ['AGI', s.agi], ['INT', s.int], ['ATK', fmt(s.atk)], ['CRIT', `${s.crit.toFixed(1)}%`], ['BONUS', `EXP +${(((1 + s.expBonus / 100) * R.BOOST.exp - 1) * 100).toFixed(0)}%  Gold +${(((1 + s.goldBonus / 100) * R.BOOST.gold - 1) * 100).toFixed(0)}%`]],
        tail: [`${G.lion} Senjata  : ${nm(u.eq.weapon)}`, `${G.lion} Armor    : ${nm(u.eq.armor)}`, `${G.lion} Aksesori : ${nm(u.eq.acc)}`, `${G.ankh} Menang ${u.wins} • Kalah ${u.losses} • Kill ${fmt(u.kills)} • Lantai terbaik ${u.bestFloor}`] }) }, { quoted: m })
    }

    if (['rank', 'rankinfo'].includes(command)) {
      const cur = R.rankOf(u.level)
      return UI.say(ctx, { glyph: G.lion, title: 'Tangga Rank Guild', quote: D.RANKS.map(x => `${x.tier === cur.tier ? '◆' : '◇'} *${x.tier}*  ${x.name} — Lv.${x.min}+${x.tier === cur.tier ? '   ◄ kamu' : ''}`), tail: [`Kamu: Lv.${u.level} ➜ Rank *${cur.tier}* (${cur.name})`] })
    }

    if (['addstat', 'statpoint'].includes(command)) {
      const st = (args[0] || '').toLowerCase(), n = Math.max(1, parseInt(args[1]) || 1)
      if (!['str', 'def', 'agi', 'int'].includes(st)) return UI.say(ctx, { glyph: G.owl, title: 'Stat Point', quote: [`Poin tersisa: *${u.pts}*`], rows: [['str', 'serangan'], ['def', 'HP & pertahanan'], ['agi', 'kritikal & dodge'], ['int', 'MP & sihir']], hint: `Contoh: ${prefix}addstat str 3` })
      if (u.pts < n) return reply(`Poin tidak cukup (punya ${u.pts}).`)
      u.pts -= n; u.a[st] += n; R.save()
      return UI.say(ctx, { glyph: G.ankh, title: 'Stat Point', quote: [`*${st.toUpperCase()}* +${n}`, `Poin tersisa: *${u.pts}*`] })
    }

    if (['changeclass', 'gantiklas'].includes(command)) {
      const cls = (args[0] || '').toLowerCase(), cost = 2000 + u.level * 300
      if (!D.CLASSES[cls]) return reply(`Contoh: ${prefix}changeclass mage\nBiaya: ${R.fmt(cost)} gold (stat poin dikembalikan)\n\n` + Object.keys(D.CLASSES).join(', '))
      if (cls === u.cls) return reply('Kamu sudah memakai class itu.')
      if (u.gold < cost) return reply(`Butuh ${R.fmt(cost)} gold.`)
      u.gold -= cost; u.pts += u.a.str + u.a.def + u.a.agi + u.a.int; u.a = { str: 0, def: 0, agi: 0, int: 0 }; u.cls = cls
      const s = R.stats(u); u.hp = s.maxhp; u.mp = s.maxmp; R.save()
      return UI.say(ctx, { glyph: G.scarab, title: 'Ganti Class', sub: D.CLASSES[cls].name, quote: [`Class berubah menjadi *${D.CLASSES[cls].name}*`, `Stat point dikembalikan: *${u.pts}*`], hint: `Atur lagi dengan ${prefix}addstat` })
    }
  },
}
