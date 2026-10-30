// Gambar anime untuk gacha/summon dari beberapa sumber (satu diblokir/mati -> pindah ke berikutnya). Hasil: Buffer gambar.
const http = require('./http')

const isImg = b => b && b.length > 1500 && (b[0] === 0xff && b[1] === 0xd8 || b[0] === 0x89 && b[1] === 0x50 || b.slice(0, 4).toString() === 'RIFF' || b.slice(0, 3).toString() === 'GIF')
async function grab(url, label, log) {
  try {
    const { buffer } = await http.getBuffer(url, { timeout: 10000, maxMB: 6, headers: { referer: 'https://myanimelist.net/' } })
    if (!isImg(buffer)) throw new Error('bukan gambar')
    return buffer
  } catch (e) { log && log.push(`${label}: ${String(e?.cause?.code || e?.message || e).slice(0, 50)}`); return null }
}
async function json(url, opts, label, log) {
  try { const r = await http.request(url, { timeout: 9000, ...opts }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json() } catch (e) { log && log.push(`${label}: ${String(e?.cause?.code || e?.message || e).slice(0, 50)}`); return null }
}
const gql = (query, variables, log) => json('https://graphql.anilist.co', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ query, variables }) }, 'anilist', log)

// gambar karakter bernama `name` dari AniList
async function characterUrl(name, log) {
  const r = await gql('query($s:String){Character(search:$s){image{large medium}}}', { s: name }, log)
  const i = r?.data?.Character?.image
  return i?.large || i?.medium || ''
}
// karakter populer acak dari AniList
async function randomCharacterUrl(log) {
  const page = 1 + Math.floor(Math.random() * 40)
  const r = await gql('query($p:Int){Page(page:$p,perPage:25){characters(sort:FAVOURITES_DESC){image{large}}}}', { p: page }, log)
  const l = (r?.data?.Page?.characters || []).map(c => c.image?.large).filter(Boolean)
  return l.length ? l[Math.floor(Math.random() * l.length)] : ''
}
const RANDOM = [
  ['anilist', async log => randomCharacterUrl(log)],
  ['nekos.best', async log => (await json('https://nekos.best/api/v2/waifu', {}, 'nekos.best', log))?.results?.[0]?.url],
  ['waifu.pics', async log => (await json('https://api.waifu.pics/sfw/waifu', {}, 'waifu.pics', log))?.url],
  ['waifu.im', async log => (await json('https://api.waifu.im/search?included_tags=waifu', {}, 'waifu.im', log))?.images?.[0]?.url],
  ['nekos.life', async log => (await json('https://nekos.life/api/v2/img/waifu', {}, 'nekos.life', log))?.url]
]

/** gambar untuk karakter `name` (url bawaan `img` dicoba dulu); bila semua gagal -> gambar anime acak. { buffer, source, errors } */
async function imageFor(name, img) {
  const log = []
  if (img) { const b = await grab(img, 'gambar karakter', log); if (b) return { buffer: b, source: 'karakter', errors: log } }
  if (name) { const u = await characterUrl(name, log); if (u) { const b = await grab(u, 'anilist-img', log); if (b) return { buffer: b, source: 'anilist', errors: log } } }
  return randomImage(log)
}
async function randomImage(log = []) {
  for (const [label, fn] of RANDOM) {
    let u = ''
    try { u = await fn(log) } catch (e) { log.push(label + ': ' + String(e?.message || e).slice(0, 50)) }
    if (!u) continue
    const b = await grab(u, label + '-img', log)
    if (b) return { buffer: b, source: label, errors: log }
  }
  return { buffer: null, source: null, errors: log }
}
module.exports = { imageFor, randomImage, characterUrl, RANDOM }
