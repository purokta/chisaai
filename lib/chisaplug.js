// Jembatan fitur tambahan: memuat plugin hasil adaptasi paket Chisa (folder chisa/) dan menjalankannya di dalam CHISA-AI.
const fs = require('fs')
const path = require('path')
const config = require('../config')
const db = require('./db')
const loader = require('./loader')

try { process.setMaxListeners(40) } catch {}
const ROOT = path.join(__dirname, '..', 'chisa')
const PLUGINS = path.join(ROOT, 'plugins')

// nama kategori Chisa -> judul menu (Indonesia) + emoji
const CATS = {
  ai: ['AI', '🤖'], ajaib: ['Ajaib', '🪄'], anime: ['Anime & Baca', '🌸'], dunia: ['Dunia & Info', '🌍'],
  ekstra: ['Harian & Produktif', '🗂️'], fun: ['Fun & Game', '🎮'], group: ['Grup', '👥'], kreasi: ['Kreasi', '🎨'],
  economy: ['Economy', '💹'], npc: ['NPC', '🧙'], praktis: ['Praktis', '🧮'], rpg: ['RPG', '⚔️'], sticker: ['Stiker Brat', '🏷️'],
  tools: ['Tools', '🧰'], unduh: ['Unduh', '📥']
}
const catInfo = c => CATS[c] || [c.charAt(0).toUpperCase() + c.slice(1), '📌']

// Perintah inti yang TIDAK boleh ditimpa plugin walau namanya sama (sistem, owner, dan menu).
const PROTECT = new Set([
  'menu', 'help', 'bantuan', 'start', 'chisa', 'fitur', 'owner', 'private', 'self', 'public', 'autoreply', 'vip', 'ban', 'unban',
  'setlimit', 'limit', 'backup', 'restore', 'update', 'restart', 'stop', 'deploy', 'reload', 'ping', 'status', 'myid', 'menumusik'
])

let state = null

function walk(d) {
  let out = []
  for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) out = out.concat(walk(p))
    else if (e.name.endsWith('.js')) out.push(p)
  }
  return out
}

// memuat semua plugin (sekali). Plugin yang gagal dimuat dicatat, tidak menghentikan bot.
function boot() {
  if (state) return state
  require('../chisa/config')
  const plugins = []
  const byName = new Map()
  const failed = []
  for (const file of walk(PLUGINS)) {
    try {
      const p = require(file)
      if (!p || typeof p.run !== 'function' || !p.name) continue
      p.category = p.category || path.basename(path.dirname(file))
      // nama yang sudah dipakai perintah inti / plugin lain dibuang (tidak ada perintah ganda)
      const names = [...new Set([p.name, ...(p.alias || []), ...(p.cmds || [])].map(n => String(n).toLowerCase()).filter(Boolean))]
        .filter(n => !loader.find(n) && !byName.has(n))
      if (!names.length) continue
      if (String(p.name).toLowerCase() !== names[0] && !names.includes(String(p.name).toLowerCase())) p.name = names[0]
      if (Array.isArray(p.alias)) p.alias = p.alias.filter(n => names.includes(String(n).toLowerCase()))
      if (Array.isArray(p.cmds)) p.cmds = p.cmds.filter(n => names.includes(String(n).toLowerCase()))
      plugins.push(p)
      for (const n of names) byName.set(n, p)
      p.__names = names
    } catch (e) {
      failed.push({ file: path.relative(PLUGINS, file), error: String(e.message).split('\n')[0].slice(0, 120) })
    }
  }
  state = { plugins, byName, failed, facades: new Map() }
  return state
}

const isBooted = () => !!state

// ---------- socket turunan: ID LID dinormalkan ke nomor, helper tambahan untuk plugin ----------
function dsockOf(sock) {
  if (sock.__chisa) return sock.__chisa
  const J = require('../chisa/lib/jid')
  const { jidDecode } = require('../chisa/lib/baileys')
  const d = Object.create(sock)
  d.decodeJid = jid => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const x = jidDecode(jid) || {}
      return x.user && x.server ? x.user + '@' + x.server : jid
    }
    return jid
  }
  const rawMeta = sock.groupMetadata.bind(sock)
  d.groupMetadata = async jid => J.normalizeMeta(await rawMeta(jid))
  if (sock.groupParticipantsUpdate) {
    const rawUpd = sock.groupParticipantsUpdate.bind(sock)
    d.groupParticipantsUpdate = async (gid, jids, action) => {
      try {
        return await rawUpd(gid, jids, action)
      } catch (e) {
        const alt = jids.map(j => J.lidOf(j) || j)
        if (alt.every((a, i) => a === jids[i])) throw e
        return rawUpd(gid, alt, action)
      }
    }
  }
  d.rawSend = sock.sendMessage.bind(sock)
  d.warmLid = async () => {}
  try { Object.defineProperty(sock, '__chisa', { value: d, enumerable: false, configurable: true }) } catch {}
  return d
}

const miniStore = { contacts: {}, messages: {}, loadMessage: async () => null }

// ---------- perintah dengan format Chisa ----------
function facadeOf(p, name) {
  const st = boot()
  const key = p.name + '|' + name
  if (st.facades.has(key)) return st.facades.get(key)
  const [catTitle] = catInfo(p.category)
  const f = {
    name,
    aliases: [],
    category: catTitle,
    chisaCat: p.category,
    desc: p.desc || 'Fitur Chisa AI',
    platform: 'whatsapp',
    chisa: true,
    plugin: p,
    free: !!p.noLimit,
    ownerOnly: !!(p.owner || p.dev),
    groupOnly: !!p.group,
    async run(ctx) { return runPlugin(p, name, ctx) }
  }
  st.facades.set(key, f)
  return f
}

// cari perintah Chisa berdasarkan nama (null kalau tidak ada)
function find(name) {
  const st = boot()
  const p = st.byName.get(String(name).toLowerCase())
  return p ? facadeOf(p, String(name).toLowerCase()) : null
}
const has = name => !!boot().byName.get(String(name).toLowerCase())

// Perintah inti selalu menang kalau namanya sama (nama bentrok sudah dibersihkan dari plugin);
// kalau tidak ada di inti, pakai plugin. Mengembalikan perintah yang harus dijalankan.
function resolve(name, coreCmd) {
  if (coreCmd) return coreCmd
  const n = String(name).toLowerCase()
  if (PROTECT.has(n)) return coreCmd
  return find(n) || coreCmd
}

async function groupInfo(ctx, dsock) {
  const J = require('../chisa/lib/jid')
  const G = require('./group')
  let md = null
  try { md = J.normalizeMeta(await G.metadata(ctx.sock, ctx.jid)) } catch {}
  const isAdmins = md ? ctx.isOwner || J.isAdmin(md, ctx.sender, ...(ctx.senderIds || [])) : ctx.isOwner
  const isBotAdmins = md ? J.isAdmin(md, ...J.botIds(dsock)) : false
  return { md, isAdmins, isBotAdmins, groupAdmins: md ? J.adminList(md) : [] }
}

function ctxFor(ctx, dsock, extra = {}) {
  const MY = require('../chisa/lib/myfunc')
  const S = require('../chisa/lib/settingsdb')
  const m = ctx.m
  if (!m.__dsm) {
    MY.smsg(dsock, m, miniStore)
    Object.defineProperty(m, '__dsm', { value: true, enumerable: false })
  }
  // pengirim: pakai hasil normalisasi Chisa, tapi owner/VIP tetap ditentukan oleh Chisa
  const args = ctx.text ? ctx.text.trim().split(/ +/) : []
  const text = args.join(' ')
  const botNumber = dsock.decodeJid(dsock.user?.id)
  const reply = t => dsock.sendMessage(ctx.jid, { text: t }, { quoted: m })
  return {
    sock: dsock, m, store: miniStore,
    body: ctx.text, budy: typeof m.text === 'string' ? m.text : '', text, q: text, args,
    command: ctx.command, prefix: ctx.prefix, pushname: ctx.pushName || 'kak', reply, from: ctx.jid,
    noPrefixCmd: false, usedPrefix: ctx.prefix,
    isGroup: ctx.isGroup, isCreator: ctx.isOwner, isOwner: ctx.isOwner, isDev: ctx.isOwner, isPremium: ctx.isOwner || ctx.isVip,
    isAdmins: false, isBotAdmins: false, groupMetadata: null, groupAdmins: [],
    botNumber, runtime: MY.runtime, tanggal: MY.tanggal, S, thumbPath: path.join(ROOT, 'lib', 'media', 'thumb.jpg'),
    ...extra
  }
}

async function runPlugin(p, command, ctx) {
  const dsock = dsockOf(ctx.sock)
  let g = {}
  if (ctx.isGroup) g = await groupInfo(ctx, dsock)
  const dctx = ctxFor(ctx, dsock, ctx.isGroup ? { groupMetadata: g.md, isAdmins: g.isAdmins, isBotAdmins: g.isBotAdmins, groupAdmins: g.groupAdmins } : {})
  const mess = global.mess
  if (p.owner && !ctx.isOwner) return ctx.reply(mess.owner)
  if (p.dev && !ctx.isOwner) return ctx.reply('*Khusus owner.* Fitur ini hanya untuk pemilik bot.')
  if (p.group && !ctx.isGroup) return ctx.reply(mess.group)
  if (p.private && ctx.isGroup) return ctx.reply(mess.private)
  if (p.admin && !dctx.isAdmins && !ctx.isOwner) return ctx.reply(mess.admin)
  if (p.botAdmin && !dctx.isBotAdmins) return ctx.reply(mess.botAdmin)
  let pctx = dctx
  if (p.category === 'rpg') { try { pctx = require('../chisa/lib/rpgbtn').wrap(dctx, p) } catch (e) { console.log('[chisa rpgbtn]', e.message) } }
  command = String(command).toLowerCase()
  pctx.command = command
  return p.run(pctx)
}

// Hook pesan biasa (jawaban game, anti-spam grup, dsb). Mengembalikan true bila pesan sudah ditangani.
async function onPlain(ctx) {
  if (!isBooted()) return false
  const st = boot()
  const hooks = st.plugins.filter(p => typeof p.before === 'function')
  if (!hooks.length) return false
  const dsock = dsockOf(ctx.sock)
  let g = {}
  if (ctx.isGroup) g = await groupInfo(ctx, dsock)
  const dctx = ctxFor(ctx, dsock, ctx.isGroup ? { groupMetadata: g.md, isAdmins: g.isAdmins, isBotAdmins: g.isBotAdmins, groupAdmins: g.groupAdmins } : {})
  for (const p of hooks) {
    if (p.noPrefixOnly) continue
    try {
      if (await p.before(dctx)) return true
    } catch (e) {
      console.log('[chisa before]', p.name, e.message)
    }
  }
  return false
}

// ---------- data untuk menu ----------
function categories() {
  const st = boot()
  const map = new Map()
  for (const p of st.plugins) {
    if (p.hidden || p.owner || p.dev) continue // khusus owner: lihat ownerPlugins()
    if (!map.has(p.category)) map.set(p.category, { id: p.category, plugins: [], count: 0 })
    const c = map.get(p.category)
    c.plugins.push(p)
    c.count += (p.cmds && p.cmds.length ? p.cmds.length : 1 + (p.alias || []).length)
  }
  const order = Object.keys(CATS)
  return [...map.values()].sort((a, b) => (order.indexOf(a.id) + 99 * +(order.indexOf(a.id) < 0)) - (order.indexOf(b.id) + 99 * +(order.indexOf(b.id) < 0)))
}

// plugin tersembunyi / khusus owner (ditampilkan di menu Owner)
const ownerPlugins = () => boot().plugins.filter(p => p.hidden || p.owner || p.dev)

function searchFeatures(q, limit = 25) {
  const st = boot()
  const t = String(q).toLowerCase().trim()
  if (!t) return []
  const out = []
  for (const p of st.plugins) {
    const hit = p.__names.some(n => n.includes(t)) || String(p.desc || '').toLowerCase().includes(t)
    if (hit) out.push(p)
    if (out.length >= limit) break
  }
  return out
}

function stats() {
  const st = boot()
  return { plugins: st.plugins.length, commands: st.byName.size, failed: st.failed }
}

module.exports = { CATS, catInfo, boot, isBooted, find, has, resolve, onPlain, categories, ownerPlugins, searchFeatures, stats, PROTECT }
