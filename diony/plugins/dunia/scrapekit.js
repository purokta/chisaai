/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Scraper Web (tanpa API key). Semua pengambilan lewat lib/netguard.js (anti-SSRF, batas ukuran, batas waktu):
//   .kabar <sumber>      berita terbaru dari RSS media (detik, cnn, cnbc, tempo, republika, suara)
//   .trending            topik yang sedang ramai dicari di Google Trends Indonesia
//   .kbbi <kata>         arti kata dari kbbi.web.id
//   .resep <nama>        cari resep di Cookpad
//   .emas                harga emas Antam hari ini (logammulia.com)
//   .og <url>            pratinjau tautan: judul, deskripsi, gambar (OpenGraph)
//   .artikel <url>       ambil isi teks utama sebuah artikel web
// Halaman web bisa berubah kapan saja: tiap fitur gagal dengan pesan jelas, bukan crash.
const NG = require('../../lib/netguard'), { B } = require('../../lib/style')

const LINE = '━━━━━━━━━━━━━━━━━━━━'
const COOLDOWN = 5000, last = new Map()
const ALIAS = {
  kabar: 'kabar', rss: 'kabar', beritasumber: 'kabar',
  trending: 'trending', trend: 'trending', gtrends: 'trending',
  kbbi: 'kbbi',
  resep: 'resep', cookpad: 'resep',
  emas: 'emas', hargaemas: 'emas', antam: 'emas',
  og: 'og', linkpreview: 'og', preview: 'og',
  artikel: 'artikel', bacaweb: 'artikel', readweb: 'artikel',
}
const FEEDS = {
  detik: 'https://rss.detik.com/index.php/detikcom',
  cnn: 'https://www.cnnindonesia.com/nasional/rss',
  cnbc: 'https://www.cnbcindonesia.com/news/rss',
  tempo: 'https://rss.tempo.co/nasional',
  republika: 'https://www.republika.co.id/rss',
  suara: 'https://www.suara.com/rss',
}
const BROWSER = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36', 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.5' }

// ───────── pembantu teks/HTML (tanpa dependency, bisa diuji lokal) ─────────
const ent = (s) => String(s).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(+n) } catch { return '' } }).replace(/&#x([0-9a-f]+);/gi, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)) } catch { return '' } })
const strip = (s) => ent(String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s }
const ago = (d) => { const t = Date.parse(d); if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'baru saja' : m < 60 ? `${m} menit lalu` : m < 1440 ? `${Math.round(m / 60)} jam lalu` : `${Math.round(m / 1440)} hari lalu` }

function parseRss(xml, n = 8) {
  return [...String(xml).matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)].slice(0, n).map(([, it]) => {
    const g = (t) => { const r = it.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`, 'i')); return r ? strip(r[1]) : '' }
    return { title: g('title'), link: g('link'), date: g('pubDate'), traffic: g('ht:approx_traffic') }
  }).filter(x => x.title)
}
function parseMeta(html) {
  const head = String(html).slice(0, 300000)
  const metas = {}
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const k = (tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1], v = (tag.match(/content\s*=\s*"([^"]*)"/i) || tag.match(/content\s*=\s*'([^']*)'/i) || [])[1]
    if (k && v != null && metas[k.toLowerCase()] == null) metas[k.toLowerCase()] = ent(v).trim()
  }
  const title = metas['og:title'] || metas['twitter:title'] || strip((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '')
  return { title, desc: metas['og:description'] || metas['twitter:description'] || metas.description || '', site: metas['og:site_name'] || '', image: metas['og:image'] || metas['twitter:image'] || '', type: metas['og:type'] || '', author: metas.author || metas['article:author'] || '', time: metas['article:published_time'] || '' }
}
function parseArticle(html) {
  let h = String(html).replace(/<(script|style|noscript|svg|nav|footer|header|aside|form)\b[\s\S]*?<\/\1>/gi, ' ')
  const scope = (h.match(/<article\b[\s\S]*?<\/article>/i) || [])[0] || h
  const paras = [...scope.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => strip(m[1])).filter(p => p.length >= 50 && !/^(baca juga|simak|advertisement|iklan|copyright)/i.test(p))
  return paras.filter((p, i) => paras.indexOf(p) === i)
}
const abs = (href, base) => { try { return new URL(href, base).href } catch { return '' } }

async function get(url, o = {}) {
  const r = await NG.safeFetch(url, { timeout: 15000, maxBytes: 1.5 * 1024 * 1024, truncate: true, headers: BROWSER, ...o })
  if (r.status >= 400) throw Object.assign(new Error('situs membalas HTTP ' + r.status), { code: 'EHTTP' })
  return { ...r, text: r.buffer.toString('utf8') }
}
const cheerio = () => { try { return require('cheerio') } catch { throw new Error('modul cheerio belum terpasang (jalankan npm install)') } }

// ───────── fitur ─────────
const F = {
  async kabar({ text, prefix, reply }) {
    const k = String(text || '').trim().toLowerCase().split(/\s+/)[0]
    if (!k || !FEEDS[k]) return reply(`${B('KABAR')}\nBerita terbaru langsung dari RSS media.\nSumber: ${Object.keys(FEEDS).join(', ')}\nContoh: ${prefix}kabar cnn`)
    const { text: xml } = await get(FEEDS[k]), items = parseRss(xml)
    if (!items.length) throw new Error('RSS kosong atau formatnya berubah')
    return reply(`${B('KABAR ' + k.toUpperCase())}\n${LINE}\n` + items.map((x, i) => `${i + 1}. *${clip(x.title, 160)}*\n   ${ago(x.date)}\n   ${x.link}`).join('\n\n') + `\n\n_Sumber: ${k}_`)
  },

  async trending({ reply }) {
    const { text: xml } = await get('https://trends.google.com/trending/rss?geo=ID'), items = parseRss(xml, 12)
    if (!items.length) throw new Error('data Google Trends kosong')
    return reply(`${B('TRENDING INDONESIA')}\n${LINE}\n` + items.map((x, i) => `${i + 1}. ${x.title}${x.traffic ? ` — ${x.traffic} pencarian` : ''}`).join('\n') + '\n\n_Sumber: Google Trends_')
  },

  async kbbi({ text, prefix, reply }) {
    const w = String(text || '').trim().toLowerCase().replace(/\s+/g, ' ')
    if (!w || w.length > 40) return reply(`${B('KBBI')}\nContoh: ${prefix}kbbi gawai`)
    const { text: html } = await get('https://kbbi.web.id/' + encodeURIComponent(w))
    const $ = cheerio().load(html), box = $('#d1').first()
    let body = box.length ? ent(box.html().replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim() : ''
    if (!body || /tidak ditemukan|tidak ada/i.test(body.slice(0, 80))) return reply(`Kata *${w}* tidak ditemukan di KBBI.`)
    return reply(`${B('KBBI')} — ${w}\n${LINE}\n${clip(body, 1500)}\n\n_Sumber: kbbi.web.id_`)
  },

  async resep({ text, prefix, reply }) {
    const q = String(text || '').trim()
    if (!q || q.length > 60) return reply(`${B('RESEP')}\nContoh: ${prefix}resep ayam geprek`)
    const base = 'https://cookpad.com/id/cari/' + encodeURIComponent(q)
    const { text: html, url } = await get(base)
    const $ = cheerio().load(html), seen = new Set(), out = []
    $('a[href*="/resep/"]').each((_, a) => {
      const href = abs($(a).attr('href'), url).split('?')[0], t = ($(a).text() || $(a).find('img').attr('alt') || '').replace(/\s+/g, ' ').trim()
      if (!/\/resep\/\d+/.test(href) || t.length < 4 || seen.has(href)) return
      seen.add(href); out.push({ t, href })
    })
    if (!out.length) return reply(`Resep untuk *${q}* tidak ditemukan.`)
    return reply(`${B('RESEP')} — ${q}\n${LINE}\n` + out.slice(0, 8).map((x, i) => `${i + 1}. *${clip(x.t, 90)}*\n   ${x.href}`).join('\n\n') + '\n\n_Sumber: Cookpad_')
  },

  async emas({ reply }) {
    const { text: html } = await get('https://www.logammulia.com/id/harga-emas-hari-ini'), $ = cheerio().load(html), rows = []
    $('tr').each((_, tr) => {
      const c = $(tr).find('td,th').map((__, x) => $(x).text().replace(/\s+/g, ' ').trim()).get()
      if (c.length >= 2 && /^\d+([.,]\d+)?\s*(gr|gram)\b/i.test(c[0]) && /\d{3}\.\d{3}/.test(c[1])) rows.push([c[0], c[1].replace(/^Rp\s*/i, 'Rp ')])
    })
    if (!rows.length) throw new Error('tabel harga tidak terbaca (halaman berubah atau memblokir bot)')
    return reply(`${B('HARGA EMAS ANTAM')}\n${LINE}\n` + rows.slice(0, 12).map(([a, b]) => `${a.padEnd(8)} : ${b}`).join('\n') + '\n\n_Sumber: logammulia.com • harga bisa berubah tiap hari_')
  },

  async og({ sock, m, text, prefix, reply }) {
    const u = String(text || '').trim().split(/\s+/)[0]
    if (!u) return reply(`${B('PRATINJAU TAUTAN')}\nContoh: ${prefix}og https://contoh.com/artikel`)
    const r = await get(u), meta = parseMeta(r.text)
    if (!meta.title && !meta.desc) throw new Error('halaman tidak punya metadata')
    const cap = [B('PRATINJAU'), LINE, `Judul   : ${clip(meta.title, 200) || '-'}`, meta.site && `Situs   : ${meta.site}`, meta.author && `Penulis : ${clip(meta.author, 80)}`, meta.time && `Terbit  : ${meta.time.slice(0, 16).replace('T', ' ')}`, `Deskripsi: ${clip(meta.desc, 400) || '-'}`, '', r.url].filter(x => x !== '' ? x : true).filter(Boolean).join('\n')
    const img = meta.image && abs(meta.image, r.url)
    if (img && NG.parseUrl(img)) { try { return await sock.sendMessage(m.chat, { image: { url: img }, caption: cap }, { quoted: m }) } catch {} }
    return reply(cap)
  },

  async artikel({ text, prefix, reply }) {
    const u = String(text || '').trim().split(/\s+/)[0]
    if (!u) return reply(`${B('BACA ARTIKEL')}\nContoh: ${prefix}artikel https://contoh.com/berita/123`)
    const r = await get(u, { maxBytes: 2 * 1024 * 1024 }), meta = parseMeta(r.text), paras = parseArticle(r.text)
    if (!paras.length) throw new Error('isi artikel tidak terbaca (mungkin dirender JavaScript atau berbayar)')
    let body = '', n = 0; for (const p of paras) { if (body.length + p.length > 1800) break; body += p + '\n\n'; n++ }
    if (!body) body = clip(paras[0], 1800)
    return reply(`${B('ARTIKEL')}\n${LINE}\n*${clip(meta.title, 200) || 'Tanpa judul'}*\n\n${body.trim()}${n < paras.length ? '\n\n_…dipotong_' : ''}\n\n${r.url}`)
  },
}

module.exports = {
  name: 'scrapekit', alias: Object.keys(ALIAS), category: 'dunia', cmds: ['kabar', 'trending', 'kbbi', 'resep', 'emas', 'og', 'artikel'], noLimit: false,
  desc: 'Scraper web: .kabar .trending .kbbi .resep .emas .og .artikel',
  run: async (ctx) => {
    const cmd = ALIAS[String(ctx.command || '').toLowerCase()] || 'kabar', now = Date.now(), who = (ctx.m && ctx.m.sender) || ''
    const prev = last.get(who) || 0
    if (now - prev < COOLDOWN) return ctx.reply(`⏳ Tunggu ${Math.ceil((COOLDOWN - (now - prev)) / 1000)} detik lagi.`)
    last.set(who, now)
    try { return await F[cmd](ctx) }
    catch (e) { console.log('[scrapekit:' + cmd + ']', e.message); return ctx.reply(`Gagal mengambil data (${cmd}): ${e.message}`) }
  },
}
module.exports._t = { parseRss, parseMeta, parseArticle, strip, ALIAS }
