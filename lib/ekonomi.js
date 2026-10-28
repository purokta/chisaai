// Data ekonomi (gratis, tanpa API key): kurs, indeks saham, dan berita ekonomi Indonesia.
// Setiap data punya beberapa sumber cadangan; kalau semua gagal, fungsi melempar error yang jelas.
const http = require('./http')

const fmt = (n, d = 2) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: d })

// ---------------------------------------------------------------- KURS
async function rates(base = 'USD') {
  const B = String(base).toUpperCase()
  const tries = [
    async () => {
      const r = await http.getJson('https://open.er-api.com/v6/latest/' + B, { timeout: 12000 })
      if (!r.rates) throw new Error('kosong')
      return { rates: r.rates, updated: r.time_last_update_utc ? new Date(r.time_last_update_utc) : null, src: 'open.er-api.com' }
    },
    async () => {
      const r = await http.getJson(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${B.toLowerCase()}.json`, { timeout: 12000 })
      const t = r[B.toLowerCase()]
      if (!t) throw new Error('kosong')
      const rates = {}
      for (const [k, v] of Object.entries(t)) rates[k.toUpperCase()] = v
      return { rates, updated: r.date ? new Date(r.date) : null, src: 'currency-api' }
    },
    async () => {
      const r = await http.getJson(`https://api.frankfurter.app/latest?from=${B}`, { timeout: 12000 })
      if (!r.rates) throw new Error('kosong')
      return { rates: { ...r.rates, [B]: 1 }, updated: r.date ? new Date(r.date) : null, src: 'frankfurter.app' }
    }
  ]
  let last
  for (const t of tries) {
    try { return await t() } catch (e) { last = e }
  }
  throw new Error('Sumber kurs tidak bisa dihubungi (' + (last?.message || 'gagal') + ')')
}

function kursText({ rates: R, updated, src }, { amount = 1, from = 'USD', to = 'IDR' } = {}) {
  const F = from.toUpperCase(), T = to.toUpperCase()
  const rate = R[T]
  if (!rate) return null
  const when = updated && !isNaN(updated) ? updated.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) + ' WIB' : '-'
  let out = `💱 *Kurs ${F} → ${T}*\n\n${fmt(amount)} ${F} = *${fmt(amount * rate, T === 'IDR' ? 2 : 4)} ${T}*\n`
  if (T === 'IDR' && amount === 1 && R.IDR) {
    out += `\n• 10 ${F} = ${fmt(10 * rate, 0)} IDR\n• 100 ${F} = ${fmt(100 * rate, 0)} IDR\n• 1.000 ${F} = ${fmt(1000 * rate, 0)} IDR\n`
  }
  out += `\n🕒 ${when}\n_sumber: ${src}_`
  return out
}

// ---------------------------------------------------------------- SAHAM
// kode Yahoo Finance -> [nama, kode Stooq (cadangan)]
const INDICES = {
  '^JKSE': ['IHSG (Indonesia)', '^jci'],
  '^JKLQ45': ['LQ45 (Indonesia)', null],
  '^GSPC': ['S&P 500 (AS)', '^spx'],
  '^DJI': ['Dow Jones (AS)', '^dji'],
  '^IXIC': ['Nasdaq (AS)', '^ndq'],
  '^N225': ['Nikkei 225 (Jepang)', '^nkx'],
  '^HSI': ['Hang Seng (Hong Kong)', '^hsi'],
  '^STI': ['Straits Times (Singapura)', '^sti'],
  '^FTSE': ['FTSE 100 (Inggris)', '^ukx']
}
const DEFAULT_INDICES = ['^JKSE', '^JKLQ45', '^GSPC', '^DJI', '^IXIC', '^N225', '^HSI', '^STI']

async function yahooQuote(sym) {
  let r
  const hosts = ['query1', 'query2']
  let err
  for (const h of hosts) {
    try {
      r = await http.getJson(`https://${h}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`, { timeout: 12000 })
      break
    } catch (e) { err = e }
  }
  if (!r) throw err || new Error('gagal')
  const res = r.chart?.result?.[0]
  const m = res?.meta
  if (!m || m.regularMarketPrice == null) throw new Error('tidak ada data')
  const closes = (res.indicators?.quote?.[0]?.close || []).filter(x => x != null)
  const price = m.regularMarketPrice
  const prev = m.chartPreviousClose ?? m.previousClose ?? (closes.length > 1 ? closes[closes.length - 2] : null)
  return { sym, name: m.longName || m.shortName || sym, price, prev, currency: m.currency || '', time: m.regularMarketTime ? new Date(m.regularMarketTime * 1000) : null, src: 'Yahoo Finance' }
}

async function stooqQuote(sym, stooq) {
  const t = await http.getText(`https://stooq.com/q/l/?s=${encodeURIComponent(stooq)}&f=sd2t2ohlcp&h&e=csv`, { timeout: 12000 })
  const rows = t.trim().split(/\r?\n/)
  if (rows.length < 2) throw new Error('kosong')
  const c = rows[1].split(',')
  const close = Number(c[6]), prev = Number(c[7])
  if (!close || isNaN(close)) throw new Error('tidak ada data')
  return { sym, name: sym, price: close, prev: prev || null, currency: '', time: null, src: 'Stooq' }
}

async function quote(sym) {
  try { return await yahooQuote(sym) } catch (e) {
    const st = INDICES[sym]?.[1]
    if (st) return stooqQuote(sym, st)
    throw e
  }
}

const arrow = c => (c > 0 ? '🟢▲' : c < 0 ? '🔴▼' : '⚪▬')

function quoteLine(q, label) {
  const ch = q.prev ? q.price - q.prev : 0
  const pc = q.prev ? (ch / q.prev) * 100 : 0
  const sign = ch > 0 ? '+' : ''
  return `${arrow(ch)} *${label || q.name}*\n    ${fmt(q.price)} (${sign}${fmt(ch)} | ${sign}${fmt(pc)}%)`
}

async function indices(list = DEFAULT_INDICES) {
  const out = await Promise.allSettled(list.map(s => quote(s)))
  const ok = []
  out.forEach((r, i) => { if (r.status === 'fulfilled') ok.push([list[i], r.value]) })
  if (!ok.length) throw new Error('Sumber data saham tidak bisa dihubungi')
  return ok
}

function indicesText(ok) {
  const t = ok[0]?.[1]?.time
  const when = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
  return `📈 *Indeks Saham*\n\n` + ok.map(([s, q]) => quoteLine(q, INDICES[s]?.[0])).join('\n\n') +
    `\n\n🕒 ${when} WIB\n_sumber: ${[...new Set(ok.map(([, q]) => q.src))].join(', ')}. Harga bisa tertunda / penutupan terakhir._`
}

// kode saham biasa: BBCA -> BBCA.JK (saham Indonesia); kode lain dipakai apa adanya (AAPL, TSLA, ...)
const stockSymbol = s => {
  const x = String(s).trim().toUpperCase()
  if (!x) return ''
  if (x.startsWith('^') || x.includes('.') || /^[A-Z]{1,5}-[A-Z]{2,5}$/.test(x)) return x
  return /^[A-Z]{4}$/.test(x) ? x + '.JK' : x
}
// kode 4 huruf bisa saham BEI (BBCA) atau bursa AS (AAPL): coba .JK dulu, lalu apa adanya
const stockCandidates = s => {
  const x = stockSymbol(s)
  return x.endsWith('.JK') && !String(s).includes('.') ? [x, x.slice(0, -3)] : [x]
}

// ---------------------------------------------------------------- BERITA
const decode = s => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

function parseRss(xml, source) {
  const items = []
  for (const m of String(xml).matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const b = m[0]
    const get = tag => { const x = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')); return x ? decode(x[1]) : '' }
    let title = get('title')
    const src = get('source')
    // Google News menambahkan " - Nama Media" di ujung judul
    let outlet = src || source
    const dash = title.lastIndexOf(' - ')
    if (dash > 20 && source === 'Google News') { outlet = src || title.slice(dash + 3); title = title.slice(0, dash) }
    const link = get('link') || (b.match(/<link>([^<]+)/i)?.[1] || '').trim()
    const date = new Date(get('pubDate') || get('dc:date') || 0)
    if (title) items.push({ title, link, date: isNaN(date) ? null : date, outlet })
  }
  return items
}

const FEEDS = [
  ['Google News', 'https://news.google.com/rss/search?q=ekonomi+Indonesia+when:2d&hl=id&gl=ID&ceid=ID:id'],
  ['Google News', 'https://news.google.com/rss/search?q=rupiah+OR+IHSG+OR+inflasi+OR+APBN+when:2d&hl=id&gl=ID&ceid=ID:id'],
  ['CNBC Indonesia', 'https://www.cnbcindonesia.com/market/rss'],
  ['Antara', 'https://www.antaranews.com/rss/ekonomi-bisnis.xml'],
  ['Detik Finance', 'https://finance.detik.com/rss'],
  ['Kontan', 'https://www.kontan.co.id/rss']
]

const STOP = new Set('yang dan di ke dari untuk pada dengan ini itu akan atau juga tak tidak bisa jadi ada oleh sebagai dalam saat kini hari baru usai soal serta para telah masih hingga lebih sudah kata ungkap rp'.split(' '))
const words = t => new Set(t.toLowerCase().replace(/[^a-z0-9À-ɏ ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)))
const ECO = /(ekonomi|rupiah|ihsg|saham|inflasi|apbn|bank|bi rate|suku bunga|pajak|harga|bbm|emas|investasi|ekspor|impor|utang|apbd|subsidi|kredit|bursa|dolar|dollar|bumn|laba|pertumbuhan|pdb|umkm|resesi|phk|upah|beras|minyak|tarif|pasar|obligasi|cadangan devisa)/i

// "viral" = topik yang diberitakan banyak media (judul mirip) + masih baru. Skor makin tinggi makin ramai.
function rank(items, now = Date.now()) {
  const list = items.filter(i => ECO.test(i.title))
  const ws = list.map(i => words(i.title))
  const scored = list.map((it, i) => {
    const outlets = new Set([it.outlet])
    let sim = 0
    for (let j = 0; j < list.length; j++) {
      if (j === i) continue
      const a = ws[i], b = ws[j]
      let common = 0
      for (const w of a) if (b.has(w)) common++
      if (common >= 3 && common / Math.min(a.size, b.size) >= 0.4) { sim++; outlets.add(list[j].outlet) }
    }
    const ageH = it.date ? Math.max(0, (now - it.date) / 36e5) : 48
    const fresh = Math.max(0, 1 - ageH / 48)
    return { ...it, outlets: outlets.size, score: sim * 2 + outlets.size * 3 + fresh * 4 }
  })
  scored.sort((a, b) => b.score - a.score)
  const seen = [], out = []
  for (const s of scored) {
    const w = words(s.title)
    if (seen.some(x => { let c = 0; for (const k of w) if (x.has(k)) c++; return c >= 3 && c / Math.min(w.size, x.size) >= 0.5 })) continue
    seen.push(w); out.push(s)
  }
  return out
}

async function news(limit = 7) {
  const res = await Promise.allSettled(FEEDS.map(async ([name, url]) => parseRss(await http.getText(url, { timeout: 12000 }), name)))
  const all = []
  const seenT = new Set()
  for (const r of res) if (r.status === 'fulfilled') for (const i of r.value) { const k = i.title.toLowerCase(); if (!seenT.has(k)) { seenT.add(k); all.push(i) } }
  if (!all.length) throw new Error('Sumber berita tidak bisa dihubungi')
  return rank(all).slice(0, limit)
}

function newsText(list) {
  const ago = d => {
    if (!d) return ''
    const m = Math.max(1, Math.round((Date.now() - d) / 6e4))
    return m < 60 ? `${m} mnt lalu` : m < 1440 ? `${Math.round(m / 60)} jam lalu` : `${Math.round(m / 1440)} hari lalu`
  }
  return `📰 *Berita Ekonomi Indonesia — Lagi Ramai*\n\n` + list.map((n, i) =>
    `*${i + 1}. ${n.title}*\n   ${n.outlets > 1 ? `🔥 ${n.outlets} media • ` : ''}${n.outlet}${n.date ? ' • ' + ago(n.date) : ''}\n   ${n.link}`
  ).join('\n\n') + `\n\n_Diurutkan dari topik yang paling banyak diberitakan & terbaru._`
}

module.exports = { rates, kursText, quote, indices, indicesText, quoteLine, stockSymbol, stockCandidates, INDICES, DEFAULT_INDICES, parseRss, rank, news, newsText, fmt }
