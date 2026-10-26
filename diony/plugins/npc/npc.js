/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// NPC: ngobrol dengan karakter AI, sistem hubungan (affinity), hadiah dari inventory RPG
const ai = require('../../lib/ai'), { B } = require('../../lib/style')
const card = require('../../lib/rpgcard')
const ND = require('../../lib/npcdata')
const NDB = require('../../lib/npcdb')
const RPG = require('../../lib/rpg')
const D = RPG.D

const hearts = (idx) => '✦'.repeat(idx) + '◦'.repeat(NDB.LEVELS.length - 1 - idx)
const itemLabel = (id) => D.ITEMS[id] ? D.ITEMS[id].n : id

function dailyContext(n, jid) {
  const D = require('../../lib/daily'), P = require('../../lib/profiledb'), t = D.now(), o = { y: t.y, m: t.m, d: t.d }
  const base = `Waktu sekarang (${D.tzOf()}): ${D.DAYS[t.dow]}, ${t.d} ${D.MONTHS[t.m - 1]} ${t.y}, pukul ${D.pad(t.hh)}:${D.pad(t.mm)}. Hijriah: ${D.hijri(o).text}. Pasaran: ${D.pasaranOf(o)}.`
  if (n.id === 'chrona') return '\n' + base + ' Libur terdekat: ' + D.nextHolidays(o, 3).map(h => `${h.d} ${D.MONTHS[h.m - 1]} ${h.n} (${h.in} hari lagi)`).join('; ') + '.'
  if (n.id === 'bilal') { const c = D.findCity(P.get(jid).city || 'jakarta'); if (!c) return '\n' + base; const p = D.prayerTimes(o, c.lat, c.lng, c.tz); return '\n' + base + ` Jadwal salat ${c.name} hari ini: Subuh ${D.hm(p.subuh)}, Dzuhur ${D.hm(p.dzuhur)}, Ashar ${D.hm(p.ashar)}, Maghrib ${D.hm(p.maghrib)}, Isya ${D.hm(p.isya)}.` }
  return '\n' + base
}
function npcSystem(n, rel, pushname, ru, jid) {
  let ctx = ''
  if (['chrona', 'bilal', 'alma', 'kumo'].includes(n.id)) ctx += dailyContext(n, jid)
  if (n.service && !ru) ctx += `\nLayananmu yang bisa dipakai pemain: ${n.service}. Arahkan ke perintah itu bila relevan.`
  if (ru) {
    const s = RPG.stats(ru), c = D.CLASSES[ru.cls]
    ctx = `\nPemain juga petualang di dunia "Chisa AI RPG": ${c.name} Lv.${ru.level}, rank ${RPG.rankOf(ru.level).tier}, gold ${RPG.fmt(ru.gold)}, power ${RPG.fmt(s.power)}.${n.service ? ` Layananmu: ${n.service}. Arahkan pemain ke perintah itu bila relevan, jangan mengarang layanan lain.` : ''}`
  }
  return `${n.persona}\n${ND.BASE_RULES}\nNama pemain: ${pushname}. Tingkat hubunganmu: ${rel.name} (${rel.pts} poin) — sikapmu ${rel.tone}.${ctx}`
}

async function cardOf(n, jid) {
  const r = NDB.get(jid, n.id), prev = NDB.LEVELS[r.idx].min
  return card.npcCard({ id: n.id, name: n.name, title: n.title, group: n.group, color: n.color, desc: n.desc, idx: r.idx, levelName: r.name, pts: r.pts, prevMin: prev, next: r.next, maxIdx: NDB.LEVELS.length - 1, likes: n.likes.map(itemLabel), service: n.service })
}
// hadiah naik level (gold hanya jika pemain punya karakter RPG)
function levelReward(jid, n, up) {
  const ru = RPG.get(jid); if (!ru) return `\n💖 Hubungan dengan ${n.name} naik: *${NDB.LEVELS[up].name}*!`
  const g = 300 * up; ru.gold += g; let t = `\n💖 Hubungan dengan ${n.name} naik menjadi *${NDB.LEVELS[up].name}*! Hadiah: +${RPG.fmt(g)} gold`
  if (up === NDB.LEVELS.length - 1) { RPG.give(ru, 'summon_ticket', 2); t += ' +2 tiket summon' }
  RPG.save(); return t
}

module.exports = {
  name: 'npc',
  alias: ['npclist', 'daftarnpc', 'talk', 'chat', 'bicara', 'npcreset', 'resetnpc', 'gift', 'kasih', 'bond', 'hubungan', 'relasi', ...ND.NPCS.map(n => n.id)],
  category: 'npc',
  cmds: ['npc', 'talk', 'gift', 'bond', 'npcreset'],
  desc: '23 NPC yang bisa diajak ngobrol (AI), punya hubungan & hadiah',
  run: async (ctx) => {
    const { sock, m, command, args, text, prefix, reply, pushname } = ctx
    const jid = m.sender, npcById = ND.byId[command]

    // daftar / pilih NPC
    if (['npc', 'npclist', 'daftarnpc'].includes(command)) {
      const n = args[0] ? ND.find(args[0]) : null
      if (args[0] && !n) return reply(`NPC "${args[0]}" tidak ditemukan. Ketik ${prefix}npc untuk daftar.`)
      if (n) {
        NDB.setActive(jid, n.id); const r = NDB.get(jid, n.id)
        const img = await cardOf(n, jid)
        return sock.sendMessage(m.chat, { image: img, caption: `*${n.name}* — ${n.title}\n${hearts(r.idx)} ${r.name}\n\n"${n.greet}"\n\n_${n.name} sekarang jadi lawan bicaramu. Ketik ${prefix}talk <pesan> atau ${prefix}${n.id} <pesan>._` }, { quoted: m })
      }
      const act = NDB.getActive(jid), line = (n, i) => `${i + 1}. *${n.name}* — ${n.title}${act === n.id ? ' (aktif)' : ''}\n    _${prefix}${n.id}_`
      const G = [['umum', 'NGOBROL & BANTUAN'], ['harian', 'KEHIDUPAN SEHARI-HARI'], ['kota', 'KOTA GUILD (layanan RPG)']]; let k = 0
      const body = G.map(([g, label]) => `✦ ${B(label)}\n` + ND.NPCS.filter(n => n.group === g).map(n => line(n, k++)).join('\n')).join('\n\n')
      return reply(`${B('DAFTAR NPC')} (${ND.NPCS.length})\n━━━━━━━━━━━━━━━━━━━━\n\n${body}\n\n_Pilih:_ ${prefix}npc <nama/nomor>\n_Ngobrol:_ ${prefix}talk <pesan>  atau  ${prefix}<nama> <pesan>\n_Hubungan:_ ${prefix}bond  |  _Hadiah:_ ${prefix}gift <npc> <item>`)
    }

    if (['npcreset', 'resetnpc'].includes(command)) {
      const n = ND.find(args[0]) || ND.byId[NDB.getActive(jid)]; if (!n) return reply(`Contoh: ${prefix}npcreset aiko`)
      ai.clear(`npc:${n.id}:${jid}`); return reply(`Ingatan percakapan dengan ${n.name} dihapus (hubungan tetap tersimpan).`)
    }

    if (['bond', 'hubungan', 'relasi'].includes(command)) {
      const list = NDB.all(jid); if (!list.length) return reply(`Kamu belum punya hubungan dengan NPC mana pun. Mulai: ${prefix}npc`)
      return reply(`${B('HUBUNGAN NPC KAMU')}\n\n` + list.slice(0, 12).map(x => { const n = ND.byId[x.id]; return `${hearts(x.idx)}  *${n.name}* — ${NDB.LEVELS[x.idx].name} (${x.pts})` }).join('\n') + `\n\n_Naik level hubungan memberi hadiah gold, dan NPC kota memberi bonus layanan._`)
    }

    if (['gift', 'kasih'].includes(command)) {
      const n = ND.find(args[0]); if (!n) return reply(`Contoh: ${prefix}gift gorun iron_ore 5\nBeri barang dari inventory RPG ke NPC untuk menambah hubungan. Tiap NPC punya barang kesukaan (lihat ${prefix}npc <nama>).`)
      const u = RPG.get(jid); if (!u) return reply(`Kamu butuh karakter RPG untuk memberi hadiah. Ketik ${prefix}rpgstart`)
      const q = String(args[1] || '').toLowerCase().replace(/\s+/g, '_'), id = D.ITEMS[q] ? q : Object.keys(D.ITEMS).find(k => D.ITEMS[k].n.toLowerCase().replace(/\s+/g, '_') === q)
      const qty = Math.max(1, Math.min(50, parseInt(args[2]) || 1))
      if (!id || !RPG.has(u, id, 1)) return reply(`Kamu tidak punya item itu. Cek ${prefix}inv`)
      if (['weapon', 'armor', 'acc'].includes(D.ITEMS[id].type)) return reply('Equipment tidak bisa dijadikan hadiah.')
      const use = Math.min(qty, u.inv[id]), love = n.likes.includes(id), per = Math.max(1, Math.floor((D.ITEMS[id].price || 20) / 40)) * (love ? 3 : 1)
      const r = NDB.add(jid, n.id, per * use, 'g')
      if (!r.gained) return reply(`${n.name} sudah menerima banyak hadiah hari ini. Coba lagi besok.`)
      const used = Math.min(use, Math.max(1, Math.ceil(r.gained / per))); RPG.take(u, id, used); RPG.save()
      const now = NDB.get(jid, n.id)
      return reply(`🎁 Kamu memberi ${D.ITEMS[id].e} ${D.ITEMS[id].n} x${used} kepada *${n.name}*.\n${love ? '"Wah, ini kesukaanku! Terima kasih banyak!"' : '"Terima kasih, aku hargai ini."'}\n💗 +${r.gained} hubungan (${now.pts}${now.next ? '/' + now.next : ''}) — ${hearts(now.idx)} ${now.name}${r.up ? levelReward(jid, n, r.up) : ''}`)
    }

    // ── NGOBROL ── (.talk / .chat / .bicara => NPC aktif; .<id> => langsung)
    let n = npcById
    if (!n) { n = ND.byId[NDB.getActive(jid)]; if (!n) return reply(`Pilih lawan bicara dulu: ${prefix}npc  (lalu ${prefix}npc aiko)`) }
    if (!text) { NDB.setActive(jid, n.id); const r = NDB.get(jid, n.id); return reply(`*${n.name}* — ${n.title}\n${hearts(r.idx)} ${r.name}\n\n"${n.greet}"\n\n_Ketik ${prefix}${n.id} <pesan> untuk ngobrol._`) }
    NDB.setActive(jid, n.id)
    const rel = NDB.get(jid, n.id), ru = RPG.get(jid)
    await sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
    let out, offline = false
    try { out = (await ai.ask({ uid: `npc:${n.id}:${jid}`, text, noPersona: true, sys: npcSystem(n, rel, pushname, ru, jid) })).text }
    catch (e) { console.log('[npc]', e.message, e.details || ''); out = n.offline[Math.floor(Math.random() * n.offline.length)]; offline = true }
    const gain = offline ? { gained: 0 } : NDB.add(jid, n.id, 2)
    const now = NDB.get(jid, n.id)
    return reply(`*${n.name}* ${hearts(now.idx)}\n${out}${gain.gained ? `\n\n_+${gain.gained} hubungan_` : ''}${gain.up ? levelReward(jid, n, gain.up) : ''}`)
  },
}
