/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Library baca manga & novel (v4.14.0) — dipakai plugins/anime/bacamanga.js dan plugins/anime/novel.js
//   • Manga   : MangaDex (API publik resmi, gratis tanpa kunci). Chapter yang di-host penerbit resmi (tautan luar) tidak bisa dibaca di sini.
//   • Novel   : Project Gutenberg (domain publik). Metadata dari Gutendex, cadangan: pencarian situs Gutenberg.
//   • Semua permintaan lewat lib/netguard.js (anti-SSRF, batas ukuran). Tanpa dependensi baru: sharp, fflate, cheerio sudah ada.
const { safeFetch } = require('./netguard')
const PDF = require('./pdfmini')

let _fetch = safeFetch
const _setFetch = (f) => { _fetch = f || safeFetch }          // hanya untuk skrip uji
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ───────────────────────── HTTP ─────────────────────────
const jcache = new Map(), TTL = 5 * 60 * 1000
async function getJson(url, o = {}) {
  const hit = jcache.get(url); if (hit && Date.now() - hit.t < TTL) return hit.d
  let last
  for (let i = 0; i < 3; i++) {
    try {
      const r = await _fetch(url, { timeout: o.timeout || 20000, maxBytes: 4 * 1024 * 1024, headers: { Accept: 'application/json' } })
      if (r.status === 429 || r.status >= 500) { last = new Error(r.status === 429 ? 'Server membatasi permintaan, coba lagi sebentar' : 'Server sedang bermasalah (' + r.status + ')'); await sleep(1200 * (i + 1)); continue }
      if (r.status >= 400) throw new Error('Server membalas ' + r.status)
      const d = JSON.parse(r.buffer.toString('utf8'))
      jcache.set(url, { t: Date.now(), d }); if (jcache.size > 200) jcache.delete(jcache.keys().next().value)
      return d
    } catch (e) { last = e; if (/Server membalas 4/.test(e.message)) throw e; await sleep(600) }
  }
  throw last || new Error('Gagal terhubung')
}
async function getBuf(url, maxBytes, o = {}) {
  let last
  for (let i = 0; i < (o.tries || 3); i++) {
    try {
      const r = await _fetch(url, { timeout: o.timeout || 30000, maxBytes, headers: o.headers || {} })
      if (r.status >= 400 || !r.buffer.length) throw new Error('HTTP ' + r.status)
      return r
    } catch (e) { last = e; if (e.code === 'ETOOBIG' || e.code === 'EBADURL') throw e; await sleep(700 * (i + 1)) }
  }
  throw last
}
const qs = (pairs) => pairs.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&')

// ───────────────────────── MANGA (MangaDex) ─────────────────────────
const MD = 'https://api.mangadex.org'
const RATING = ['safe', 'suggestive']                     // erotica / pornographic sengaja tidak diikutkan
const LANGS = { id: 'Indonesia', en: 'Inggris', es: 'Spanyol', 'es-la': 'Spanyol (LatAm)', 'pt-br': 'Portugis (BR)', fr: 'Prancis', de: 'Jerman', ru: 'Rusia', it: 'Italia', ja: 'Jepang', ko: 'Korea', 'zh': 'Mandarin', 'zh-hk': 'Mandarin (HK)', ar: 'Arab', tr: 'Turki', vi: 'Vietnam', th: 'Thai', pl: 'Polandia', ms: 'Melayu', hi: 'Hindi', uk: 'Ukraina' }
const langName = (c) => LANGS[c] || String(c || '?').toUpperCase()
const safeName = (s) => /^[\w.\-]+$/.test(String(s || '')) ? s : null

const pickText = (o, prefer = ['id', 'en']) => { if (!o) return ''; for (const l of prefer) if (o[l]) return o[l]; const k = Object.keys(o)[0]; return k ? o[k] : '' }
function normManga(x) {
  const a = x.attributes || {}, cr = (x.relationships || []).find(r => r.type === 'cover_art'), file = cr && cr.attributes && safeName(cr.attributes.fileName)
  const alt = (a.altTitles || []).map(t => t.id || t.en).filter(Boolean)[0]
  return {
    id: x.id, title: pickText(a.title, ['en', 'ja-ro', 'id']) || alt || '(tanpa judul)', alt: alt && alt !== pickText(a.title, ['en']) ? alt : '',
    desc: pickText(a.description, ['id', 'en']), status: a.status || '', year: a.year || null, rating: a.contentRating || '',
    tags: (a.tags || []).map(t => t.attributes && t.attributes.name && t.attributes.name.en).filter(Boolean).slice(0, 6),
    langs: (a.availableTranslatedLanguages || []).filter(Boolean), last: a.lastChapter || '',
    cover: file ? `https://uploads.mangadex.org/covers/${x.id}/${file}.256.jpg` : null,
  }
}
async function mangaSearch(title, lang) {
  const p = [['title', title], ['limit', 8], ['includes[]', 'cover_art'], ['order[relevance]', 'desc'], ['hasAvailableChapters', 'true'], ...RATING.map(r => ['contentRating[]', r])]
  if (lang) p.push(['availableTranslatedLanguage[]', lang])
  const j = await getJson(`${MD}/manga?${qs(p)}`)
  return (j.data || []).map(normManga)
}
async function mangaGet(id) {
  const j = await getJson(`${MD}/manga/${encodeURIComponent(id)}?${qs([['includes[]', 'cover_art']])}`)
  return j.data ? normManga(j.data) : null
}
// daftar chapter satu bahasa: dedup per nomor chapter, urut naik. Chapter tautan-luar & kosong dibuang.
async function mangaChapters(id, lang) {
  const out = []
  for (let off = 0; off < 3000; off += 500) {
    const p = [['translatedLanguage[]', lang], ['order[chapter]', 'asc'], ['limit', 500], ['offset', off], ['includeExternalUrl', 0], ['includeEmptyPages', 0], ['includeFutureUpdates', 0], ...RATING.map(r => ['contentRating[]', r])]
    const j = await getJson(`${MD}/manga/${encodeURIComponent(id)}/feed?${qs(p)}`)
    for (const c of j.data || []) { const a = c.attributes || {}; if (a.externalUrl || !(a.pages > 0)) continue; out.push({ id: c.id, ch: a.chapter == null ? null : String(a.chapter), vol: a.volume || '', title: a.title || '', pages: a.pages }) }
    if (off + 500 >= (j.total || 0)) break
  }
  const seen = new Map()
  for (const c of out) { const k = c.ch == null ? 'os:' + c.id : c.ch; if (!seen.has(k)) seen.set(k, c) }
  const num = (c) => c.ch == null ? -1 : parseFloat(c.ch)
  return [...seen.values()].sort((a, b) => (num(a) - num(b)) || 0)
}
const chLabel = (c) => c.ch == null ? 'OS' : c.ch
function findChapter(list, label) {
  const l = String(label || '').toLowerCase().replace(/^(ch|chapter|bab|c)\.?\s*/, '')
  return list.find(c => chLabel(c).toLowerCase() === l) || (/^\d+(\.\d+)?$/.test(l) ? list.find(c => c.ch != null && parseFloat(c.ch) === parseFloat(l)) : null) || null
}
// nama file + URL halaman satu chapter (hd=true → kualitas asli, default hemat data)
async function chapterPages(chapterId, hd) {
  const j = await getJson(`${MD}/at-home/server/${encodeURIComponent(chapterId)}`)
  const c = j.chapter || {}, files = (hd ? c.data : c.dataSaver) || c.data || [], dir = (hd || !c.dataSaver) ? 'data' : 'data-saver'
  if (!j.baseUrl || !c.hash || !files.length) throw new Error('Chapter ini tidak punya halaman yang bisa diambil')
  if (!/^https:\/\//.test(j.baseUrl)) throw new Error('Server gambar tidak valid')
  return files.filter(safeName).map(f => ({ name: f, url: `${j.baseUrl.replace(/\/$/, '')}/${dir}/${encodeURIComponent(c.hash)}/${encodeURIComponent(f)}` }))
}
const isImg = (b) => b.length > 12 && ((b[0] === 0xFF && b[1] === 0xD8) || (b[0] === 0x89 && b[1] === 0x50) || (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') || b.slice(0, 3).toString() === 'GIF')
const extOf = (b, name) => (b[0] === 0xFF ? 'jpg' : b[0] === 0x89 ? 'png' : b.slice(0, 3).toString() === 'GIF' ? 'gif' : b.slice(0, 4).toString() === 'RIFF' ? 'webp' : (String(name).split('.').pop() || 'jpg'))

// unduh banyak gambar paralel (maks `conc`), urutan tetap. onProgress(selesai, total)
async function fetchAll(items, { conc = 4, maxEach = 8 * 1024 * 1024, maxTotal = 90 * 1024 * 1024, onProgress } = {}) {
  const res = new Array(items.length); let next = 0, done = 0, total = 0
  const worker = async () => {
    while (true) {
      const i = next++; if (i >= items.length) return
      const r = await getBuf(items[i].url, maxEach, { tries: 3, timeout: 30000 })
      if (!isImg(r.buffer)) throw new Error('Halaman ' + (i + 1) + ' bukan gambar yang valid')
      total += r.buffer.length; if (total > maxTotal) throw Object.assign(new Error('Total ukuran melebihi batas'), { code: 'ETOOBIG' })
      res[i] = { name: items[i].name, buf: r.buffer }; done++; if (onProgress) onProgress(done, items.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(conc, items.length) }, worker))
  return res
}

// halaman → PDF (re-encode ke JPEG sRGB ≤1400px supaya ringan & kompatibel dengan lib/pdfmini)
async function imagesToPdf(imgs) {
  let sharp; try { sharp = require('sharp') } catch { throw new Error('Modul sharp belum terpasang (jalankan: npm install)') }
  const pages = []
  for (const im of imgs) {
    const { data, info } = await sharp(im.buf, { failOn: 'none' }).rotate().resize({ width: 1400, height: 2000, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).toColourspace('srgb').jpeg({ quality: 78 }).toBuffer({ resolveWithObject: true })
    pages.push({ jpeg: data, w: info.width, h: info.height })
  }
  return PDF.build(pages)
}
// halaman → CBZ (zip berisi gambar asli bernomor; dibuka di Tachiyomi/Mihon, Moon+ Reader, CDisplayEx, dll)
function imagesToCbz(imgs) {
  const fflate = require('fflate'), pad = Math.max(3, String(imgs.length).length), files = {}
  imgs.forEach((im, i) => { files[String(i + 1).padStart(pad, '0') + '.' + extOf(im.buf, im.name)] = [new Uint8Array(im.buf), { level: 0 }] })
  return Buffer.from(fflate.zipSync(files))
}

// ───────────────────────── NOVEL (Project Gutenberg) ─────────────────────────
const GX = 'https://gutendex.com/books', GB = 'https://www.gutenberg.org'
const flipName = (n) => { const s = String(n || '').replace(/\s*\(.*?\)\s*/g, ' ').trim(), i = s.indexOf(','); return i > 0 ? (s.slice(i + 1).trim() + ' ' + s.slice(0, i).trim()).trim() : s }
const gUrl = (id) => ({ epub: `${GB}/ebooks/${id}.epub.images`, epub3: `${GB}/ebooks/${id}.epub3.images`, txt: `${GB}/ebooks/${id}.txt.utf-8`, cover: `${GB}/cache/epub/${id}/pg${id}.cover.medium.jpg`, page: `${GB}/ebooks/${id}` })
function normBook(b) {
  const id = b.id, u = gUrl(id), f = b.formats || {}
  const epub = Object.keys(f).find(k => k.startsWith('application/epub+zip')), txt = Object.keys(f).find(k => k.startsWith('text/plain'))
  return {
    id, title: String(b.title || '').replace(/\s+/g, ' ').trim(), authors: (b.authors || []).map(a => flipName(a.name)).filter(Boolean),
    langs: b.languages || [], downloads: b.download_count || 0, subjects: (b.subjects || []).slice(0, 4), summary: (b.summaries || [])[0] || '',
    epub: epub ? f[epub] : u.epub, txt: txt ? f[txt] : u.txt, cover: f['image/jpeg'] || u.cover, page: u.page,
  }
}
async function novelSearchGutendex(q, lang) {
  const p = [['search', q]]; if (lang) p.push(['languages', lang])
  const j = await getJson(`${GX}/?${qs(p)}`, { timeout: 15000 })
  return (j.results || []).slice(0, 8).map(normBook)
}
// cadangan bila Gutendex mati: halaman pencarian Gutenberg
async function novelSearchSite(q) {
  const r = await getBuf(`${GB}/ebooks/search/?${qs([['query', q], ['submit_search', 'Go!']])}`, 2 * 1024 * 1024, { tries: 2 })
  const $ = require('cheerio').load(r.buffer.toString('utf8')), out = []
  $('li.booklink').each((_, el) => {
    const href = $(el).find('a.link').attr('href') || '', id = (href.match(/\/ebooks\/(\d+)/) || [])[1]; if (!id) return
    const u = gUrl(id); out.push({ id: +id, title: $(el).find('.title').text().trim(), authors: [flipName($(el).find('.subtitle').text().trim())].filter(Boolean), langs: [], downloads: parseInt(String($(el).find('.extra').text()).replace(/\D/g, ''), 10) || 0, subjects: [], summary: '', epub: u.epub, txt: u.txt, cover: u.cover, page: u.page })
  })
  return out.slice(0, 8)
}
async function novelSearch(q, lang) {
  try { const r = await novelSearchGutendex(q, lang); if (r.length) return { list: r, src: 'Gutendex' } } catch (e) { if (/Server membalas 4/.test(e.message)) throw e }
  return { list: await novelSearchSite(q), src: 'Project Gutenberg' }
}
async function novelGet(id) {
  try { const j = await getJson(`${GX}/${encodeURIComponent(id)}`, { timeout: 12000 }); if (j && j.id) return normBook(j) } catch {}
  return null
}
// teks novel bersih: buang header/footer lisensi Gutenberg, gabung baris keras jadi paragraf, pecah per ~3500 karakter
function cleanGutenberg(raw) {
  let t = String(raw || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const s = t.search(/\*\*\* ?START OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*\n/i)
  if (s >= 0) t = t.slice(t.indexOf('\n', s) + 1)
  const e = t.search(/\*\*\* ?END OF (?:THE|THIS) PROJECT GUTENBERG/i); if (e >= 0) t = t.slice(0, e)
  return t.trim()
}
function paginate(text, size = 3500) {
  const paras = String(text).split(/\n{2,}/).map(p => p.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim()).filter(Boolean)
  const pages = []; let cur = ''
  const push = () => { if (cur.trim()) pages.push(cur.trim()); cur = '' }
  for (let p of paras) {
    while (p.length > size) {                               // paragraf super panjang: potong di akhir kalimat / spasi
      let cut = p.lastIndexOf('. ', size); if (cut < size * 0.5) cut = p.lastIndexOf(' ', size); if (cut < 1) cut = size
      if (cur) push(); pages.push(p.slice(0, cut + 1).trim()); p = p.slice(cut + 1).trim()
    }
    if (cur && cur.length + p.length + 2 > size) push()
    cur += (cur ? '\n\n' : '') + p
  }
  push(); return pages
}
const tcache = new Map()
async function novelText(book) {
  const hit = tcache.get(book.id); if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit
  const r = await getBuf(book.txt, 12 * 1024 * 1024, { tries: 2, timeout: 40000 })
  const raw = cleanGutenberg(r.buffer.toString('utf8')), v = { t: Date.now(), raw, pages: paginate(raw) }
  tcache.set(book.id, v); if (tcache.size > 4) tcache.delete(tcache.keys().next().value)
  return v
}
async function novelEpub(book) {
  let last
  for (const u of [book.epub, gUrl(book.id).epub3, gUrl(book.id).epub]) {
    try { const r = await getBuf(u, 48 * 1024 * 1024, { tries: 2, timeout: 60000 }); if (r.buffer.slice(0, 2).toString() === 'PK') return r.buffer } catch (e) { last = e; if (e.code === 'ETOOBIG') throw e }
  }
  throw last || new Error('EPUB tidak tersedia')
}
async function novelPdf(book) {
  const { raw } = await novelText(book), parts = []
  if (raw.length > 1500000) throw new Error('Buku terlalu panjang untuk dijadikan PDF — pakai format epub')
  try { const c = await getBuf(book.cover, 2 * 1024 * 1024, { tries: 1 }); if (isImg(c.buffer)) { const sharp = require('sharp'), { data, info } = await sharp(c.buffer).flatten({ background: '#fff' }).toColourspace('srgb').jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true }); parts.push({ jpeg: data, w: info.width, h: info.height }) } } catch {}
  parts.push({ text: paginate(raw, 1e9).join('\n\n'), title: book.title.slice(0, 80) })
  return PDF.build(parts)
}

const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'berkas'
const clip = (t, n) => { t = String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t }

module.exports = {
  _setFetch, getJson, getBuf, LANGS, langName, RATING,
  mangaSearch, mangaGet, mangaChapters, chapterPages, chLabel, findChapter, fetchAll, imagesToPdf, imagesToCbz, isImg,
  novelSearch, novelGet, novelText, novelEpub, novelPdf, cleanGutenberg, paginate, flipName, gUrl,
  slug, clip, sleep,
}
