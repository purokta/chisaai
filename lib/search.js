// Pencarian web gratis tanpa API key: DuckDuckGo (HTML), cadangan Wikipedia
const http = require('./http')

const decode = s =>
  String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
const strip = s => decode(String(s).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()

function realUrl(href) {
  let h = decode(href)
  if (h.startsWith('//')) h = 'https:' + h
  try {
    const u = new URL(h)
    if (u.hostname.endsWith('duckduckgo.com')) return u.searchParams.get('uddg') || null // tautan iklan/internal -> buang
    return h
  } catch {
    return null
  }
}

function parseDDG(html, limit = 5) {
  const anchors = [...html.matchAll(/<a\b[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/g)]
  const items = []
  anchors.forEach((a, i) => {
    const href = (a[0].match(/href="([^"]+)"/) || [])[1]
    const url = href && realUrl(href)
    if (!url) return
    const seg = html.slice(a.index + a[0].length, anchors[i + 1] ? anchors[i + 1].index : html.length)
    const sn = seg.match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div|td)>/)
    items.push({ title: strip(a[1]), snippet: sn ? strip(sn[1]).slice(0, 220) : '', url })
  })
  return items.slice(0, limit)
}

async function ddg(q, limit) {
  const html = await http.getText('https://html.duckduckgo.com/html/?kl=id-id&q=' + encodeURIComponent(q), {
    timeout: 15000,
    headers: { 'accept-language': 'id-ID,id;q=0.9,en;q=0.8' }
  })
  return parseDDG(html, limit)
}

async function wiki(q, limit) {
  for (const lang of ['id', 'en']) {
    const j = await http.getJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=${limit}&srsearch=${encodeURIComponent(q)}`,
      { timeout: 15000 }
    )
    const items = (j.query?.search || []).map(r => ({
      title: r.title,
      snippet: strip(r.snippet).slice(0, 220),
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`
    }))
    if (items.length) return items
  }
  return []
}

async function search(q, limit = 5) {
  let reached = false
  try {
    const items = await ddg(q, limit)
    reached = true
    if (items.length) return { source: 'DuckDuckGo', items }
  } catch {}
  try {
    const items = await wiki(q, limit)
    reached = true
    if (items.length) return { source: 'Wikipedia', items }
  } catch {}
  if (!reached) {
    const err = new Error('Layanan pencarian tidak bisa dihubungi. Cek koneksi internet lalu coba lagi.')
    err.userMessage = err.message
    throw err
  }
  return { source: '-', items: [] }
}

module.exports = { search, parseDDG }
