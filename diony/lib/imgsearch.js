/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
/*
✦ CHISA AI — pencari gambar web tanpa API key (Bing, cadangan DuckDuckGo)
imageSearch(query, n) -> [{ title, image, thumb, page }]
*/
const axios = require('axios')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const okUrl = (u) => /^https?:\/\//i.test(u || '')

// Bing menaruh data tiap gambar di atribut m="{...}" milik elemen class="iusc"
function parseBing(html) {
  const out = []
  for (const x of String(html).matchAll(/class="iusc"[^>]*?\sm="([^"]+)"/g)) {
    try {
      const j = JSON.parse(unesc(x[1]))
      if (okUrl(j.murl)) out.push({ title: String(j.t || '').replace(/[-]/g, '').trim(), image: j.murl, thumb: j.turl || j.murl, page: j.purl || '' })
    } catch {}
  }
  return out
}
async function bing(q) {
  const r = await axios.get('https://www.bing.com/images/search', { params: { q, form: 'HDRSC2', first: 1, safeSearch: 'Moderate' }, timeout: 20000, headers: { 'User-Agent': UA, 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' } })
  return parseBing(r.data)
}
async function ddg(q) {
  const h = { 'User-Agent': UA, Referer: 'https://duckduckgo.com/' }
  const page = await axios.get('https://duckduckgo.com/', { params: { q, iax: 'images', ia: 'images' }, timeout: 20000, headers: h })
  const vqd = (String(page.data).match(/vqd=["']?([\d-]+)/) || [])[1]
  if (!vqd) throw new Error('vqd tidak ditemukan')
  const r = await axios.get('https://duckduckgo.com/i.js', { params: { l: 'id-id', o: 'json', q, vqd, f: ',,,,,', p: '1' }, timeout: 20000, headers: h })
  return (r.data.results || []).filter(x => okUrl(x.image)).map(x => ({ title: x.title || '', image: x.image, thumb: x.thumbnail || x.image, page: x.url || '' }))
}

async function imageSearch(query, n = 5) {
  let list = []
  for (const fn of [bing, ddg]) {
    try { list = await fn(query); if (list.length) break } catch (e) { console.log('[imgsearch]', fn.name, e.message) }
  }
  const seen = new Set()
  return list.filter(x => !seen.has(x.image) && seen.add(x.image)).slice(0, n)
}

module.exports = { imageSearch, parseBing }
