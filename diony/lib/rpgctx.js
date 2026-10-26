/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Helper umum untuk plugin RPG
const R = require('./rpg')
const card = require('./rpgcard')

const mentioned = (m) => m.msg?.contextInfo?.mentionedJid?.[0] || null
function target(ctx) {
  const n = (ctx.text.match(/\d{8,15}/) || [])[0]
  return mentioned(ctx.m) || ctx.m.quoted?.sender || (n ? n + '@s.whatsapp.net' : null)
}
function need(ctx) {
  const u = R.get(ctx.m.sender)
  if (!u) { ctx.reply(`⚔️ Kamu belum punya karakter petualang!\nKetik *${ctx.prefix}rpgstart* untuk memilih class dan mulai.`); return null }
  if (ctx.pushname && ctx.pushname !== 'no name') u.name = ctx.pushname
  return u
}
const avCache = new Map()   // cache foto profil 10 menit supaya tiap fitur tidak menembak WhatsApp berulang
async function avatar(sock, jid) {
  const c = avCache.get(jid); if (c && Date.now() - c.at < 600000) return c.buf
  let buf = null
  try {
    const url = await sock.profilePictureUrl(jid, 'image')
    const b = await require('./functions').getBuffer(url)
    buf = Buffer.isBuffer(b) ? b : null
  } catch {}
  avCache.set(jid, { buf, at: Date.now() }); return buf
}
const clanInfo = (u) => { const c = u && u.clan && R.clans()[u.clan]; return c ? { name: c.name, level: c.level, members: c.members.length, max: R.clanMax(c) } : null }
const compName = (u) => { const c = u.comp.active && R.D.COMPANIONS.find(x => x.id === u.comp.active); return c ? c.n : '' }

// data kartu dari user RPG (u boleh null = belum daftar)
async function cardFor(sock, jid, u, name, title, footer) {
  const av = await avatar(sock, jid)
  if (!u) return card.profileCard({ title, name, avatar: av, cls: 'Belum terdaftar', rank: R.rankOf(1), level: 1, exp: 0, need: R.expNeed(1), hp: 1, maxhp: 1, mp: 1, maxmp: 1, atk: 0, def: 0, power: 0, gold: 0, clan: null, registered: false, footer })
  const s = R.stats(u), c = R.D.CLASSES[u.cls]
  return card.profileCard({ title, name: u.name, avatar: av, cls: c.name, companion: compName(u), rank: R.rankOf(u.level), level: u.level, exp: u.exp, need: R.expNeed(u.level),
    hp: Math.min(u.hp, s.maxhp), maxhp: s.maxhp, mp: Math.min(u.mp, s.maxmp), maxmp: s.maxmp, atk: s.atk, def: s.defv, power: s.power, gold: u.gold,
    clan: clanInfo(u), wins: u.wins, kills: u.kills, footer })
}
// pesan hasil battle
const mobLine = (m) => `${m.e} *${m.n}*`
const itemName = (id) => { const i = R.D.ITEMS[id]; return i ? `${i.e} ${i.n}` : id }
function levelMsg(lv) { return require('./rpgui').lvBlock(lv) }

module.exports = { R, mentioned, target, need, avatar, cardFor, clanInfo, compName, mobLine, itemName, levelMsg }
