/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// UI MENU: kartu logo owner & link (SVG), video thumbnail (ffmpeg), pesan interaktif + tombol
const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const { execFile } = require('child_process')
const sharp = require('./sharp.js')
const ST = require('./style'), AN = require('./ancientsvg'), R = require('./registry')

const FONT = "Poppins, 'DejaVu Sans', Arial, sans-serif"
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// ── LOGO vektor (viewBox 48x48), bukan emoji ──
const ICONS = {
  web: (c) => `<circle cx="24" cy="24" r="14" fill="none" stroke="${c}" stroke-width="3"/><ellipse cx="24" cy="24" rx="6" ry="14" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M10 24h28M12.5 16.5h23M12.5 31.5h23" stroke="${c}" stroke-width="2.5" fill="none"/>`,
  group: (c) => `<path d="M24 8a16 16 0 0 0-13.8 24L8 41l9-2.3A16 16 0 1 0 24 8z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><path d="M18 17.5c-1 2.4 0 6 3.4 9.6s7 4.6 9.4 3.6l1.2-2.8-3.8-1.8-1.8 1.6c-1.6-.8-3.6-2.8-4.6-4.6l1.6-1.8-1.8-3.8z" fill="${c}"/>`,
  channel: (c) => `<path d="M9 20v8h6l13 8V12L15 20z" fill="${c}"/><path d="M33 18a9 9 0 0 1 0 12M37 14a15 15 0 0 1 0 20" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  donate: (c) => `<path d="M24 39C9 29 7 20 11.5 14.5c3.4-4 9.6-3 12.5 2.5 2.9-5.5 9.1-6.5 12.5-2.5C41 20 39 29 24 39z" fill="${c}"/>`,
  wallet: (c) => `<rect x="8" y="14" width="32" height="24" rx="6" fill="none" stroke="${c}" stroke-width="3"/><path d="M8 20h32" stroke="${c}" stroke-width="3"/><rect x="29" y="25" width="11" height="8" rx="3" fill="${c}"/>`,
  user: (c) => `<circle cx="24" cy="17" r="8" fill="${c}"/><path d="M8 40c1-9 8-13 16-13s15 4 16 13z" fill="${c}"/>`,
}
const ITEMS = () => {
  const L = global.links || {}, O = global.ownerInfo || {}
  return [
    { ic: 'web',     col: '#38bdf8', label: 'WEBSITE',        val: String(L.website || '').replace(/^https?:\/\//, '') },
    { ic: 'group',   col: '#22c55e', label: 'GRUP WHATSAPP',  val: 'Gabung komunitas' },
    { ic: 'channel', col: '#a78bfa', label: 'SALURAN',        val: 'Ikuti info terbaru' },
    { ic: 'donate',  col: '#fb7185', label: 'SAWERIA',        val: 'Dukung developer' },
    { ic: 'wallet',  col: '#3b82f6', label: 'DANA',           val: O.dana },
    { ic: 'user',    col: '#fbbf24', label: 'OWNER',          val: `${O.name}  |  ${O.display}` },
  ]
}

async function linksCard(botname) {
  const items = ITEMS()
  let cells = ''
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 52 + col * 448, y = 128 + row * 126
    cells += `<g>
      <rect x="${x}" y="${y}" width="436" height="108" rx="18" fill="#00000033" stroke="${it.col}" stroke-opacity="0.55" stroke-width="2"/>
      <circle cx="${x + 56}" cy="${y + 50}" r="34" fill="${it.col}" fill-opacity="0.16" stroke="${it.col}" stroke-opacity="0.8" stroke-width="2"/>
      <g transform="translate(${x + 56 - 20},${y + 50 - 20}) scale(0.84)">${ICONS[it.ic](it.col)}</g>
      <text x="${x + 110}" y="${y + 40}" font-family="${FONT}" font-size="14" font-weight="700" fill="${it.col}" letter-spacing="2">${it.label}</text>
      <text x="${x + 110}" y="${y + 70}" font-family="${FONT}" font-size="${it.val && it.val.length > 24 ? 17 : 21}" font-weight="700" fill="#fff">${esc(it.val)}</text>
    </g>`
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560" viewBox="0 0 1000 560">
  <defs>${AN.defs('#d4af37')}</defs>
  ${AN.frame(1000, 560, '#d4af37', 28)}
  ${AN.brand(64, 66, botname, 28, 'OWNER &amp; TAUTAN RESMI')}
  ${cells}
  <text x="500" y="528" text-anchor="middle" font-family="${AN.SERIF}" font-size="14" font-weight="600" fill="${AN.C.stone}" letter-spacing="2">TEKAN TOMBOL TAUTAN &amp; KONTAK DI BAWAH PESAN</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// ── VIDEO thumbnail: dua scene (kartu RPG -> kartu logo), zoom pelan + fade, loop ──
const CACHE = path.join(os.tmpdir(), 'chisa-menu-cache')
function ffmpegPath() { try { return require('@ffmpeg-installer/ffmpeg').path || 'ffmpeg' } catch { return 'ffmpeg' } }
function purgeCache() {
  try { for (const f of fs.readdirSync(CACHE)) { const p = path.join(CACHE, f); if (Date.now() - fs.statSync(p).mtimeMs > 3600000) fs.unlinkSync(p) } } catch {}
}
setInterval(purgeCache, 30 * 60 * 1000).unref()   // hemat storage: cache menu dibersihkan tiap 30 menit
async function buildVideo(pngA, pngB) {
  try {
    fs.mkdirSync(CACHE, { recursive: true })
    const key = crypto.createHash('sha1').update(pngA).update(pngB).digest('hex').slice(0, 16)
    const out = path.join(CACHE, key + '.mp4')
    if (fs.existsSync(out)) return fs.readFileSync(out)
    const a = path.join(CACHE, key + 'a.png'), b = path.join(CACHE, key + 'b.png')
    fs.writeFileSync(a, pngA); fs.writeFileSync(b, pngB)
    const zoom = (i) => `[${i}:v]scale=1000:560,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1000x560:fps=25,format=yuv420p[v${i}]`
    const args = ['-y', '-loop', '1', '-t', '4.5', '-i', a, '-loop', '1', '-t', '4.5', '-i', b,
      '-filter_complex', `${zoom(0)};${zoom(1)};[v0][v1]xfade=transition=fade:duration=0.8:offset=3.7,format=yuv420p[v]`,
      '-map', '[v]', '-t', '8.2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-movflags', '+faststart', '-an', out]
    await new Promise((res, rej) => execFile(ffmpegPath(), args, { timeout: 30000 }, (e) => e ? rej(e) : res()))
    for (const f of [a, b]) try { fs.unlinkSync(f) } catch {}
    purgeCache()
    return fs.readFileSync(out)
  } catch (e) { console.log('[menu video] gagal:', e.message); return null }
}

// ── TOMBOL: 1 tombol daftar "Tautan & Kontak" (isi banyak tautan) + 1 tombol All Menu ──
const httpUrl = (u) => (/^https?:\/\//i.test(u) ? u : 'https://' + u)
// kunci -> { glyph, title, desc, kind, value }
function linkDefs() {
  const L = global.links || {}, O = global.ownerInfo || {}, D = []
  if (L.website) D.push({ key: 'website', g: '✦', title: 'Website', desc: String(L.website).replace(/^https?:\/\//, ''), url: L.website })
  if (L.group) D.push({ key: 'grup', g: '✦', title: 'Grup WhatsApp', short: 'Grup', desc: 'Gabung komunitas', url: L.group })
  if (L.channel) D.push({ key: 'saluran', g: '✦', title: 'Saluran WhatsApp', short: 'Saluran', desc: 'Ikuti info terbaru', url: L.channel })
  if (L.telegram) D.push({ key: 'telegram', g: '✦', title: 'Telegram', desc: String(L.telegram).replace(/^https?:\/\//, ''), url: L.telegram })
  if (O.number) D.push({ key: 'owner', g: '✦', title: 'Chat Owner', desc: `${O.name} • ${O.display}`, url: 'wa.me/' + O.number })
  if (L.saweria) D.push({ key: 'saweria', g: '✦', title: 'Saweria', desc: 'Dukung developer', url: L.saweria })
  if (O.dana) D.push({ key: 'dana', g: '✦', title: 'Salin Nomor DANA', desc: O.dana, copy: O.dana })
  return D
}
// satu daftar pilihan: kategori menu (dari registry, sesuai hak akses pengguna) + tautan resmi + kontak. Tombol kedua: All Menu.
function buttons(viewer) {
  const defs = linkDefs(), row = (d) => ({ header: '', title: ST.cut(d.title, 24), description: ST.cut(d.desc, 72), id: `.link ${d.key}` })
  const v = R.view(R.build(), viewer || { isOwner: false, isDev: false })
  const sections = [
    { title: ST.B('Menu Categories'), rows: v.categories.map(c => ({ header: '', title: ST.cut(`${pad2(c.no)} ${c.title}`, 24), description: ST.cut(`${c.count} command • ${c.summary}`, 72), id: `.menu ${c.id}` })) },
    { title: ST.B('Tautan Resmi'), rows: defs.filter(d => ['website', 'grup', 'saluran', 'telegram'].includes(d.key)).map(row) },
    { title: ST.B('Kontak & Donasi'), rows: defs.filter(d => ['owner', 'saweria', 'dana'].includes(d.key)).map(row) },
  ].filter(x => x.rows.length)
  return [
    { name: 'single_select', buttonParamsJson: JSON.stringify({ title: `◈ ${ST.B('Kategori & Tautan')}`, sections }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `◈ ${ST.B('All Menu')}`, id: '.allmenu' }) },
  ]
}
// tombol untuk satu tautan (dipakai .link)
function linkButton(d) {
  if (d.copy) return { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: `${d.g} ${ST.B('Salin Nomor')}`, id: 'copy_' + d.key, copy_code: d.copy }) }
  return { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: ST.cut(`${d.g} ${ST.B('Buka ' + (d.short || d.title))}`, 30), url: httpUrl(d.url), merchant_url: httpUrl(d.url) }) }
}

// ── TAMPILAN MENU — semua dibangun dari lib/registry.js (kategori, nama tampilan, permission) ──
const VERSION = (() => { try { return require('../package.json').version } catch { return '4.7.6' } })()
const BAR = '━━━━━━━━━━━━━━━━━━'
const TAG = { owner: ' [owner]', dev: ' [dev]', premium: ' [premium]', admin: ' [admin]' }
const pad2 = (n) => String(n).padStart(2, '0')
const quote = (text) => String(text).split('\n').map(l => '> ' + (l === '' ? '⠀' : l)).join('\n')   // blok kutipan WhatsApp = latar gelap; baris kosong = braille blank agar blok menyambung
const viewerOf = (ctx) => ({ isOwner: !!(ctx && (ctx.isOwner || ctx.isCreator)), isDev: !!(ctx && ctx.isDev) })
const viewFor = (viewer) => R.view(R.build(), viewer || { isOwner: false, isDev: false })

// '.a .b .c' dipecah per baris supaya tidak terpotong di layar ponsel
function wrapCmds(prefix, cmds, width = 38) {
  const lines = []; let cur = ''
  for (const c of cmds) { const t = prefix + c; if (cur && (cur + ' ' + t).length > width) { lines.push(cur); cur = t } else cur = cur ? cur + ' ' + t : t }
  if (cur) lines.push(cur); return lines
}
// satu fitur → baris menu: "◈ .perintah — Nama Fitur [tag]" + daftar command lain di bawahnya
function featureLines(prefix, x) {
  const tag = TAG[x.perm] || ''
  if (x.rows) return x.rows.map(r => `┃ ◈ ${prefix}${r[0]} — ${r[1]}${TAG[r[2] || x.perm] || ''}`)
  const list = x.show || x.cmds.map(c => c.cmd), out = [`┃ ◈ ${prefix}${list[0]} — ${x.title}${tag}`], base = String(list[0]).split(' ')[0]
  const subs = list.slice(1).filter(c => c.startsWith(base + ' ')).map(c => c.slice(base.length + 1)), rest = list.slice(1).filter(c => !c.startsWith(base + ' '))
  if (subs.length) for (const l of wrapCmds('', subs, 34)) out.push(`┃    ↳ ${prefix}${base} ${l.replace(/ /g, ' · ')}`.replace(new RegExp(`^(┃    ↳ ${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${base}) `), '$1 › '))
  for (const l of wrapCmds(prefix, rest)) out.push('┃    ↳ ' + l)
  return out
}
// satu kategori → blok teks (header + satu blok per sub-bagian)
function categoryBlocks(prefix, cat) {
  const head = [`╭━━〔 ${pad2(cat.no)} · ${cat.title} 〕`, `┃ ${cat.summary}`, `┃ ${cat.count} command  •  ${cat.features.length} fitur`, `╰${BAR}`].join('\n')
  return [head, ...cat.subs.map(sub => [`❖ ${sub.name.toUpperCase()}`, ...sub.features.flatMap(x => featureLines(prefix, x))].join('\n'))]
}
// blok → halaman (≤ max karakter). blok yang terlalu panjang dipecah per baris.
function paginate(blocks, max = 3200) {
  const pages = []; let cur = ''
  const push = () => { if (cur.trim()) pages.push(cur.trimEnd()); cur = '' }
  for (const b of blocks.flatMap(b => b.length <= max ? [b] : b.split('\n').reduce((acc, l) => { const last = acc[acc.length - 1]; if (last !== undefined && (last + '\n' + l).length <= max) acc[acc.length - 1] = last + '\n' + l; else acc.push(l); return acc }, []))) {
    if (cur && (cur + '\n\n' + b).length > max) push()
    cur = cur ? cur + '\n\n' + b : b
  }
  push(); return pages
}
const footerOf = (prefix, i, n) => `${BAR}\n◈ Halaman ${i + 1}/${n}  •  ${prefix}menu = menu utama  •  ${prefix}allmenu = semua kategori`
const withFooter = (prefix, pages) => pages.map((t, i) => quote(`${t}\n\n${footerOf(prefix, i, pages.length)}`))

// halaman satu kategori (teks siap kirim)
function categoryPages(prefix, cat, max) { return withFooter(prefix, paginate(categoryBlocks(prefix, cat), max)) }
// semua kategori berurutan, dipaginasi bersama
function totalBlock(prefix, v) {
  return [`╭━━〔 TOTAL FITUR 〕`, `┃ Total Fitur : ${v.total}`, `╰${BAR}`, ...v.categories.map(c => `${pad2(c.no)} ◈ ${c.title} — ${c.count} command • ${c.features.length} fitur`)].join('\n')
}
// ── ALL MENU gaya Pix Bot: judul → sapaan/status → Total Fitur → keterangan → tiap kategori berisi daftar command datar ──
// Tanpa ringkasan & jumlah per kategori; hanya satu angka Total Fitur di atas (sama seperti Pix Bot).
const LEGEND = { owner: 'Hanya untuk owner', dev: 'Hanya untuk developer', premium: 'Hanya untuk premium', admin: 'Hanya untuk admin grup' }
function greetingNow() {
  let h; try { h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: require('./settingsdb').get('timezone') || 'Asia/Jakarta' }).format(new Date())) % 24 } catch { h = new Date().getHours() }
  return h < 4 ? 'Selamat malam' : h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
}
function flatCategory(prefix, cat) {
  const lines = []
  for (const x of cat.features) for (const k of x.cmds) lines.push(`┃ ◈ ${prefix}${k.cmd}${TAG[k.perm] || ''}`)
  return [`╭━━〔 ${cat.title} 〕`, ...lines, `╰${BAR}`].join('\n')
}
function allPages(prefix, viewer, max, who = {}) {
  const v = viewFor(viewer), role = viewer && viewer.isDev ? 'Developer' : viewer && viewer.isOwner ? 'Owner' : (who.role || 'User')
  const used = new Set(v.categories.flatMap(c => c.features.flatMap(x => x.cmds.map(k => k.perm))).filter(p => LEGEND[p]))
  const head = [`╭━━〔 ALL MENU 〕`, `┃ ${greetingNow()}${who.name ? ', ' + who.name : ''}`, `┃ ◈ Status : ${role}`, `┃ ◈ Total Fitur : ${v.total} Command`, `╰${BAR}`].join('\n')
  const legend = used.size ? [`╭━━〔 KETERANGAN 〕`, ...Array.from(used).map(p => `┃ ${TAG[p].trim()} = ${LEGEND[p]}`), `╰${BAR}`].join('\n') : ''
  const tail = `◈ ${prefix}menu = menu utama  •  ${prefix}allmenu detail <kategori> = dengan penjelasan`
  return paginate([head, legend, ...v.categories.map(c => flatCategory(prefix, c)), tail].filter(Boolean), max).map(quote)
}
// satu kategori (.allmenu <kategori>) dengan gaya yang sama
function flatCategoryPages(prefix, cat, max) { return paginate([flatCategory(prefix, cat)], max).map(quote) }

// detail satu fitur / command (.menu <command>)
function featureDetail(prefix, x, cat) {
  let CT; try { CT = require('./catalog') } catch {}
  const list = x.show || x.cmds.map(c => c.cmd)
  const lines = [`╭━━〔 ${x.title} 〕`, `┃ Kategori : ${cat ? cat.title : '-'}${x.sub ? '  ›  ' + x.sub : ''}`]
  const acc = TAG[x.perm]; if (acc) lines.push(`┃ Akses    : ${acc.trim().replace(/[\[\]]/g, '')} saja`)
  const d = x.desc || ''; if (d) lines.push(`┃ Fungsi   : ${d}`)
  lines.push(`╰${BAR}`)
  const body = []
  for (const r of (x.rows || list.map(c => [c]))) {
    const e = CT && CT.describe ? CT.describe(r[0]) : null
    body.push(`◈ ${prefix}${e ? e.sig : r[0]}${r[1] ? ' — ' + r[1] : ''}`)
    if (e && e.desc) body.push(`   ${e.desc}`)
    if (e && e.ex) body.push(`   Contoh : ${prefix}${e.ex}`)
  }
  if (x.aliases && x.aliases.length) body.push('', `Alias : ${x.aliases.slice(0, 12).map(a => prefix + a).join('  ')}`)
  return quote([...lines, '', ...body].join('\n'))
}

// .menu <kategori | nomor | command> → true bila ditangani. Tidak pernah menampilkan fitur yang di luar hak akses pengguna.
async function sendTopic(sock, m, { topic, prefix, viewer }) {
  const v = viewFor(viewer), id = R.resolveCategory(topic, v)
  const send = (t, i) => sock.sendMessage(m.chat, { text: ST.fx(t) }, i === 0 ? { quoted: m } : {})
  if (id) { const pages = categoryPages(prefix, v.categories.find(c => c.id === id)); for (let i = 0; i < pages.length; i++) await send(pages[i], i); return true }
  const key = R.headOf(topic), model = R.build(), x = R.findFeature(key, model)
  const vis = x && v.categories.some(c => c.features.some(y => y.title === x.title && y.sub === x.sub))
  if (x && vis) { const cat = v.categories.find(c => c.id === x.cat); await send(featureDetail(prefix, v.categories.flatMap(c => c.features).find(y => y.title === x.title && y.sub === x.sub) || x, cat), 0); return true }
  const sg = R.suggest(key, 3)
  await send(quote([`✕ "${topic}" bukan kategori atau command yang terdaftar.`, '', ...(sg.length ? [`Mungkin maksudmu: ${sg.map(c => prefix + c).join('  ')}`, ''] : []), `Kategori: ${v.categories.map(c => c.id).join(', ')}`, `Contoh  : ${prefix}menu ai   •   ${prefix}menu 3   •   ${prefix}menu ping`].join('\n')), 0)
  return true
}

// ── kompatibilitas API lama (dipakai plugin lain): daftar kategori & satu string menu ──
function menuSections(_plugins, viewer) { return viewFor(viewer).categories.map(c => ({ id: c.id, label: c.title, cmds: c.cmds || c.features.flatMap(x => x.cmds.map(k => k.cmd)) })) }
function resolveCategory(input, sections) { const id = R.resolveCategory(input, { categories: (sections || viewFor()).map(s => ({ id: s.id, title: s.label || s.title, aliases: (R.CATEGORIES.find(c => c.id === s.id) || {}).aliases || [] })) }); return id }
function buildAllMenu(prefix, _plugins, _botname, only, viewer) {
  const v = viewFor(viewer), cats = only ? v.categories.filter(c => c.id === only) : v.categories
  return withFooter(prefix, paginate(cats.flatMap(c => categoryBlocks(prefix, c)), 100000)).join('\n')
}

// ── CAPTION MENU UTAMA (dark-tech): identitas bot, akun pengguna, statistik sistem, daftar kategori ──
function caption({ prefix, botname, role, status, mode, level, limit, uptime, prefixes, viewer, info } = {}) {
  const O = global.ownerInfo || {}, L = global.links || {}, bot = botname || (global.settingsDefault && global.settingsDefault.botname) || 'CHISA AI'
  const name = ST.plain(bot).toUpperCase() || 'CHISA AI', owner = String(O.brand || O.name || 'SHIPUR').toUpperCase(), year = new Date().getFullYear(), pf = prefix || '.'
  const maint = (() => { try { return require('./settingsdb').get('maintenance') } catch { return false } })()
  const v = viewFor(viewer), spaced = name.split('').join(' ')
  const lines = [
    ...(info ? [info, ''] : []),
    `╭━━━〔 ${spaced} 〕━━━╮`, '┃ ADVANCED CORE SYSTEM', `┃ Version : ${VERSION}`, `┃ Status  : ${maint ? 'Maintenance' : 'Operational'}`, `┃ Mode    : ${String(mode || 'Public').split(' ')[0]}`, `┃ Prefix  : ${prefixes || pf}${viewer && viewer.isOwner ? '  (owner: tanpa prefix juga bisa)' : ''}`, `╰${BAR}━━━`, '',
    '╭━━〔 USER 〕', `┃ ◈ Name   : ${role || 'User'}`, `┃ ◈ Access : ${status || 'Free User'}`, `┃ ◈ Level  : ${level ?? 1}`, `┃ ◈ Limit  : ‎${limit ?? '∞'}‎`, `╰${BAR}`, '',
    '╭━━〔 SYSTEM 〕', `┃ ◈ Uptime : ${uptime || '-'}`, `┃ ◈ RAM    : ${Math.round(process.memoryUsage().rss / 1048576)} MB`, `┃ ◈ Menu   : ${v.categories.length} kategori`, `┃ ◈ Total Fitur : ${v.total}`, `╰${BAR}`, '',
    `╭━━〔 MENU CATEGORIES 〕`,
    ...v.categories.map(c => `┃ ${pad2(c.no)} ◈ ${c.title} — ${c.count}`),
    `╰${BAR}`, '',
    `◈ ${pf}menu <nama|no> — buka satu kategori`, `◈ ${pf}menu <command> — detail satu command`, `◈ ${pf}allmenu — semua command per kategori`, `◈ ${pf}allmenu detail <kategori> — dengan penjelasan`, '',
    ...(L.website ? [`◈ Website : ${httpUrl(L.website)}`] : []), ...(L.channel ? [`◈ Saluran : ${httpUrl(L.channel)}`] : []), ...(L.group ? [`◈ Grup    : ${httpUrl(L.group)}`] : []),
    '', `© ${year} ${owner} • ${name} Official Bot`,
  ]
  return quote(lines.join('\n'))
}

// ── QUOTE "WhatsApp Business" centang biru (orderMessage palsu dari akun resmi WA Business) ──
const BIZ_JID = '13135550002@s.whatsapp.net'   // akun resmi WhatsApp Business (verified)
function bizQuote() { return require('./dquote').contextInfo() }   // judul = nama bot (Chisa AI), centang biru dari akun resmi WA Business
// kartu judul + footer di bawah media (externalAdReply)
let _adThumb
async function adCard() {
  const O = global.ownerInfo || {}, L = global.links || {}, D = global.settingsDefault || {}
  if (_adThumb === undefined) { try { _adThumb = await sharp(path.join(ROOT, 'lib', 'media', 'thumb.jpg')).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer() } catch { _adThumb = null } }
  const dom = String(L.website || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toUpperCase()
  return { title: ST.fx(ST.plain(D.botname || 'CHISA AI').toUpperCase() + ' V' + (D.version || '2')), body: ST.fx(`© ${ST.plain(D.botname || 'CHISA AI').toUpperCase()} • ${dom || String(O.brand || 'SHIPUR').toUpperCase()}`), mediaType: 1, renderLargerThumbnail: false, showAdAttribution: false, sourceUrl: L.website || 'https://whatsapp.com', ...(_adThumb ? { thumbnail: _adThumb } : {}) }
}

// ── KIRIM pesan interaktif (header video/gambar/tanpa media + tombol) ──
// opts.biz = true -> quote WhatsApp Business centang biru + kartu judul (gaya menu utama)
async function sendInteractive(sock, m, media, body, footer, btns, opts = {}) {
  const { generateWAMessageFromContent, prepareWAMessageMedia } = require('./baileys')
  const up = { upload: sock.waUploadToServer }
  let header = { hasMediaAttachment: false }
  if (media && media.video) { const h = await prepareWAMessageMedia({ video: media.video, gifPlayback: true, mimetype: 'video/mp4' }, up); h.videoMessage.gifPlayback = true; header = { hasMediaAttachment: true, videoMessage: h.videoMessage } }
  else if (media && media.image) { const h = await prepareWAMessageMedia({ image: media.image }, up); header = { hasMediaAttachment: true, imageMessage: h.imageMessage } }
  const interactiveMessage = { body: { text: ST.fx(body) }, footer: { text: ST.fx(footer || '') }, header, nativeFlowMessage: { buttons: btns || buttons(), messageParamsJson: '' } }
  if (opts.biz !== false) interactiveMessage.contextInfo = { ...bizQuote(), externalAdReply: await adCard() }
  const msg = generateWAMessageFromContent(m.chat, { viewOnceMessage: { message: {
    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
    interactiveMessage,
  } } }, { userJid: m.chat, ...(opts.biz !== false ? {} : { quoted: m }), upload: sock.waUploadToServer })
  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}


// ── SATU PESAN (v4.21): media + isi menu + semua tombol dalam SATU pesan interaktif ──
// Tombol: daftar "Kategori & Tautan" (kategori menu, website, grup, saluran, telegram, saweria, DANA) + tombol Chat Owner (kontak)
// + satu tombol navigasi (All Menu dari .menu, Menu dari .allmenu). Gagal kirim -> pemanggil jatuh ke cara lama (sendMenuSafe).
// Matikan lewat chat: .set menusingle off
function oneButtons(viewer, nav) {
  const O = global.ownerInfo || {}, out = [buttons(viewer)[0]]
  if (O.number) out.push(linkButton({ key: 'owner', g: '✦', title: 'Chat Owner', short: 'Owner', url: 'wa.me/' + O.number }))
  out.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify(nav === 'menu' ? { display_text: `◈ ${ST.B('Menu')}`, id: '.menu' } : { display_text: `◈ ${ST.B('All Menu')}`, id: '.allmenu' }) })
  return out
}
async function sendOne(sock, m, { media, body, footer, viewer, nav }) {
  await sendInteractive(sock, m, media && (media.video || media.image) ? media : null, body, footer, oneButtons(viewer, nav), { biz: false, viewer })
  return true
}

// ── KIRIM MENU AMAN ──
// Masalah lama: pesan interaktif (nativeFlow + viewOnce) diterima server WhatsApp tanpa error, tetapi sebagian HP/versi WA
// (iOS, WA lama, beberapa Android) TIDAK menampilkannya -> menu "hilang" dan fallback tidak pernah jalan.
// Perbaikan: isi menu SELALU dikirim sebagai pesan biasa (render di semua HP), lalu tombol dikirim sebagai pesan
// interaktif kecil TERPISAH (best-effort; kalau HP tidak mendukung, menu teks tetap terbaca & command bisa diketik).
async function sendMenuSafe(sock, m, { media, body, footer, btns, viewer, hint } = {}) {
  const text = ST.fx(body)
  let sent = false
  // 1) media (video GIF / gambar) sebagai pesan sendiri, tanpa caption panjang (batas caption WA lebih kecil dari teks)
  if (media && (media.video || media.image)) {
    try { await sock.sendMessage(m.chat, media.video ? { video: media.video, gifPlayback: true, mimetype: 'video/mp4' } : { image: media.image }, { quoted: m }); sent = true }
    catch (e) { console.log('[menu media gagal, lanjut teks]', e.message) }
  }
  // 2) teks menu: pesan teks POLOS (tanpa kartu/contextInfo tambahan) — jenis pesan yang sama dengan canvas & audio yang pasti tampil
  try { await sock.sendMessage(m.chat, { text }, sent ? {} : { quoted: m }); sent = true }
  catch (e) { console.log('[menu teks gagal]', e.message); throw e }
  // 3) tombol: pesan interaktif ringkas, terpisah. Gagal/tidak tampil di HP tertentu = tidak masalah.
  if (btns !== false) {
    try { await sendInteractive(sock, m, null, hint || 'Pilih kategori atau tautan lewat tombol di bawah', footer, btns || buttons(viewer), { biz: false, viewer }) }
    catch (e) { console.log('[menu tombol dilewati]', e.message) }
  }
  return sent
}

// ── MEDIA MENU dari file (video thumbnail + audio) ──
const ROOT = path.join(__dirname, '..')
const EXT = { video: /\.(mp4|mov|mkv|webm|gif)$/i, audio: /\.(mp3|ogg|opus|m4a|wav|aac)$/i }
// kembalikan path absolut file media, atau null. Urutan: file persis -> file pertama di folder yang sama -> (kalau path = folder) file pertama di folder itu
function mediaPath(kind) {
  try {
    const cfg = (global.menuMedia || {})[kind]; if (!cfg) return null
    const abs = path.isAbsolute(cfg) ? cfg : path.join(ROOT, cfg)
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs
    const dir = fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? abs : path.dirname(abs)
    if (!fs.existsSync(dir)) return null
    const f = fs.readdirSync(dir).filter(x => EXT[kind].test(x)).sort()[0]
    return f ? path.join(dir, f) : null
  } catch { return null }
}

// ── GIF MENU: video/GIF apa pun -> klip senyap, kecil, loop (format yang WhatsApp tampilkan sebagai GIF). Di-cache; gagal -> file asli ──
async function gifVideo(src) {
  const raw = fs.readFileSync(src)
  try {
    fs.mkdirSync(CACHE, { recursive: true })
    const st = fs.statSync(src), key = crypto.createHash('sha1').update(src + st.size + st.mtimeMs).digest('hex').slice(0, 16)
    const out = path.join(CACHE, 'g' + key + '.mp4')
    if (fs.existsSync(out)) { try { fs.utimesSync(out, new Date(), new Date()) } catch {} return fs.readFileSync(out) }
    const args = ['-y', ...(/\.gif$/i.test(src) ? ['-ignore_loop', '0'] : []), '-i', src, '-t', '8', '-an',
      '-vf', 'fps=15,scale=480:-2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'baseline', '-preset', 'veryfast', '-crf', '28', '-movflags', '+faststart', out]
    await new Promise((res, rej) => execFile(ffmpegPath(), args, { timeout: 60000 }, (e) => e ? rej(e) : res()))
    return fs.readFileSync(out)
  } catch (e) { console.log('[menu gif] konversi gagal, pakai file asli:', e.message); return raw }
}

// ── AUDIO di bawah menu: dikirim sebagai voice note (opus, di-cache); kalau ffmpeg gagal kirim file aslinya ──
async function sendAudio(sock, m) {
  const src = mediaPath('audio'); if (!src) return false
  try {
    fs.mkdirSync(CACHE, { recursive: true })
    const st = fs.statSync(src), key = crypto.createHash('sha1').update(src + st.size + st.mtimeMs).digest('hex').slice(0, 16)
    const out = path.join(CACHE, 'a' + key + '.ogg')
    if (!fs.existsSync(out)) await new Promise((res, rej) => execFile(ffmpegPath(), ['-y', '-i', src, '-vn', '-c:a', 'libopus', '-b:a', '48k', '-vbr', 'on', out], { timeout: 60000 }, (e) => e ? rej(e) : res()))
    await sock.sendMessage(m.chat, { audio: fs.readFileSync(out), mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
    return true
  } catch (e) {
    console.log('[menu audio] ogg gagal, kirim file asli:', e.message)
    try { await sock.sendMessage(m.chat, { audio: fs.readFileSync(src), mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); return true } catch (e2) { console.log('[menu audio] gagal:', e2.message); return false }
  }
}

// ── FOTO thumbnail (bukan video) untuk .allmenu: thumb.jpg diperkecil & di-cache di memori ──
let _thumb
async function thumbPhoto() {
  if (_thumb !== undefined) return _thumb
  const src = path.join(ROOT, 'lib', 'media', 'thumb.jpg')
  try { _thumb = await sharp(src).resize({ width: 1000, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer() }
  catch { try { _thumb = fs.readFileSync(src) } catch { _thumb = null } }
  return _thumb
}

// ── ALL MENU: SATU pesan saja (foto + seluruh daftar menu sebagai satu teks/caption, tombol bila didukung) ──
// Catatan: dulu .allmenu mengirim kartu canvas + beberapa halaman teks terpisah. Sekarang semua
// digabung jadi satu blok teks oleh allPages()/categoryPages() (dipanggil dengan batas karakter
// yang sangat besar sehingga selalu menghasilkan 1 halaman), dan blok itu dikirim sebagai SATU
// pesan WhatsApp (gambar+caption bila ada foto, atau teks biasa bila tidak).
const _sending = new Map()   // cegah pesan ganda dari klik beruntun
async function sendAllMenu(sock, m, { pages, text, canvas, footer, viewer }) {
  const key = m.chat + '|' + (m.sender || ''), last = _sending.get(key) || 0
  if (Date.now() - last < 2500) return false
  _sending.set(key, Date.now()); setTimeout(() => _sending.delete(key), 5000)
  const list = pages && pages.length ? pages : [text]
  const full = list.join('\n\n')
  const photo = canvas || await thumbPhoto()
  const btns = [buttons(viewer)[0], { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `${ST.B('Menu')}`, id: '.menu' }) }]
  if (require('./settingsdb').get('menusingle') !== false) {
    try { return await sendOne(sock, m, { media: photo ? { image: photo } : null, body: full, footer, viewer, nav: 'menu' }) }
    catch (e) { console.log('[allmenu satu pesan gagal, pakai cara lama]', e.message) }
  }
  try { return await sendMenuSafe(sock, m, { media: photo ? { image: photo } : null, body: full, footer, btns, viewer, hint: 'Buka kategori atau tautan lewat tombol di bawah' }) }
  catch (e) {
    console.log('[allmenu]', e.message)
    await sock.sendMessage(m.chat, { text: ST.fx(full) }, { quoted: m })   // upaya terakhir: teks polos
    return true
  }
}

// ── KARTU KATALOG (.allmenu) ──
async function catalogCard(botname, tiles, totals) {
  const W = 1000, H = 520, name = ST.plain(botname).toUpperCase() || 'CHISA AI'
  const t = tiles.map((c, i) => { const col = i % 4, row = Math.floor(i / 4), x = 56 + col * 224, y = 306 + row * 94
    return `<g><rect x="${x}" y="${y}" width="208" height="82" rx="14" fill="#ffffff0a" stroke="${AN.C.gold}" stroke-opacity="0.45"/>
      <text x="${x + 104}" y="${y + 38}" text-anchor="middle" font-family="${AN.SERIF}" font-size="26" font-weight="700" fill="url(#agold)">${esc(c.n)}</text>
      <text x="${x + 104}" y="${y + 62}" text-anchor="middle" font-family="${AN.SANS}" font-size="12" font-weight="600" fill="${AN.C.stone}" letter-spacing="2">${esc(c.t.toUpperCase())}</text></g>` }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${AN.defs()}</defs>${AN.frame(W, H)}
  ${AN.eye(W / 2 - 80, 36, 160)}
  <text x="${W / 2}" y="196" text-anchor="middle" font-family="${AN.SERIF}" font-size="54" font-weight="700" fill="url(#agold)" letter-spacing="14">${esc(name)}</text>
  <text x="${W / 2}" y="232" text-anchor="middle" font-family="${AN.SERIF}" font-size="20" fill="${AN.C.sand}" letter-spacing="9">KATALOG LENGKAP</text>
  <text x="${W / 2}" y="264" text-anchor="middle" font-family="${AN.SANS}" font-size="15" font-weight="600" fill="${AN.C.stone}">${esc(totals)}</text>
  <rect x="${W / 2 - 150}" y="276" width="300" height="2" fill="url(#agold)" opacity="0.6"/>
  ${t}</svg>`
  return AN.render(svg)
}

module.exports = { sendOne, oneButtons, sendMenuSafe, adCard, gifVideo, bizQuote, mediaPath, sendAudio, linksCard, buildVideo, buttons, linkDefs, linkButton, caption, buildAllMenu, menuSections, resolveCategory, sendAllMenu, sendInteractive, catalogCard, categoryPages, allPages, flatCategoryPages, categoryBlocks, paginate, featureDetail, sendTopic, viewerOf, viewFor, quote, VERSION }
