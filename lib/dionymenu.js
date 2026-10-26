// Menu WhatsApp: SATU menu gabungan (fitur Chisa + fitur tambahan) dengan gaya emoji yang simpel.
//   .menu            -> banner + daftar kategori
//   .menu <kategori> -> isi kategori 
//   .menu semua      -> semua kategori sekaligus
//   .menu <perintah> -> detail satu fitur
const diony = require('./diony')
const brand = require('./brand')

const LIMIT = 3200 // batas karakter per pesan supaya enak dibaca

const short = (t, n = 70) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

// kategori Chisa -> kategori tambahan yang sejenis (digabung jadi satu)
const MERGE = { stiker: 'sticker', downloader: 'unduh', ai: 'ai', grup: 'group', anime: 'anime', alat: 'tools', info: 'dunia', game: 'fun' }
const OWN = { musik: ['Musik', '🎵'], islami: ['Islami', '🕌'], lainnya: ['Lainnya', '✨'], owner: ['Owner', '👑'], stiker: ['Stiker', '🖼️'], downloader: ['Download', '📥'], game: ['Game', '🎮'], info: ['Info', '🌤️'], alat: ['Alat', '🧰'] }
const TITLE = { sticker: 'Stiker', unduh: 'Download', tools: 'Alat', dunia: 'Info & Dunia' }
const ORDER = ['sticker', 'stiker', 'unduh', 'downloader', 'musik', 'anime', 'ai', 'group', 'tools', 'dunia', 'fun', 'game', 'praktis', 'ekstra', 'kreasi', 'ajaib', 'rpg', 'npc', 'islami', 'lainnya', 'owner']

const B = t => String(t).replace(/[A-Za-z0-9]/g, c => {
  const k = c.charCodeAt(0)
  return String.fromCodePoint(k >= 97 ? 0x1D5EE + k - 97 : k >= 65 ? 0x1D5D4 + k - 65 : 0x1D7EC + k - 48)
})

function banner(ctx) {
  return `╭┈┈┈┈┈┈┈┈┈┈┈┈╮\n  ✧ ${B('KUCHIBA CHISA')} ✧\n  ˗ˏˋ ${B('chisa ai')} ˎˊ˗\n╰┈┈┈┈┈┈┈┈┈┈┈┈╯`
}

// gabungkan perintah Chisa (yang terlihat) + fitur tambahan per kategori
function buildCats(ctx) {
  const map = new Map()
  const get = id => {
    if (!map.has(id)) {
      const lyn = diony.CATS[id]
      const own = OWN[id]
      const [title, emo] = lyn ? lyn : own || diony.catInfo(id)
      map.set(id, { id, title: TITLE[id] || (own && !lyn ? own[0] : title), emo: id === 'sticker' ? '🖼️' : lyn ? lyn[1] : own ? own[1] : '📌', chisa: [], plugins: [], count: 0 })
    }
    return map.get(id)
  }
  const seen = new Set()
  for (const c of ctx.commands || []) {
    if (c.hidden || c.diony || (c.ownerOnly && !ctx.isOwner) || (c.platform && c.platform !== 'whatsapp')) continue
    const key = norm(c.category || 'Lainnya')
    const e = get(MERGE[key] || key)
    e.chisa.push(c)
    seen.add(c.name)
    e.count++
  }
  for (const cat of diony.categories()) {
    const e = get(cat.id)
    e.plugins.push(...cat.plugins)
    e.count += cat.count
  }
  const rank = id => { const i = ORDER.indexOf(id); return i < 0 ? 99 : i }
  return [...map.values()].filter(c => c.count > 0).sort((a, b) => rank(a.id) - rank(b.id))
}

// kata kunci yang tampil di menu = kata pertama judul (mis. "download", "grup", "info")
const keyOf = c => norm(String(c.title).split(/[ &]/)[0])

function findCategory(cats, want) {
  const w = norm(want)
  if (!w) return null
  const alias = MERGE[w]
  return cats.find(c => norm(c.id) === w || norm(c.title) === w || keyOf(c) === w || (alias && c.id === alias)) || null
}

function mainText(ctx, cats, p) {
  const total = cats.reduce((a, c) => a + c.count, 0)
  const rows = cats.map(c => `${c.emo} *${c.title}*  ${p}menu ${keyOf(c)}`)
  return (
    `${banner(ctx)}\n\n${rows.join('\n')}\n\n` +
    `🧾 ${total} fitur • ${p}menu semua\n🔎 ${p}fitur <kata>\n© ${ctx.config.botName} v${require('../package.json').version} • ${brand.mark()}\n📜 ${p}changelog`
  )
}

// satu kategori -> beberapa halaman teks (Chisa dulu, lalu fitur tambahan)
function categoryPages(cat, p) {
  const lines = []
  if (cat.chisa.length) lines.push(cat.chisa.map(c => `${cat.emo} ${p}${c.name}${c.usage ? ' ' + c.usage : ''}`).join('\n'))
  for (const pl of cat.plugins) {
    const names = (pl.cmds && pl.cmds.length ? pl.cmds : [pl.name, ...(pl.alias || [])]).filter((v, i, a) => a.indexOf(v) === i)
    const shown = names.slice(0, 5).map(n => `${p}${n}`).join(' ')
    lines.push(`${cat.emo} ${shown}${names.length > 5 ? ` +${names.length - 5}` : ''}`)
  }
  const pages = []
  let cur = ''
  for (const b of lines) {
    if (cur && (cur + '\n' + b).length > LIMIT) { pages.push(cur); cur = '' }
    cur += (cur ? '\n' : '') + b
  }
  if (cur) pages.push(cur)
  const n = pages.length
  return pages.map((t, i) => `${cat.emo} *${cat.title}*${n > 1 ? ` (${i + 1}/${n})` : ''}\n${t}`)
}

function featureText(pl, p) {
  const names = [pl.name, ...(pl.alias || []), ...(pl.cmds || [])].filter((v, i, a) => a.indexOf(v) === i)
  const flags = [pl.owner && 'owner', pl.group && 'grup', pl.admin && 'admin grup', pl.botAdmin && 'bot harus admin'].filter(Boolean)
  return (
    `*${p}${pl.name}* — ${diony.catInfo(pl.category)[0]}\n${short(pl.desc, 240)}\n` +
    `Perintah: ${names.slice(0, 20).map(n => p + n).join(' ')}${names.length > 20 ? ` +${names.length - 20}` : ''}` +
    (flags.length ? `\nSyarat: ${flags.join(', ')}` : '')
  )
}

const modeLine = p => `ℹ️ ${p}menu <perintah> = detail`

async function run(ctx, sendCard, sendMusic) {
  const p = ctx.config.displayPrefix || ctx.prefix
  const cats = buildCats(ctx)
  const want = (ctx.args[0] || '').toLowerCase()

  if (want) {
    if (want === 'semua' || want === 'all') {
      for (const c of cats) for (const page of categoryPages(c, p)) await ctx.reply(page)
      return ctx.reply(modeLine(p))
    }
    const cat = findCategory(cats, want)
    if (cat) {
      for (const page of categoryPages(cat, p)) await ctx.reply(page + `\n\n${modeLine(p)}`)
      return
    }
    // "menu <nama fitur>" -> detail fitur
    const pl = diony.boot().byName.get(want)
    if (pl) return ctx.reply(featureText(pl, p))
    const cc = (ctx.commands || []).find(c => c.name === want || (c.aliases || []).includes(want))
    if (cc) return ctx.reply(`*${p}${cc.name}*${cc.usage ? ' ' + cc.usage : ''}\n${cc.desc}`)
    return ctx.reply(`Kategori "${want}" tidak ada.\nPilih: ${cats.map(c => c.id).join(', ')}\nAtau cari: ${p}fitur <kata>`)
  }

  const status = require('./status')
  status.refreshWeather()
  await sendCard(ctx, mainText(ctx, cats, p), status.now())
  await sendMusic(ctx)
}

// dipakai handler untuk mengenali "menu <kategori>" tanpa prefix
const categoryIds = ctx => buildCats(ctx).flatMap(c => [c.id, norm(c.title)])

module.exports = { run, featureText, short, buildCats, categoryIds }
