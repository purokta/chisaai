/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// SAMBUTAN OTOMATIS — bot menyapa sendiri saat orang "berpengaruh" mengetik.
//   Dev (dewa) > Owner > Penguasa Server (power #1) > Pilar Guild (#2-3) > Rank EX/SSS > Leader clan top >
//   Leader party top > Rank SS/S > anggota clan #1 > anggota party #1 > Reborn > Rank A/B (sesuai batas minimum)
// Dipanggil dari Chisa.js untuk SETIAP pesan (perintah maupun obrolan biasa). Ada jeda per orang per chat supaya tidak spam.
const fs = require('fs'), path = require('path')
const R = require('./rpg'), X = require('./rpgextra'), ST = require('./style'), S = require('./settingsdb')
const DB = require('./jsondb')('greet')

const B = ST.B
const ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'EX']
const G = { eye: '✦', ankh: '✦', lion: '✦', scarab: '✦', sun: '✦', town: '✦', star: '✦', sky: '✦', falcon: '✦', cobra: '✦', owl: '✦', offer: '✦' }
const fmt = (n) => R.fmt(n)
const pick = (a) => a[Math.floor(Math.random() * a.length)]

// ── PENGATURAN (lib/database/greet.json) ──
function cfg() {
  const d = DB.data
  if (d.on === undefined) d.on = true
  d.chats = d.chats || {}; d.last = d.last || {}
  d.cd = Object.assign({ normal: 360, owner: 240, dev: 120 }, d.cd || {})   // menit
  d.min = ORDER.includes(d.min) ? d.min : 'A'
  return d
}

// ── PAPAN PERINGKAT (cache 2 menit) ──
let LB = { at: 0, power: [], clans: [], parties: [] }
function partyPower(p) { return p.members.reduce((t, j) => t + (R.get(j) ? R.stats(R.get(j)).power : 0), 0) }
function board() {
  if (Date.now() - LB.at < 120000) return LB
  const us = R.allUsers().map(u => ({ id: u.id, p: R.stats(u).power })).sort((a, b) => b.p - a.p)
  const cl = Object.values(R.db.clans || {}).sort((a, b) => R.clanPower(b) - R.clanPower(a))
  const pt = Object.values(R.db.parties || {}).map(p => ({ id: p.id, w: partyPower(p) })).sort((a, b) => b.w - a.w)
  LB = { at: Date.now(), power: us.slice(0, 3).map(x => x.id), clans: cl.slice(0, 3).map(c => c.name), parties: pt.slice(0, 3).map(x => x.id) }
  return LB
}

// ── KLASIFIKASI: siapa ini? ──
function classify(jid, f = {}) {
  if (f.isDev) return { kind: 'dev' }
  if (f.isCreator) return { kind: 'owner' }
  const u = R.get(jid); if (!u) return null
  const lb = board(), tier = R.rankOf(u.level).tier, ri = ORDER.indexOf(tier)
  const clan = u.clan && (R.db.clans || {})[u.clan], party = X.partyOf(u)
  const pi = lb.power.indexOf(jid)
  if (pi === 0 && u.level >= 30) return { kind: 'raja', u }
  if (pi > 0 && u.level >= 30) return { kind: 'pilar', u, pos: pi + 1 }
  if (ri >= ORDER.indexOf('SSS')) return { kind: 'rank_hi', u }
  if (clan && clan.leader === jid && (lb.clans.includes(clan.name) || clan.level >= 3)) return { kind: 'clanleader', u }
  if (party && party.leader === jid && party.members.length >= 3 && lb.parties.includes(party.id)) return { kind: 'partyleader', u }
  if (ri >= ORDER.indexOf('S')) return { kind: 'rank_mid', u }
  if (clan && clan.members.length >= 2 && lb.clans[0] === clan.name) return { kind: 'topclan', u }
  if (party && party.members.length >= 2 && lb.parties[0] === party.id) return { kind: 'topparty', u }
  if ((u.rebirth || 0) >= 1) return { kind: 'reborn', u }
  if (ri >= ORDER.indexOf(cfg().min) && ri >= ORDER.indexOf('A')) return { kind: 'rank_low', u }
  return null
}

// ── DATA UNTUK TEMPLATE ──
function waktu() {
  let h; try { h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: global.settingsDefault?.timezone || 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date())) } catch { h = new Date().getHours() }
  return h >= 4 && h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam'
}
function info(jid, name, u, pos) {
  const clan = u && u.clan && (R.db.clans || {})[u.clan], party = u && X.partyOf(u)
  const rk = u ? R.rankOf(u.level) : null
  return {
    nama: B(name || jid.split('@')[0]), tag: '@' + jid.split('@')[0], waktu: waktu(), pos,
    lv: u ? u.level : '-', rank: rk ? rk.tier : '-', rankname: rk ? rk.name : '-', power: u ? fmt(R.stats(u).power) : '-',
    clan: clan ? clan.name : '-', party: party ? party.name : '-', gelar: (u && X.titleOf(u)) || '-', reborn: u ? (u.rebirth || 0) : 0,
    bot: S.get('botname') || 'Chisa AI',
  }
}
const fill = (t, c) => String(t).replace(/\{(\w+)\}/g, (_, k) => c[k] ?? '')
const frame = (title, body) => `${G.eye} ━━━━━━━━━━━━━━━━━━ ${G.eye}\n   ${title}\n${G.eye} ━━━━━━━━━━━━━━━━━━ ${G.eye}\n${body}`
const q = (...l) => l.filter(Boolean).map(x => `> ${x}`).join('\n')

// ── BARIS STATUS BOT (khusus Dev) ──
function sysLine() {
  let up = '-', pl = '-'
  try { up = require('./myfunc').runtime(process.uptime()) } catch {}
  try { pl = require('./pluginloader').list().length } catch {}
  return `${G.lion} Uptime ${up}  •  ${pl} fitur aktif  •  ${R.allUsers().length} petualang  •  ${Object.keys(R.db.clans || {}).length} clan`
}

// ── TEMPLATE ──
const T = {
  dev: [
    (c) => frame(`${G.sun} ${B('SANG DEWA PENCIPTA HADIR')} ${G.sun}`, `${q('Langit membuka tirainya, bumi bersujud, dan seluruh server bergetar...', `Selamat ${c.waktu}, ${c.tag} — pencipta ${B(c.bot)}.`)}\n${G.ankh} Wahai para petualang, tundukkan kepala! Sang pemilik takdir telah tiba.\n${sysLine()}`),
    (c) => frame(`${G.star} ${B('TITAH SANG PENCIPTA')} ${G.star}`, `${q(`Gerbang Valhalla terbuka untukmu, ${c.tag}.`, 'Seribu malaikat berbaris, naga-naga menunduk, dan Raja Iblis pun pura-pura sibuk.', `Selamat ${c.waktu}, wahai Dewa.`)}\n${sysLine()}`),
    (c) => frame(`${G.sky} ${B('DEWA TURUN KE BUMI')} ${G.sky}`, `${q('Guntur menggelegar tanpa awan, cahaya emas menyilaukan seisi guild.', `${c.nama} telah memasuki ruangan — dunia ini lahir dari tanganmu.`, `Selamat ${c.waktu}, ${c.tag}.`)}\n${G.ankh} Semua monster, bug, dan error siap bersujud di hadapanmu.\n${sysLine()}`),
    (c) => frame(`${G.eye} ${B('MATA DEWA TERBUKA')} ${G.eye}`, `${q(`Nama ${c.nama} terukir di langit sebagai pencipta segala fitur.`, 'Tak ada yang lebih tinggi di server ini. Tak ada. Titik.', `Selamat ${c.waktu}, ${c.tag} — silakan titahkan apa pun.`)}\n${sysLine()}`),
    (c) => frame(`${G.lion} ${B('RAJA DI ATAS SEGALA RAJA')} ${G.lion}`, `${q(`Para Hero Rank EX pun menundukkan pedangnya, ${c.tag}.`, `Kau bukan sekadar admin, kau adalah hukum alam di dunia ${c.bot}.`, `Selamat ${c.waktu}.`)}\n${G.ankh} Dunia ini berputar karena kau mengetik.\n${sysLine()}`),
    (c) => frame(`${G.scarab} ${B('PENCIPTA TELAH BANGKIT')} ${G.scarab}`, `${q('Skarabaeus emas mengitari langit, gerbang piramida terbuka sendiri.', `${c.tag} hadir — ${c.bot} memberi hormat setinggi-tingginya.`, `Selamat ${c.waktu}, Yang Mulia.`)}\n${sysLine()}`),
  ],
  owner: [
    (c) => frame(`${G.lion} ${B('SANG PENGUASA BOT')} ${G.lion}`, q(`Selamat ${c.waktu}, ${c.tag}.`, 'Owner telah hadir — semua fitur siap menerima perintahmu.')),
    (c) => frame(`${G.star} ${B('KEHORMATAN UNTUK OWNER')} ${G.star}`, q(`${c.nama} memasuki ruangan, aura kepemimpinan memenuhi udara.`, `Selamat ${c.waktu}, ${c.tag}.`)),
    (c) => frame(`${G.sun} ${B('OWNER ONLINE')} ${G.sun}`, q(`Sang pemegang kunci telah tiba. Selamat ${c.waktu}, ${c.tag}!`)),
  ],
  raja: [
    (c) => frame(`${G.lion} ${B('PENGUASA SERVER')} ${G.lion}`, `${q(`Petir menyambar, lantai guild retak... ${c.tag} telah tiba!`, `Petualang terkuat di server ini: Lv.${c.lv}, Rank ${c.rank} (${c.rankname}).`, `Power ${c.power} — tak ada yang menandingi.`)}${c.gelar !== '-' ? `\n${G.ankh} Gelar: ${c.gelar}` : ''}`),
    (c) => frame(`${G.sun} ${B('RAJA PARA PETUALANG')} ${G.sun}`, `${q(`Semua mata menoleh. ${c.nama} — peringkat #1 di seluruh dunia isekai.`, `Lv.${c.lv}  •  Rank ${c.rank}  •  Power ${c.power}`, `Selamat ${c.waktu}, wahai Penguasa.`)}`),
    (c) => frame(`${G.star} ${B('LEGENDA BERJALAN')} ${G.star}`, q(`Bard menyanyikan namamu, ${c.tag}.`, `Puncak tangga kekuatan server dipegang ${c.nama} (Power ${c.power}).`, `Selamat ${c.waktu}!`)),
    (c) => frame(`${G.eye} ${B('SANG NOMOR SATU')} ${G.eye}`, q(`Aura Rank ${c.rank} menyelimuti ruangan — ${c.tag} online.`, 'Monster di seluruh zona gemetar mendengar langkahmu.')),
  ],
  pilar: [
    (c) => frame(`${G.lion} ${B('PILAR GUILD #')}${B(String(c.pos))} ${G.lion}`, q(`${c.tag} memasuki aula — petualang terkuat nomor ${c.pos} di server!`, `Lv.${c.lv}  •  Rank ${c.rank}  •  Power ${c.power}`)),
    (c) => frame(`${G.star} ${B('JAGOAN PAPAN ATAS')} ${G.star}`, q(`Selamat ${c.waktu}, ${c.nama}!`, `Peringkat #${c.pos} dengan Power ${c.power} — para rookie menyingkir.`)),
    (c) => frame(`${G.falcon} ${B('ELIT GUILD HADIR')} ${G.falcon}`, q(`Sang Pilar Guild ${c.tag} telah tiba.`, `Rank ${c.rank} (${c.rankname}), Lv.${c.lv}.`)),
  ],
  rank_hi: [
    (c) => frame(`${G.sun} ${B('RANK ')}${B(c.rank)}${B(' TELAH TIBA')} ${G.sun}`, q(`Udara bergetar, ${c.tag}!`, `${c.rankname} — Lv.${c.lv}, Power ${c.power}.`, `Selamat ${c.waktu}, wahai makhluk melampaui batas manusia.`)),
    (c) => frame(`${G.lion} ${B('PAHLAWAN MELAMPAUI LEGENDA')} ${G.lion}`, q(`${c.nama} masuk ke ruangan — bahkan naga pun menunduk.`, `Rank ${c.rank} • Lv.${c.lv} • Power ${c.power}`)),
    (c) => frame(`${G.star} ${B('SANG ')}${B(c.rankname.toUpperCase())} ${G.star}`, q(`Selamat ${c.waktu}, ${c.tag}. Dunia menahan napas melihat langkahmu.`)),
  ],
  rank_mid: [
    (c) => frame(`${G.lion} ${B('PAHLAWAN RANK ')}${B(c.rank)} ${G.lion}`, q(`Selamat ${c.waktu}, ${c.tag}!`, `${c.rankname} — Lv.${c.lv}, Power ${c.power}. Namamu dikenal di seluruh guild.`)),
    (c) => frame(`${G.falcon} ${B('PETUALANG ELIT')} ${G.falcon}`, q(`${c.nama} hadir, rank ${c.rank} bersinar di kartu guild.`, `Para pemula memberi jalan.`)),
    (c) => frame(`${G.star} ${B('LEGENDA MUDA')} ${G.star}`, q(`Aura ${c.rankname} terasa dari jauh, ${c.tag}. Selamat ${c.waktu}!`)),
  ],
  rank_low: [
    (c) => `${G.lion} ${B('Selamat ' + c.waktu)}, ${c.tag}!\n${q(`Petualang Rank ${c.rank} (${c.rankname}) Lv.${c.lv} hadir — semangat berburunya!`)}`,
    (c) => `${G.falcon} ${c.nama} muncul di guild!\n${q(`Rank ${c.rank} • Lv.${c.lv} • Power ${c.power}`, 'Terus naikkan rankmu, jalan menuju legenda masih panjang.')}`,
    (c) => `${G.star} Halo ${c.tag}, selamat ${c.waktu}!\n${q(`Guild mencatat kamu sebagai ${c.rankname}. Lanjutkan perjalananmu!`)}`,
  ],
  clanleader: [
    (c) => frame(`${G.town} ${B('PEMIMPIN CLAN ')}${B(String(c.clan).toUpperCase())} ${G.town}`, q(`Panji clan berkibar — ${c.tag} sang pemimpin telah hadir!`, `Lv.${c.lv} • Rank ${c.rank} • Power ${c.power}`, `Selamat ${c.waktu}, Ketua.`)),
    (c) => frame(`${G.lion} ${B('SANG KETUA CLAN')} ${G.lion}`, q(`Seluruh anggota clan ${c.clan} berdiri memberi hormat pada ${c.nama}.`, `Selamat ${c.waktu}!`)),
    (c) => frame(`${G.sun} ${B('LEADER CLAN TOP')} ${G.sun}`, q(`${c.tag} memimpin ${c.clan} — salah satu clan terkuat di dunia ini.`, `Rank ${c.rank}, Power ${c.power}.`)),
  ],
  partyleader: [
    (c) => frame(`${G.falcon} ${B('KAPTEN PARTY ')}${B(String(c.party).toUpperCase())} ${G.falcon}`, q(`Party legendaris datang — ${c.tag} memimpin barisan!`, `Lv.${c.lv} • Rank ${c.rank} • Power ${c.power}`, `Selamat ${c.waktu}, Kapten.`)),
    (c) => frame(`${G.star} ${B('PARTY TERKUAT')} ${G.star}`, q(`${c.nama} dan party ${c.party} memasuki dungeon obrolan ini.`, 'Satu party, satu tujuan: mengalahkan semuanya.')),
    (c) => frame(`${G.lion} ${B('PEMIMPIN PARTY ELIT')} ${G.lion}`, q(`${c.tag} — leader party peringkat atas di server!`, `Selamat ${c.waktu}.`)),
  ],
  topclan: [
    (c) => `${G.town} ${B('Anggota clan terkuat hadir!')}\n${q(`${c.tag} dari clan *${c.clan}* (peringkat #1) — Rank ${c.rank}, Lv.${c.lv}.`, `Selamat ${c.waktu}!`)}`,
    (c) => `${G.lion} ${c.nama} dari clan *${c.clan}* masuk!\n${q('Clan nomor satu server ini tak pernah datang sendirian.')}`,
  ],
  topparty: [
    (c) => `${G.falcon} ${B('Anggota party terkuat hadir!')}\n${q(`${c.tag} dari party *${c.party}* (peringkat #1) — Rank ${c.rank}, Lv.${c.lv}.`, `Selamat ${c.waktu}!`)}`,
    (c) => `${G.star} ${c.nama}, bagian dari party *${c.party}* yang terkuat!\n${q(`Selamat ${c.waktu}, semoga hari ini penuh loot.`)}`,
  ],
  reborn: [
    (c) => `${G.ankh} ${B('Jiwa yang terlahir kembali')}\n${q(`${c.tag} telah ${c.reborn}x menembus roda samsara. Selamat ${c.waktu}!`, `Rank ${c.rank} • Lv.${c.lv} • Power ${c.power}`)}`,
    (c) => `${G.sun} ${c.nama} kembali dari kematian!\n${q(`Rebirth ke-${c.reborn} — tubuhnya baru, tekadnya tak berubah. Selamat ${c.waktu}.`)}`,
  ],
}
const KINDS = Object.keys(T)

function build(kind, jid, name, u, pos) {
  const pool = T[kind]; if (!pool) return null
  return pick(pool)(info(jid, name, u, pos))
}

// ── HOOK UTAMA ──
const lastChat = new Map()   // throttle per chat (maks 1 sambutan / 20 dtk)
function bannedList() { try { return JSON.parse(fs.readFileSync(path.join(global.chisaData, 'banned.json'), 'utf8')) } catch { return [] } }

async function maybe({ sock, m, isGroup, isDev, isCreator, isCmd, pushname }) {
  try {
    const d = cfg()
    if (!d.on || !m || m.key.fromMe) return
    const jid = m.sender; if (!jid) return
    const master = isDev || isCreator
    if (!isGroup && !master) return                       // chat pribadi: hanya Dev/Owner
    if (isGroup) {
      if (d.chats[m.chat] === false) return
      const g = require('./grupdb').get(m.chat); if (g.ban || g.off) return
    }
    if (!master) {
      if (S.get('mode') === 'self' || S.get('maintenance')) return
      if (bannedList().includes(jid)) return
    }
    const cls = classify(jid, { isDev, isCreator }); if (!cls) return
    const now = Date.now(), key = m.chat + '|' + jid
    const cdMin = cls.kind === 'dev' ? d.cd.dev : cls.kind === 'owner' ? d.cd.owner : d.cd.normal
    if (now - (d.last[key] || 0) < cdMin * 60000) return
    if (cls.kind !== 'dev' && now - (lastChat.get(m.chat) || 0) < 20000) return   // Dev selalu lolos throttle chat
    d.last[key] = now; lastChat.set(m.chat, now); DB.save()
    const text = build(cls.kind, jid, pushname || (cls.u && cls.u.name), cls.u, cls.pos); if (!text) return
    if (isCmd) await new Promise(r => setTimeout(r, 1500))   // biarkan jawaban perintah keluar duluan
    // Dev yang punya karakter RPG → sertakan kartu canvas
    if (cls.kind === 'dev' && cls.u) {
      try {
        const RC = require('./rpgctx')
        const img = await Promise.race([RC.cardFor(sock, jid, cls.u, cls.u.name, 'SANG PENCIPTA', new Date().toLocaleDateString('id-ID', { timeZone: global.settingsDefault?.timezone || 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout kartu')), 7000))])
        return await sock.sendMessage(m.chat, { image: img, caption: text, mentions: [jid] }, { quoted: m })
      } catch (e) { console.log('[greet] kartu dev gagal:', e.message) }
    }
    return await sock.sendMessage(m.chat, { text, mentions: [jid] }, { quoted: m })
  } catch (e) { console.log('[greet]', e.message) }
}

module.exports = { maybe, classify, build, cfg, save: () => DB.save(), KINDS, ORDER, board }
