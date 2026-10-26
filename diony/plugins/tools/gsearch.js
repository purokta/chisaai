/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .gsearch <kata> — pencarian web. Urutan sumber (otomatis, yang pertama berhasil dipakai):
//   1. Google Custom Search API  (bila GOOGLE_API_KEY + GOOGLE_CX diisi di env — paling stabil)
//   2. Google (halaman HTML dasar)   3. DuckDuckGo   4. Bing
// Google sering menolak permintaan otomatis (CAPTCHA/consent); karena itu ada cadangan, dan sumber yang
// dipakai selalu ditulis di hasil. Tanpa API key.
const axios = require('axios')
const { B } = require('../../lib/style')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' }
const MAXR = 8, COOLDOWN = 5000
const last = new Map()
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim()
const cut = (s, n) => { s = clean(s); return s.length > n ? s.slice(0, n - 1) + '…' : s }
const ent = (t) => String(t).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
const txt = (h) => clean(ent(String(h || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ')))
const attr = (tag, name) => { const m = String(tag).match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i')); return m ? ent(m[2] != null ? m[2] : m[3]) : '' }
const bad = (u) => !/^https?:\/\//i.test(u) || /^https?:\/\/([\w-]+\.)*(google|gstatic|googleusercontent)\.[a-z.]+\//i.test(u)
const uniq = (arr) => { const s = new Set(); return arr.filter(r => r.url && r.title && !s.has(r.url) && s.add(r.url)) }

async function viaApi(q) {
  const r = await axios.get('https://www.googleapis.com/customsearch/v1', { params: { key: process.env.GOOGLE_API_KEY, cx: process.env.GOOGLE_CX, q, num: MAXR, hl: 'id' }, timeout: 15000 })
  return (r.data.items || []).map(i => ({ title: i.title, url: i.link, snippet: i.snippet }))
}

// ── parser berbasis regex (tanpa dependency tambahan) ──
function parseGoogle(html) {
  html = String(html)
  const anchors = [...html.matchAll(/<a\s[^>]*href="(\/url\?[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
  if (!anchors.length && /unusual traffic|captcha|consent\.google|sorry\/index/i.test(html)) throw new Error('Google meminta verifikasi')
  const out = []
  anchors.forEach((a, i) => {
    let u = ''; try { u = new URL('https://www.google.com' + ent(a[1])).searchParams.get('q') || '' } catch {}
    if (bad(u)) return
    const h3 = a[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
    const title = txt(h3 ? h3[1] : (a[2].match(/<div[^>]*>([\s\S]*?)<\/div>/i) || [])[1])
    if (!title) return
    const seg = html.slice(a.index + a[0].length, i + 1 < anchors.length ? anchors[i + 1].index : a.index + a[0].length + 4000)
    const sn = seg.match(/<(?:div|span)[^>]*class="[^"]*(?:s3v9rd|VwiC3b)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span)>/i)
    out.push({ title, url: u, snippet: sn ? txt(sn[1]) : '' })
  })
  return uniq(out)
}
const viaGoogle = async (q) => parseGoogle((await axios.get('https://www.google.com/search', { params: { q, hl: 'id', num: 10, gbv: 1 }, headers: { ...H, 'User-Agent': 'Lynx/2.8.9rel.1 libwww-FM/2.14 SSL-MM/1.4.1' }, timeout: 15000, responseType: 'text' })).data)

function parseDdg(html) {
  html = String(html)
  const links = [...html.matchAll(/<a\s[^>]*class="[^"]*\bresult__a\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)], out = []
  links.forEach((a, i) => {
    let u = attr(a[0], 'href')
    try { const x = new URL(u, 'https://duckduckgo.com'); u = x.searchParams.get('uddg') || x.href } catch {}
    if (/duckduckgo\.com\/y\.js|ad_provider/.test(u)) return
    const seg = html.slice(a.index + a[0].length, i + 1 < links.length ? links[i + 1].index : undefined)
    const sn = seg.match(/class="[^"]*\bresult__snippet\b[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div|td)>/i)
    out.push({ title: txt(a[1]), url: u, snippet: sn ? txt(sn[1]) : '' })
  })
  return uniq(out.filter(r => /^https?:\/\//.test(r.url)))
}
const viaDdg = async (q) => parseDdg((await axios.post('https://html.duckduckgo.com/html/', new URLSearchParams({ q, kl: 'id-id' }).toString(), { headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://duckduckgo.com/' }, timeout: 15000, responseType: 'text' })).data)

function parseBing(html) {
  const out = []
  for (const blk of String(html).split(/<li\s[^>]*class="[^"]*\bb_algo\b[^"]*"[^>]*>/i).slice(1)) {
    const h = blk.match(/<h2[^>]*>\s*(<a\s[^>]*>)([\s\S]*?)<\/a>/i); if (!h) continue
    let u = attr(h[1], 'href')
    const m = u.match(/[?&]u=a1([^&]+)/)                     // tautan pelacak bing: u=a1<base64url>
    if (m) { try { u = Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8') } catch {} }
    const p = blk.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    out.push({ title: txt(h[2]), url: u, snippet: p ? txt(p[1]) : '' })
  }
  return uniq(out.filter(r => /^https?:\/\//.test(r.url)))
}
const viaBing = async (q) => parseBing((await axios.get('https://www.bing.com/search', { params: { q, setlang: 'id', cc: 'ID' }, headers: H, timeout: 15000, responseType: 'text' })).data)

const SOURCES = [
  { name: 'Google (API resmi)', on: () => !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CX), fn: viaApi },
  { name: 'Google', on: () => true, fn: viaGoogle },
  { name: 'DuckDuckGo', on: () => true, fn: viaDdg },
  { name: 'Bing', on: () => true, fn: viaBing },
]

async function search(q) {
  const errs = []
  for (const s of SOURCES) {
    if (!s.on()) continue
    try { const r = (await s.fn(q)).slice(0, MAXR); if (r.length) return { source: s.name, results: r } ; errs.push(`${s.name}: kosong`) } catch (e) { errs.push(`${s.name}: ${e.message}`) }
  }
  const err = new Error('semua sumber gagal'); err.details = errs; throw err
}

module.exports = {
  name: 'gsearch', alias: ['google', 'goog', 'carigoogle', 'websearch'], category: 'tools', cmds: ['gsearch'], noLimit: false,
  desc: 'Cari di web (Google; cadangan DuckDuckGo & Bing): judul, tautan, cuplikan',
  search, parseGoogle, parseDdg, parseBing,
  run: async ({ m, text, prefix, reply, isCreator }) => {
    const q = clean(text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '')
    if (!q) return reply(`${B('GSEARCH')}\nContoh: ${prefix || '.'}gsearch cara membuat bot whatsapp\n${prefix || '.'}gsearch site:github.com baileys\n\nHasil berisi judul, tautan, dan cuplikan.`)
    if (q.length > 200) return reply('✕ Kata kunci maksimal 200 karakter.')
    const now = Date.now(), prev = last.get(m.sender) || 0
    if (now - prev < COOLDOWN) return reply(`⏳ Tunggu ${Math.ceil((COOLDOWN - (now - prev)) / 1000)} detik lagi.`)
    last.set(m.sender, now)
    try {
      const { source, results } = await search(q)
      const lines = results.map((r, i) => `${i + 1}. *${cut(r.title, 80)}*\n${r.url}${r.snippet ? `\n_${cut(r.snippet, 140)}_` : ''}`)
      return reply(`${B('HASIL PENCARIAN')}\n🔎 ${cut(q, 80)}\n\n${lines.join('\n\n')}\n\nSumber: ${source}`)
    } catch (e) {
      console.log('[gsearch]', (e.details || [e.message]).join(' | '))
      return reply(`✕ Pencarian gagal — semua sumber menolak atau tidak merespons. Coba lagi sebentar lagi.${isCreator && e.details ? '\n_' + e.details.join('\n') + '_' : ''}`)
    }
  },
}
