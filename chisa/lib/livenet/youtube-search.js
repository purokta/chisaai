/*
 * Pencarian YouTube tanpa yt-dlp dan tanpa API key:
 *  1) membaca halaman hasil pencarian YouTube (ytInitialData)
 *  2) cadangan: youtubei.js (Innertube), bila terpasang
 * Keluaran: [{ videoId, title, channel, duration: 'm:ss', views }]
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const txt = o => (o && (o.simpleText || (o.runs && o.runs.map(r => r.text).join('')))) || ''

// ambil objek JSON `ytInitialData = {...};` dengan menghitung kurung (tidak bergantung regex rapuh)
function extractInitialData(html) {
  const i = html.indexOf('ytInitialData')
  if (i < 0) return null
  const start = html.indexOf('{', i)
  if (start < 0) return null
  let depth = 0, inStr = false, esc = false
  for (let p = start; p < html.length; p++) {
    const c = html[p]
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue }
    if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) { try { return JSON.parse(html.slice(start, p + 1)) } catch { return null } }
  }
  return null
}

function collect(node, out) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) { for (const x of node) collect(x, out); return }
  if (node.videoRenderer && node.videoRenderer.videoId) {
    const v = node.videoRenderer
    const live = (v.badges || []).some(b => /live|langsung/i.test(JSON.stringify(b))) || !v.lengthText
    out.push({
      videoId: v.videoId, title: txt(v.title), channel: txt(v.ownerText || v.longBylineText),
      duration: live ? '' : txt(v.lengthText), views: txt(v.viewCountText) || '-'
    })
    return
  }
  for (const k of Object.keys(node)) collect(node[k], out)
}

async function viaPage(query) {
  const r = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(query) + '&sp=EgIQAQ%253D%253D', {
    headers: { 'User-Agent': UA, 'Accept-Language': 'id,en;q=0.8', Cookie: 'CONSENT=YES+1; SOCS=CAI' },
    signal: AbortSignal.timeout(15000)
  })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  const data = extractInitialData(await r.text())
  if (!data) throw new Error('data pencarian tidak ditemukan')
  const out = []
  collect(data, out)
  if (!out.length) throw new Error('hasil kosong')
  return out
}

async function viaInnertube(query) {
  const mod = await import('youtubei.js')
  const Innertube = mod.Innertube || (mod.default && mod.default.Innertube)
  const yt = await Innertube.create({ retrieve_player: false })
  const res = await yt.search(query, { type: 'video' })
  const out = []
  for (const v of res.results || []) {
    if (!v.id && !v.video_id) continue
    out.push({
      videoId: v.id || v.video_id, title: (v.title && (v.title.text || String(v.title))) || '',
      channel: (v.author && v.author.name) || '', duration: (v.duration && v.duration.text) || '', views: (v.view_count && v.view_count.text) || '-'
    })
  }
  if (!out.length) throw new Error('hasil kosong')
  return out
}

async function searchYoutube(query) {
  const errs = []
  try { return await viaPage(query) } catch (e) { errs.push('halaman: ' + e.message) }
  try { return await viaInnertube(query) } catch (e) { errs.push('youtubei: ' + e.message) }
  throw new Error('pencarian YouTube gagal (' + errs.join('; ') + ')')
}

// converter pihak ketiga tidak dipakai (tidak ada layanan stabil); jalur unduh memakai ytdl-core / youtubei.js
async function downloadYoutube() { return { status: false, message: 'converter tidak tersedia' } }

module.exports = { searchYoutube, downloadYoutube, _extract: extractInitialData, _collect: collect }
