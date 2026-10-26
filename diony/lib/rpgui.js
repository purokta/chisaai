/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// TAMPILAN RPG: gaya teks WhatsApp (> kutipan, *tebal*, ``` mono) + kartu canvas per fitur.
// Level & rank SELALU dibaca dari data user yang sama (R.addExp / R.rankOf), jadi canvas = notif = profil.
const { R, avatar } = require('./rpgctx')
const card = require('./rpgcard')

// hieroglif (bukan emoji) — dipakai sebagai ikon di semua teks RPG
const G = { eye: '✦', ankh: '✦', lion: '✦', scarab: '✦', sun: '✦', offer: '✦', town: '✦', owl: '✦', falcon: '✦', cobra: '✦', water: '✦', plant: '✦', star: '✦', sky: '✦' }
const fmt = (n) => R.fmt(n)

const head = (glyph, title, sub) => `${glyph} *${String(title).toUpperCase()}*${sub ? `  •  ${sub}` : ''}`
const quote = (lines) => lines.filter(x => x !== null && x !== undefined && x !== '' && x !== false).map(l => `> ${l}`).join('\n')
const mono = (rows) => {
  rows = rows.filter(Boolean); if (!rows.length) return ''
  const w = Math.max(...rows.map(r => String(r[0]).length))
  return '```\n' + rows.map(([k, v]) => `${String(k).padEnd(w)}  ${v}`).join('\n') + '\n```'
}
const meter = (c, m, n = 10) => R.bar(c, m, n)

// blok naik level + rank (kosong bila tidak naik)
function lvBlock(ex) {
  if (!ex || !ex.up) return ''
  let t = `\n${quote([`${G.ankh} *LEVEL UP!*  Lv.${ex.from} ➜ *Lv.${ex.lvl}*`, `+${ex.pts} stat point  •  ketik *.addstat*`, ex.rankUp && `${G.lion} *RANK UP!*  ${ex.prev.tier} (${ex.prev.name}) ➜ *${ex.rank.tier}* (${ex.rank.name})`])}`
  return t
}
const lvInfo = (ex) => ex && ex.up ? { from: ex.from, to: ex.lvl, pts: ex.pts, rankUp: ex.rankUp, prev: ex.prev } : null
const vitals = (u) => { const s = R.stats(u); return `${G.ankh} HP ${fmt(Math.min(u.hp, s.maxhp))}/${fmt(s.maxhp)}  •  ${G.water} MP ${fmt(Math.min(u.mp, s.maxmp))}/${fmt(s.maxmp)}` }

// susun caption teks. o: { glyph, title, sub, quote:[], rows:[[k,v]], ex, tail:[], hint }
function compose(o) {
  const out = [head(o.glyph || G.eye, o.title, o.sub)]
  if (o.quote && o.quote.length) { const q = quote(o.quote); if (q) out.push(q) }
  if (o.rows && o.rows.length) out.push(mono(o.rows))
  if (o.ex) { const l = lvBlock(o.ex); if (l) out.push(l.trim()) }
  if (o.tail && o.tail.length) { const q = quote(o.tail); if (q) out.push(q) }
  if (o.hint) out.push(`_${o.hint}_`)
  return out.join('\n')
}

// gambar kartu hasil dari data user (u) SESUDAH hadiah diterapkan, jadi level di canvas pasti sama dengan notif
async function image(ctx, u, o) {
  const s = R.stats(u), c = R.D.CLASSES[u.cls], av = await avatar(ctx.sock, ctx.m.sender)
  return card.resultCard({
    title: `${o.title}${o.sub ? ' | ' + o.sub : ''}`, sub: o.cardSub || o.sub || '', tone: o.tone || 'info', headline: o.headline || o.title,
    name: u.name, avatar: av, cls: c.name, level: u.level, rank: R.rankOf(u.level), exp: u.exp, need: R.expNeed(u.level),
    hp: Math.min(u.hp, s.maxhp), maxhp: s.maxhp, mp: Math.min(u.mp, s.maxmp), maxmp: s.maxmp, gold: u.gold,
    chips: o.chips, log: o.log, up: lvInfo(o.ex), footer: new Date().toLocaleDateString('id-ID', { timeZone: global.settingsDefault?.timezone || 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }),
  })
}

// kirim kartu + caption (kalau canvas gagal, otomatis jatuh ke teks saja)
async function send(ctx, u, o) {
  const text = compose(o)
  try {
    const img = await image(ctx, u, o)
    return await ctx.sock.sendMessage(ctx.m.chat, { image: img, caption: text, mentions: o.mentions }, { quoted: ctx.m })
  } catch (e) { console.log('[rpgui]', e.message); return ctx.sock.sendMessage(ctx.m.chat, { text, mentions: o.mentions }, { quoted: ctx.m }) }
}
// pesan teks bergaya saja (tanpa canvas)
const say = (ctx, o) => ctx.sock.sendMessage(ctx.m.chat, { text: compose(o), mentions: o.mentions }, { quoted: ctx.m })

module.exports = { G, fmt, head, quote, mono, meter, lvBlock, lvInfo, vitals, compose, image, send, say }
