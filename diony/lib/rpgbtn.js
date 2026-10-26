/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// TOMBOL RPG — balasan perintah RPG dikirim sebagai pesan interaktif (tombol cepat + daftar pilihan)
// supaya pemain tinggal tap, tidak perlu mengetik. Dipasang otomatis lewat wrap() untuk semua plugin kategori "rpg".
const ST = require('./style')

const cut = (s, n) => ST.cut(String(s ?? ''), n)
const LONG = 950   // di atas ini teks dikirim biasa dulu, tombol menyusul di pesan kecil

// ── KATALOG: semua perintah RPG per kelompok (dipakai daftar "Semua Menu RPG") ──
const GROUPS = [
  ['Karakter', ['rpgstart', 'profil', 'rank', 'addstat', 'changeclass', 'classlist']],
  ['Petualangan', ['hunt', 'dungeon', 'explore', 'mine', 'fish', 'chop', 'heal']],
  ['PvP & Boss', ['duel', 'arena', 'worldboss', 'attackboss']],
  ['Ekonomi & Tas', ['daily', 'weekly', 'work', 'shop', 'inv', 'craft', 'sell', 'use', 'equip', 'unequip', 'buy', 'transfer']],
  ['Companion', ['summon', 'companion', 'setcompanion']],
  ['Budak & Jinak', ['pasarbudak', 'budakku', 'jinakkan', 'skilljinak', 'ras', 'kerjasemua', 'kerjabudak', 'pasangbudak', 'rawat', 'latih', 'belibudak', 'lepasbudak']],
  ['Kota Guild', ['town', 'smith', 'enhance', 'merchant', 'mbuy', 'blessing', 'bounty', 'fortune', 'rumor', 'gamble', 'bestiary', 'lore', 'guildmaster']],
  ['Clan', ['claninfo', 'clanlist', 'clancreate', 'clanjoin', 'clandonate', 'clanupgrade', 'clanwar', 'clankick', 'clanleave']],
  ['Misi & Peringkat', ['quest', 'claimquest', 'toprpg', 'topgold', 'topkill']],
  ['Bank & Pencapaian', ['bank', 'setor', 'tarikbank', 'achievement', 'claimach']],
  ['Masak & Ekspedisi', ['cook', 'expedisi', 'klaimexp']],
  ['Party & Raid', ['partycreate', 'partyinvite', 'partyjoin', 'partyinfo', 'partyleave', 'partytop', 'pdungeon', 'clanraid', 'raidhit', 'raidtop']],
  ['Skill, Kebun & Judi', ['skills', 'learn', 'gelar', 'rebirth', 'kebun', 'tanam', 'panen', 'pasar', 'jualpasar', 'belipasar', 'coinflip', 'rpgslot', 'rob']],
]
const DESC = {
  rpgstart: 'Buat karakter (pilih class)', profil: 'Kartu petualang & stat', rank: 'Tangga rank guild', addstat: 'Bagi stat point', changeclass: 'Ganti class', classlist: 'Daftar class',
  hunt: 'Berburu monster', dungeon: 'Dungeon lantai demi lantai', explore: 'Jelajahi zona', mine: 'Menambang bahan', fish: 'Memancing', chop: 'Menebang kayu', heal: 'Pulihkan HP/MP',
  duel: 'Duel PvP (butuh @user & taruhan)', arena: 'Lawan rival arena', worldboss: 'Info world boss', attackboss: 'Serang world boss',
  daily: 'Hadiah harian', weekly: 'Hadiah mingguan', work: 'Kerja cari gold', shop: 'Toko guild + tombol beli', inv: 'Tas + tombol pakai/pasang', craft: 'Resep craft + tombol', sell: 'Jual bahan', use: 'Pakai potion', equip: 'Pasang equipment', unequip: 'Lepas equipment', buy: 'Beli item', transfer: 'Kirim gold',
  summon: 'Gacha companion', companion: 'Koleksi companion', setcompanion: 'Pasang companion',
  pasarbudak: 'Pasar budak (stok 2 jam)', budakku: 'Daftar & kelola budakmu', jinakkan: 'Jinakkan budak liar', skilljinak: 'Skill jinak & peluang per ras', ras: 'Daftar ras & tingkat kesulitan', kerjasemua: 'Kerjakan semua budak sekaligus', kerjabudak: 'Kerjakan satu budak', pasangbudak: 'Pasang budak jadi petarung', rawat: 'Rawat budak (naikkan kesetiaan)', latih: 'Latih budak (naik level)', belibudak: 'Beli budak dari pasar', lepasbudak: 'Lepas / jual budak',
  town: 'Kota guild', smith: 'Pandai besi', enhance: 'Tempa equipment', merchant: 'Pedagang keliling', mbuy: 'Beli dari pedagang', blessing: 'Berkah', bounty: 'Bounty harian', fortune: 'Ramalan harian', rumor: 'Rumor kedai', gamble: 'Judi dadu', bestiary: 'Catatan monster', lore: 'Cerita dunia', guildmaster: 'Tanya Guild Master AI',
  claninfo: 'Info clan', clanlist: 'Daftar clan', clancreate: 'Buat clan', clanjoin: 'Gabung clan', clandonate: 'Donasi kas clan', clanupgrade: 'Upgrade clan', clanwar: 'Perang clan', clankick: 'Keluarkan anggota', clanleave: 'Keluar clan',
  bank: 'Bank guild: saldo & bunga 2%/hari', setor: 'Setor gold ke bank (aman saat kalah)', tarikbank: 'Tarik gold dari bank', achievement: 'Daftar pencapaian & progres', claimach: 'Klaim hadiah pencapaian', cook: 'Masak: heal + buff sementara', expedisi: 'Ekspedisi idle 1/3/6 jam', klaimexp: 'Ambil hasil ekspedisi',
  partycreate: 'Buat party maks 5 orang', partyinvite: 'Undang anggota party', partyjoin: 'Gabung party', partyinfo: 'Info party', partyleave: 'Keluar party', partytop: 'Peringkat party', pdungeon: 'Party dungeon co-op', clanraid: 'Raid boss clan', raidhit: 'Serang boss raid', raidtop: 'Damage raid',
  skills: 'Skill pasif permanen', learn: 'Naikkan skill', gelar: 'Daftar gelar', settitle: 'Pasang gelar', rebirth: 'Terlahir kembali (bonus permanen)',
  kebun: 'Petak kebun', tanam: 'Tanam bibit', panen: 'Panen tanaman', pasar: 'Pasar antar pemain', jualpasar: 'Jual ke pemain lain', belipasar: 'Beli dari pasar', pasarku: 'Listing-mu', coinflip: 'Judi lempar koin', rpgslot: 'Slot isekai', rob: 'Curi gold pemain',
  quest: 'Misi harian', claimquest: 'Klaim hadiah misi', toprpg: 'Top level', topgold: 'Top gold', topkill: 'Top kill',
}
function catalog(prefix) {
  const sections = GROUPS.map(([title, cmds]) => ({ title: cut(title, 24), rows: cmds.map(c => ({ title: cut(prefix + c, 24), description: cut(DESC[c] || 'Perintah RPG', 72), id: prefix + c })) }))
  return { title: '📜 Semua Menu RPG', sections }
}

// ── TOMBOL CEPAT per perintah (label, perintah) ──
const QUICK = [
  [['hunt', 'berburu'], [['⚔️ Berburu lagi', 'hunt'], ['💊 Heal', 'heal'], ['👤 Profil', 'profil']]],
  [['dungeon', 'dg'], [['🏰 Dungeon lagi', 'dungeon'], ['💊 Heal', 'heal'], ['👤 Profil', 'profil']]],
  [['explore', 'jelajah'], [['🧭 Jelajah lagi', 'explore'], ['⚔️ Hunt', 'hunt'], ['💊 Heal', 'heal']]],
  [['mine', 'nambang'], [['⛏️ Tambang lagi', 'mine'], ['🎒 Tas', 'inv'], ['⚔️ Hunt', 'hunt']]],
  [['fish', 'mancing'], [['🎣 Pancing lagi', 'fish'], ['🎒 Tas', 'inv'], ['⚔️ Hunt', 'hunt']]],
  [['chop', 'tebang'], [['🪓 Tebang lagi', 'chop'], ['🎒 Tas', 'inv'], ['⚔️ Hunt', 'hunt']]],
  [['heal', 'rest', 'istirahat'], [['⚔️ Hunt', 'hunt'], ['🏰 Dungeon', 'dungeon'], ['👤 Profil', 'profil']]],
  [['daily', 'weekly'], [['⚔️ Hunt', 'hunt'], ['🎯 Quest', 'quest'], ['🏪 Shop', 'shop']]],
  [['work', 'kerja'], [['💼 Kerja lagi', 'work'], ['🏪 Shop', 'shop'], ['🎒 Tas', 'inv']]],
  [['rpgmenu', 'rpg'], [['👤 Profil', 'profil'], ['⚔️ Hunt', 'hunt'], ['🏛️ Pasar Budak', 'pasarbudak']]],
  [['profil', 'profile', 'me', 'status', 'rpgcard'], [['🎒 Tas', 'inv'], ['🎯 Quest', 'quest'], ['🧺 Budakku', 'budakku']]],
  [['bank', 'setor', 'tarikbank', 'wd', 'saldobank', 'bankrpg'], [['🏦 Bank', 'bank'], ['🎒 Tas', 'inv'], ['⚔️ Hunt', 'hunt']]],
  [['cook', 'masak', 'menumasak', 'dapur'], [['🍳 Resep', 'cook'], ['⚔️ Hunt', 'hunt'], ['👤 Profil', 'profil']]],
  [['expedisi', 'ekspedisi', 'exped', 'misiluar'], [['🧭 Status', 'expedisi'], ['📦 Klaim', 'klaimexp'], ['⚔️ Hunt', 'hunt']]],
  [['klaimexp', 'ambilexp'], [['🧭 Ekspedisi', 'expedisi'], ['⚔️ Hunt', 'hunt'], ['👤 Profil', 'profil']]],
  [['achievement', 'ach', 'pencapaian', 'prestasi'], [['🏅 Klaim', 'claimach'], ['🎯 Quest', 'quest'], ['👤 Profil', 'profil']]],
  [['claimach', 'klaimach'], [['🏅 Pencapaian', 'achievement'], ['⚔️ Hunt', 'hunt'], ['👤 Profil', 'profil']]],
  [['quest', 'misi'], [['✅ Klaim Quest', 'claimquest'], ['⚔️ Hunt', 'hunt'], ['🏰 Dungeon', 'dungeon']]],
  [['claimquest', 'klaim'], [['🎯 Quest', 'quest'], ['⚔️ Hunt', 'hunt'], ['👤 Profil', 'profil']]],
  [['summon', 'gacha'], [['🎴 Summon x1', 'summon 1'], ['🎰 Summon x10', 'summon 10'], ['🃏 Koleksi', 'companion']]],
  [['companion', 'waifu', 'setcompanion', 'setwaifu'], [['🎴 Summon x1', 'summon 1'], ['🎰 Summon x10', 'summon 10'], ['👤 Profil', 'profil']]],
  [['town', 'kota'], [['⚒️ Smith', 'smith'], ['🧳 Merchant', 'merchant'], ['📋 Bounty', 'bounty']]],
  [['duel', 'pvp', 'arena'], [['🏟️ Arena', 'arena'], ['🐲 World Boss', 'worldboss'], ['👤 Profil', 'profil']]],
  [['worldboss', 'boss', 'attackboss', 'serangboss'], [['💥 Serang Boss', 'attackboss'], ['💊 Heal', 'heal'], ['👤 Profil', 'profil']]],
  [['shop', 'toko', 'buy', 'beli', 'sell', 'jual'], [['🎒 Tas', 'inv'], ['⚒️ Craft', 'craft'], ['👤 Profil', 'profil']]],
  [['inv', 'inventory', 'tas', 'use', 'pakai', 'equip', 'unequip'], [['🏪 Shop', 'shop'], ['💊 Heal', 'heal'], ['👤 Profil', 'profil']]],
  [['craft'], [['🎒 Tas', 'inv'], ['🏪 Shop', 'shop'], ['⚔️ Hunt', 'hunt']]],
  [['clan', 'claninfo', 'clanlist', 'listclan', 'clancreate', 'buatclan', 'clanjoin', 'joinclan', 'clandonate', 'donasiclan', 'clanupgrade', 'clanwar', 'clankick', 'clanleave', 'keluarclan', 'topclan', 'clanbio'], [['ℹ️ Info Clan', 'claninfo'], ['📋 Daftar Clan', 'clanlist'], ['👤 Profil', 'profil']]],
]
const DEFAULT_QUICK = [['👤 Profil', 'profil'], ['⚔️ Hunt', 'hunt'], ['🏰 Dungeon', 'dungeon']]
const quickFor = (cmd) => (QUICK.find(([k]) => k.includes(cmd)) || [, DEFAULT_QUICK])[1]

// ── DAFTAR PILIHAN dinamis (butuh data pemain) ──
function dynLists(ctx, cmd) {
  const R = require('./rpg'), D = R.D, p = ctx.prefix, u = R.get(ctx.m.sender), out = []
  const row = (title, desc, id) => ({ title: cut(title, 24), description: cut(desc, 72), id })
  const stat = (i) => [i.atk && `ATK ${i.atk}`, i.def && `DEF ${i.def}`, i.hp && `HP ${i.hp}`].filter(Boolean).join(' ')
  if (['classlist', 'kelas', 'rpgstart', 'daftarrpg', 'rpgdaftar'].includes(cmd)) {
    const reg = !!u && cmd !== 'rpgstart' && cmd !== 'daftarrpg' && cmd !== 'rpgdaftar'
    out.push({ title: reg ? '🔄 Ganti Class' : '🎭 Pilih Class', sections: [{ title: 'Class', rows: Object.entries(D.CLASSES).map(([k, c]) => row(`${c.emoji} ${c.name}`, c.desc, `${p}${reg ? 'changeclass' : 'rpgstart'} ${k}`)) }] })
  }
  if (!u) return out
  if (['shop', 'toko'].includes(cmd)) {
    const grp = { potion: '🧪 Potion', weapon: '⚔️ Senjata', armor: '🛡️ Armor', acc: '💍 Aksesori', ticket: '🎟️ Lainnya' }
    const sections = Object.entries(grp).map(([ty, label]) => ({ title: label, rows: Object.entries(D.ITEMS).filter(([, i]) => i.type === ty && i.price > 0).slice(0, 12).map(([k, i]) => row(`${i.e} ${i.n}`, `${R.fmt(i.price)}g ${stat(i)}`.trim(), `${p}buy ${k} 1`)) })).filter(s => s.rows.length)
    if (sections.length) out.push({ title: '🛒 Beli Item', sections })
  }
  if (['inv', 'inventory', 'tas', 'use', 'pakai', 'equip', 'unequip'].includes(cmd)) {
    const pot = [], eq = []
    for (const [id, q] of Object.entries(u.inv || {})) {
      const it = D.ITEMS[id]; if (!it) continue
      if (it.type === 'potion') pot.push(row(`${it.e} ${it.n}`, `Pakai (punya ${q})`, `${p}use ${id}`))
      else if (['weapon', 'armor', 'acc'].includes(it.type)) eq.push(row(`${it.e} ${it.n}`, `Pasang ${stat(it)}`.trim(), `${p}equip ${id}`))
    }
    const sections = []; if (pot.length) sections.push({ title: '🧪 Pakai', rows: pot.slice(0, 10) }); if (eq.length) sections.push({ title: '🎽 Pasang', rows: eq.slice(0, 10) })
    if (sections.length) out.push({ title: '🎒 Pakai / Pasang', sections })
  }
  if (cmd === 'craft' && !String(ctx.args[0] || '')) {
    const rows = Object.keys(D.RECIPES).slice(0, 15).map(k => { const i = D.ITEMS[k]; return row(`${i ? i.e + ' ' + i.n : k}`, `${R.fmt(D.RECIPES[k].gold)}g + bahan`, `${p}craft ${k}`) })
    if (rows.length) out.push({ title: '⚒️ Craft', sections: [{ title: 'Resep', rows }] })
  }
  if (['companion', 'waifu'].includes(cmd)) {
    const rows = Object.keys(u.comp?.owned || {}).map(id => D.COMPANIONS.find(c => c.id === id)).filter(Boolean).slice(0, 20).map(c => row(`${c.e} ${c.n}`, `[${c.r}] ★${u.comp.owned[c.id]}${u.comp.active === c.id ? ' • aktif' : ''}`, `${p}setcompanion ${c.id}`))
    if (rows.length) out.push({ title: '🃏 Pasang Companion', sections: [{ title: 'Koleksi', rows }] })
  }
  return out
}

// ── PENGIRIM ──
// opts: { quick:[[label,cmd]], lists:[{title,sections}], image, footer, mentions, quoted, noMenu }
async function relay(raw, m, prefix, text, opts = {}) {
  const { generateWAMessageFromContent, prepareWAMessageMedia } = require('./baileys')
  const up = { upload: raw.waUploadToServer }
  let header = { hasMediaAttachment: false }
  if (opts.image) { const h = await prepareWAMessageMedia({ image: opts.image }, up); header = { hasMediaAttachment: true, imageMessage: h.imageMessage } }
  const buttons = [
    ...(opts.quick || []).slice(0, 3).map(([label, cmd]) => ({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: cut(label, 22), id: prefix + cmd }) })),
    ...(opts.lists || []).slice(0, 3).map(l => ({ name: 'single_select', buttonParamsJson: JSON.stringify({ title: cut(l.title, 30), sections: l.sections }) })),
  ]
  if (!opts.noMenu) buttons.push({ name: 'single_select', buttonParamsJson: JSON.stringify(catalog(prefix)) })
  const interactive = { body: { text: String(text || ' ') }, footer: { text: opts.footer || (global.settingsDefault && global.settingsDefault.footer) || '' }, header, nativeFlowMessage: { buttons, messageParamsJson: '' } }
  if (opts.mentions && opts.mentions.length) interactive.contextInfo = { mentionedJid: opts.mentions }
  const msg = generateWAMessageFromContent(m.chat, { viewOnceMessage: { message: {
    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
    interactiveMessage: interactive,
  } } }, { userJid: m.chat, quoted: require('./dquote').quoteOf(opts.quoted === undefined ? m : opts.quoted), upload: raw.waUploadToServer })
  await raw.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

// Kirim teks (+gambar) dengan tombol. Teks panjang: kirim biasa dulu, lalu pesan kecil berisi tombol.
async function send(ctx, text, opts = {}) {
  const raw = ctx.rawSock || ctx.sock, m = ctx.m
  const plain = () => raw.sendMessage(m.chat, opts.image ? { image: opts.image, caption: text } : { text }, { quoted: m })
  try {
    if (String(text).length > LONG) {
      await plain()
      return await relay(raw, m, ctx.prefix, '⚡ *Aksi cepat* — tap tombol di bawah', { ...opts, image: null })
    }
    return await relay(raw, m, ctx.prefix, text, opts)
  } catch (e) { console.log('[rpgbtn]', e.message); return plain() }
}

// ── WRAPPER: semua reply / sendMessage(text|image+caption) dari plugin RPG otomatis dapat tombol ──
const PLAIN_KEYS = new Set(['text', 'image', 'caption', 'mentions', 'contextInfo'])
function convertible(c) { return c && typeof c === 'object' && (c.text || c.image) && Object.keys(c).every(k => PLAIN_KEYS.has(k)) && !(c.text && c.image) }
function wrap(ctx, plug) {
  const raw = ctx.sock, cmd = ctx.command
  const auto = async (jid, content, o = {}) => {
    const text = content.text ?? content.caption ?? ''
    let lists = [], quick = quickFor(cmd)
    try {
      const R = require('./rpg'), noChar = !R.get(ctx.m.sender), reg = ['rpgstart', 'daftarrpg', 'rpgdaftar', 'classlist', 'kelas', 'rpgmenu', 'rpg', 'resetrpg'].includes(cmd)
      if (noChar && !reg) { quick = [['🎭 Pilih Class', 'classlist']]; lists = dynLists(ctx, 'rpgstart') } else lists = dynLists(ctx, cmd)
    } catch (e) { console.log('[rpgbtn dyn]', e.message) }
    const mentions = content.mentions || content.contextInfo?.mentionedJid
    return send({ ...ctx, rawSock: raw }, text, { quick, lists, image: content.image, mentions, quoted: o.quoted })
  }
  const sock = new Proxy(raw, {
    get(t, k) {
      if (k === 'sendMessage') return async (jid, content, o) => {
        if (jid === ctx.m.chat && convertible(content) && String(content.text ?? content.caption ?? '').trim()) {
          try { return await auto(jid, content, o) } catch (e) { console.log('[rpgbtn auto]', e.message) }
        }
        return raw.sendMessage(jid, content, o)
      }
      const v = t[k]; return typeof v === 'function' ? v.bind(t) : v
    },
  })
  const reply = (teks) => sock.sendMessage(ctx.m.chat, { text: teks }, { quoted: ctx.m })
  return { ...ctx, sock, rawSock: raw, reply }
}

module.exports = { send, wrap, catalog, quickFor, dynLists, GROUPS, DESC }
