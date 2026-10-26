/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Berkas & alat dev untuk Studio Kode (.snip) — membuat file, mengambil file dari URL, zip proyek, info npm, uji regex, diff.
//   .snip buat <nama[.ext]> [bahasa] <kode>   kode → file dokumen (.js .py .html dll). Bisa reply pesan kode
//   .snip ambil <url> [nama]                  unduh file dari URL → kirim sebagai dokumen
//   .snip lihat <url>                         ambil file teks dari URL → blok kode native
//   .snip proyek <nama>  + blok "=== path"    beberapa file → satu .zip     (cara pakai: .snip proyek)
//   .snip isizip [path]                       reply dokumen .zip → daftar isi / buka satu file sebagai kode
//   .snip npm <paket>                         info paket npm (versi, lisensi, dependensi)
//   .snip regex /pola/flag <teks>             uji regex (aman: batas waktu 300 ms)
//   .snip beda                                bandingkan 2 kode: kode A, baris "=====", kode B (atau reply A + kode B)
// Keamanan: URL hanya http/https, alamat privat/loopback/link-local diblokir (juga saat redirect & DNS), ukuran dibatasi,
// kode TIDAK dijalankan (regex berjalan di vm terisolasi dengan timeout).
const http = require('http'), https = require('https'), dns = require('dns'), net = require('net'), vm = require('vm'), zlib = require('zlib')
const CB = require('../codeblock'), AJ = require('../ajaib'), { B } = require('../style')

const MAX_DL = 25 * 1024 * 1024, MAX_TEXT = 300 * 1024, MAX_ZIP_IN = 20 * 1024 * 1024, MAX_ZIP_FILE = 2 * 1024 * 1024, MAX_ZIP_ENTRIES = 500
const MAX_REDIRECT = 4, TIMEOUT = 25000, COOLDOWN = 8000
const last = new Map()

const size = (b) => b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B'
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
const quotedText = (m) => (m.quoted && (m.quoted.text || m.quoted.caption || m.quoted.conversation)) || ''

// ───────────── nama file & mimetype ─────────────
const LANG_EXT = { javascript: 'js', typescript: 'ts', python: 'py', json: 'json', html: 'html', css: 'css', bash: 'sh', shell: 'sh', sql: 'sql', java: 'java', kotlin: 'kt', c: 'c', cpp: 'cpp', csharp: 'cs', go: 'go', rust: 'rs', php: 'php', yaml: 'yml', markdown: 'md', xml: 'xml', ruby: 'rb', swift: 'swift', lua: 'lua', dart: 'dart', text: 'txt', plaintext: 'txt' }
const MIME = { js: 'text/javascript', mjs: 'text/javascript', cjs: 'text/javascript', ts: 'text/plain', json: 'application/json', html: 'text/html', css: 'text/css', md: 'text/markdown', txt: 'text/plain', py: 'text/x-python', sh: 'text/x-shellscript', sql: 'application/sql', xml: 'application/xml', yml: 'text/yaml', yaml: 'text/yaml', csv: 'text/csv', zip: 'application/zip', pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', mp3: 'audio/mpeg', mp4: 'video/mp4', svg: 'image/svg+xml' }
const CT_EXT = { 'application/json': 'json', 'text/html': 'html', 'text/css': 'css', 'text/plain': 'txt', 'text/javascript': 'js', 'application/javascript': 'js', 'application/zip': 'zip', 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'text/csv': 'csv', 'application/xml': 'xml', 'image/svg+xml': 'svg', 'audio/mpeg': 'mp3', 'video/mp4': 'mp4' }
const mimeOf = (name) => MIME[String(name).split('.').pop().toLowerCase()] || 'application/octet-stream'

// bersihkan nama: tanpa path, tanpa karakter aneh, panjang terbatas, tidak boleh diawali titik
function safeName(n, fallback = 'file.txt') {
  let s = String(n || '').split(/[\\/]/).pop().replace(/[^\w.\-+@]/g, '_').replace(/_{2,}/g, '_').replace(/^\.+/, '').slice(0, 80)
  return s || fallback
}
// path di dalam zip: boleh berfolder, tetapi tanpa "..", tanpa awalan "/", tanpa karakter aneh
function safePath(p) {
  const parts = String(p || '').replace(/\\/g, '/').split('/').filter(x => x && x !== '.')
  if (parts.some(x => x === '..')) return null
  const out = parts.map(x => safeName(x, '')).filter(Boolean)
  return out.length ? out.join('/').slice(0, 160) : null
}

// ───────────── ambil URL dengan penjaga SSRF ─────────────
function isPrivateIp(ip) {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase()
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateIp(mapped[1])
    return v === '::' || v === '::1' || /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || /^ff/.test(v) || v.startsWith('64:ff9b:') || v.startsWith('2001:db8')
  }
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some(x => !(x >= 0 && x <= 255))) return true
  const [a, b] = p
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
}
// lookup yang dipakai socket → alamat divalidasi tepat saat menyambung (anti DNS-rebinding)
function guardedLookup(allowPrivate) {
  return (host, opts, cb) => {
    if (typeof opts === 'function') { cb = opts; opts = {} }
    dns.lookup(host, { all: true }, (err, list) => {
      if (err) return cb(err)
      const ok = list.filter(a => allowPrivate || !isPrivateIp(a.address))
      if (!ok.length) { const e = new Error('alamat tujuan diblokir (jaringan privat)'); e.code = 'EBLOCKED'; return cb(e) }
      if (opts && opts.all) return cb(null, ok)
      cb(null, ok[0].address, ok[0].family)
    })
  }
}
function parseUrl(s) {
  s = String(s || '').trim().replace(/^<|>$/g, '')
  if (!/^https?:\/\//i.test(s)) s = /^[\w-]+(\.[\w-]+)+(\/|$)/.test(s) ? 'https://' + s : s
  let u; try { u = new URL(s) } catch { return null }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null
  const h = u.hostname.replace(/^\[|\]$/g, '')
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(h)) return { blocked: true, url: u }
  if (net.isIP(h) && isPrivateIp(h)) return { blocked: true, url: u }
  return { url: u }
}

// unduh dengan batas ukuran + redirect manual (tiap lompatan divalidasi ulang)
function fetchBuf(urlStr, o = {}) {
  const { maxBytes = MAX_DL, allowPrivate = false, headers = {}, redirects = 0 } = o
  return new Promise((resolve, reject) => {
    const pu = parseUrl(urlStr)
    if (!pu) return reject(Object.assign(new Error('URL tidak valid'), { code: 'EBADURL' }))
    if (pu.blocked && !allowPrivate) return reject(Object.assign(new Error('alamat tujuan diblokir (jaringan privat)'), { code: 'EBLOCKED' }))
    const u = pu.url, lib = u.protocol === 'https:' ? https : http
    const req = lib.request(u, { method: 'GET', lookup: guardedLookup(allowPrivate), headers: { 'User-Agent': 'Mozilla/5.0 (Chisa AI-Bot)', Accept: '*/*', 'Accept-Encoding': 'identity', ...headers }, timeout: TIMEOUT }, (res) => {
      const st = res.statusCode || 0
      if (st >= 300 && st < 400 && res.headers.location) {
        res.resume()
        if (redirects >= MAX_REDIRECT) return reject(Object.assign(new Error('terlalu banyak pengalihan'), { code: 'EREDIR' }))
        let next; try { next = new URL(res.headers.location, u).toString() } catch { return reject(Object.assign(new Error('pengalihan tidak valid'), { code: 'EREDIR' })) }
        return fetchBuf(next, { ...o, redirects: redirects + 1 }).then(resolve, reject)
      }
      if (st < 200 || st >= 300) { res.resume(); return reject(Object.assign(new Error('HTTP ' + st), { code: 'EHTTP', status: st })) }
      const declared = Number(res.headers['content-length'] || 0)
      if (declared > maxBytes) { res.destroy(); return reject(Object.assign(new Error('terlalu besar'), { code: 'ESIZE', size: declared })) }
      const chunks = []; let n = 0
      res.on('data', (c) => { n += c.length; if (n > maxBytes) { res.destroy(); reject(Object.assign(new Error('terlalu besar'), { code: 'ESIZE', size: n })) } else chunks.push(c) })
      res.on('end', () => resolve({ buf: Buffer.concat(chunks), headers: res.headers, finalUrl: u.toString(), status: st }))
      res.on('error', reject)
    })
    req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })))
    req.on('error', reject)
    req.end()
  })
}
const netErr = (e) => ({
  EBADURL: 'URL tidak valid. Contoh: https://example.com/file.js',
  EBLOCKED: 'Alamat itu tidak boleh diakses (jaringan lokal/privat).',
  ESIZE: `File terlalu besar (maks ${size(MAX_DL)}).`,
  EREDIR: 'Terlalu banyak pengalihan (redirect).',
  ETIMEOUT: 'Server terlalu lama merespons.',
  ENOTFOUND: 'Domain tidak ditemukan.',
  ECONNREFUSED: 'Koneksi ditolak server.',
  ECONNRESET: 'Koneksi terputus.',
}[e.code] || (e.code === 'EHTTP' ? `Server membalas HTTP ${e.status}.` : 'Gagal mengambil file dari URL itu.'))

function nameFromResponse(res, urlStr) {
  const cd = String(res.headers['content-disposition'] || '')
  let n = (cd.match(/filename\*=UTF-8''([^;]+)/i) || [])[1]
  if (n) { try { n = decodeURIComponent(n) } catch {} } else n = (cd.match(/filename="?([^";]+)"?/i) || [])[1]
  if (!n) { try { n = decodeURIComponent(new URL(urlStr).pathname.split('/').filter(Boolean).pop() || '') } catch { n = '' } }
  n = safeName(n, '')
  if (!n || !/\.[A-Za-z0-9]{1,8}$/.test(n)) {
    const ct = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
    n = (n || 'file') + '.' + (CT_EXT[ct] || 'bin')
  }
  return n
}
const looksBinary = (buf) => { const n = Math.min(buf.length, 4000); for (let i = 0; i < n; i++) if (buf[i] === 0) return true; return false }

// ───────────── ZIP (tanpa dependensi: zlib bawaan Node) ─────────────
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (buf) => { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0 }

function makeZip(files) {   // files: [{ name, data:Buffer }]
  const locals = [], central = []; let offset = 0
  const d = new Date(), dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8'), raw = f.data, def = zlib.deflateRawSync(raw, { level: 9 })
    const useDef = def.length < raw.length, body = useDef ? def : raw, crc = crc32(raw), method = useDef ? 8 : 0
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8)
    lh.writeUInt16LE(dosTime, 10); lh.writeUInt16LE(dosDate, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26)
    locals.push(lh, name, body)
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10)
    ch.writeUInt16LE(dosTime, 12); ch.writeUInt16LE(dosDate, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(offset, 42)
    central.push(ch, name)
    offset += 30 + name.length + body.length
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, cd, end])
}
function listZip(buf) {   // → [{ name, size, csize, method, offset, dir }]  (hanya membaca direktori pusat)
  let e = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break }
  if (e < 0) throw new Error('bukan arsip zip yang valid')
  const total = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16); const out = []
  if (total > MAX_ZIP_ENTRIES) throw new Error(`isi zip terlalu banyak (maks ${MAX_ZIP_ENTRIES} berkas)`)
  for (let i = 0; i < total; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('direktori zip rusak')
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24)
    const nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42)
    const name = buf.slice(p + 46, p + 46 + nl).toString(flags & 0x0800 ? 'utf8' : 'latin1')
    out.push({ name, size: usize, csize, method, offset: off, dir: name.endsWith('/'), enc: !!(flags & 1) })
    p += 46 + nl + xl + cl
  }
  return out
}
function readZipEntry(buf, ent) {   // batas keluaran melindungi dari zip-bomb
  if (ent.enc) throw new Error('berkas terenkripsi')
  if (ent.size > MAX_ZIP_FILE) throw new Error(`berkas terlalu besar (maks ${size(MAX_ZIP_FILE)})`)
  const o = ent.offset
  if (o + 30 > buf.length || buf.readUInt32LE(o) !== 0x04034b50) throw new Error('entri zip rusak')
  const start = o + 30 + buf.readUInt16LE(o + 26) + buf.readUInt16LE(o + 28), raw = buf.slice(start, start + ent.csize)
  if (ent.method === 0) return raw
  if (ent.method === 8) return zlib.inflateRawSync(raw, { maxOutputLength: MAX_ZIP_FILE + 1 })
  throw new Error('metode kompresi tidak didukung')
}

// "=== path" memisahkan berkas dalam satu pesan
function parseProject(body) {
  const lines = String(body || '').replace(/\r\n/g, '\n').split('\n'), files = []; let cur = null
  for (const ln of lines) {
    const h = ln.match(/^={3,}\s*(.+?)\s*=*\s*$/)
    if (h) { cur = { name: h[1], buf: [] }; files.push(cur) } else if (cur) cur.buf.push(ln)
  }
  return files.map(f => ({ name: f.name, text: f.buf.join('\n').replace(/^\n+|\s+$/g, '') })).filter(f => f.name)
}

// ───────────── regex aman & diff ─────────────
function runRegex(pattern, flags, text) {
  const ctx = vm.createContext({ P: pattern, F: flags, T: text, out: null }, { codeGeneration: { strings: false, wasm: false } })
  vm.runInContext(`
    const re = new RegExp(P, F.includes('g') ? F : F + 'g'); const res = []; let m
    while ((m = re.exec(T)) !== null && res.length < 50) {
      res.push({ i: m.index, t: m[0], g: Array.from(m).slice(1).map(x => x === undefined ? null : x), n: m.groups ? Object.assign({}, m.groups) : null })
      if (m[0] === '') re.lastIndex++
    }
    out = res`, ctx, { timeout: 300 })
  return ctx.out
}
function lineDiff(a, b) {   // LCS per baris (maks 400 baris per sisi)
  const A = a.split('\n'), B2 = b.split('\n')
  if (A.length > 400 || B2.length > 400) return null
  const n = A.length, m = B2.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B2[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const out = []; let i = 0, j = 0, add = 0, del = 0
  while (i < n && j < m) {
    if (A[i] === B2[j]) { out.push('  ' + A[i]); i++; j++ } else if (L[i + 1][j] >= L[i][j + 1]) { out.push('- ' + A[i]); i++; del++ } else { out.push('+ ' + B2[j]); j++; add++ }
  }
  while (i < n) { out.push('- ' + A[i++]); del++ }
  while (j < m) { out.push('+ ' + B2[j++]); add++ }
  return { text: out.join('\n'), add, del }
}

const stripFence = (s) => (/```/.test(s) ? CB.unfence(s).code : s)

module.exports = {
  name: 'berkasdev', alias: ['kodebuat', 'ambilfile', 'lihaturl', 'projekzip', 'isizip', 'npminfo', 'ujiregex', 'bedakode'], category: 'tools', noLimit: true,
  cmds: ['kodebuat', 'ambilfile', 'lihaturl', 'projekzip', 'isizip', 'npminfo', 'ujiregex', 'bedakode'],
  desc: 'Berkas & alat dev: buat file kode, ambil file dari URL, zip proyek, isi zip, info npm, uji regex, bandingkan kode',
  _t: { parseUrl, isPrivateIp, fetchBuf, makeZip, listZip, readZipEntry, parseProject, safeName, safePath, runRegex, lineDiff, crc32, nameFromResponse },
  run: async (ctx) => {
    const { sock, m, command, prefix, reply } = ctx
    const P = prefix || '.', raw = CB.rawArgs(ctx), q = quotedText(m)
    const cooldown = () => {
      const now = Date.now(), prev = last.get(m.sender) || 0
      if (now - prev < COOLDOWN) return Math.ceil((COOLDOWN - (now - prev)) / 1000)
      last.set(m.sender, now); return 0
    }

    // ── buat: kode → file ──
    if (command === 'kodebuat') {
      const mm = raw.match(/^\s*(\S+)[ \t]*\n?([\s\S]*)$/)
      if (!mm) return reply(`${B('BUAT FILE')}\nUbah kode jadi file dokumen yang bisa langsung dipakai.\n\n${P}snip buat app.js\nconsole.log('halo')\n\n• Nama tanpa ekstensi? Ekstensi ditebak dari bahasa: ${P}snip buat server js <kode>\n• Atau reply pesan berisi kode: ${P}snip buat util.py\n• Banyak file sekaligus → ${P}snip proyek`)
      let name = safeName(mm[1], ''), body = mm[2] || '', lang = null
      if (/```/.test(body)) { const f = CB.unfence(body); body = f.code; lang = f.lang } else { const sp = CB.splitLang(body); body = sp.code; lang = sp.lang }
      if (!body.trim() && q.trim()) { if (/```/.test(q)) { const f = CB.unfence(q); body = f.code; lang = lang || f.lang } else body = q }
      body = body.replace(/\r\n/g, '\n').replace(/^\n+|\s+$/g, '')
      if (!name) return reply('✕ Nama file tidak valid.')
      if (!body) return reply('✕ Tidak ada kode. Tulis kode setelah nama file, atau reply pesan berisi kode.')
      if (Buffer.byteLength(body) > 1024 * 1024) return reply('✕ Kode terlalu besar (maks 1 MB).')
      if (!/\.[A-Za-z0-9]{1,8}$/.test(name)) {
        const l = lang || CB.detectLang(body)
        name += '.' + (LANG_EXT[l] || 'txt')
      }
      await sock.sendMessage(m.chat, { document: Buffer.from(body + '\n', 'utf8'), fileName: name, mimetype: mimeOf(name), caption: `📄 *${name}* — ${body.split('\n').length} baris, ${size(Buffer.byteLength(body))}` }, { quoted: m })
      return react(sock, m, '✅')
    }

    // ── ambil / lihat dari URL ──
    if (command === 'ambilfile' || command === 'lihaturl') {
      const toks = raw.trim().split(/\s+/).filter(Boolean)
      const view = command === 'lihaturl'
      if (!toks[0]) return reply(`${B(view ? 'LIHAT URL' : 'AMBIL FILE')}\n${view ? `Tampilkan file teks/kode dari URL sebagai blok kode:\n${P}snip lihat https://raw.githubusercontent.com/user/repo/main/app.js` : `Unduh file dari URL lalu kirim sebagai dokumen:\n${P}snip ambil https://example.com/data.json\n${P}snip ambil https://example.com/x.zip namabaru.zip`}\n\nMaks ${size(view ? MAX_TEXT : MAX_DL)} • hanya http/https • alamat lokal/privat diblokir.`)
      const wait = cooldown(); if (wait) { react(sock, m, '⏳'); return reply(`⏳ Tunggu ${wait} detik sebelum permintaan berikutnya.`) }
      react(sock, m, '🕕')
      try {
        const res = await fetchBuf(toks[0], { maxBytes: view ? MAX_TEXT : MAX_DL })
        if (view) {
          if (looksBinary(res.buf)) { react(sock, m, '❌'); return reply('✕ File itu biner, bukan teks/kode. Pakai ' + P + 'snip ambil untuk mengunduhnya.') }
          let code = res.buf.toString('utf8').replace(/\r\n/g, '\n'); const cut = code.length > CB.MAX_CODE
          if (cut) code = code.slice(0, CB.MAX_CODE)
          const fname = nameFromResponse(res, res.finalUrl), lang = CB.EXT_LANG(fname) || CB.detectLang(code)
          return CB.sendCode(sock, m, { intro: `🌐 *${fname}* — ${size(res.buf.length)}, ${code.split('\n').length} baris${cut ? ' (dipotong)' : ''}\n${res.finalUrl}`, code, lang, react: '🌐' })
        }
        const fname = toks[1] ? safeName(toks[1], nameFromResponse(res, res.finalUrl)) : nameFromResponse(res, res.finalUrl)
        await sock.sendMessage(m.chat, { document: res.buf, fileName: fname, mimetype: mimeOf(fname) !== 'application/octet-stream' ? mimeOf(fname) : String(res.headers['content-type'] || 'application/octet-stream').split(';')[0], caption: `📥 *${fname}* — ${size(res.buf.length)}\n🔗 ${res.finalUrl}` }, { quoted: m })
        return react(sock, m, '✅')
      } catch (e) { react(sock, m, '❌'); console.log('[berkas]', command, e.code || e.message); return reply(`✕ ${netErr(e)}`) }
    }

    // ── proyek: beberapa file → zip ──
    if (command === 'projekzip') {
      const mm = raw.match(/^\s*(\S*)[ \t]*\n?([\s\S]*)$/)
      let zname = safeName((mm && mm[1] && !/^={3}/.test(mm[1])) ? mm[1] : 'proyek', 'proyek').replace(/\.zip$/i, '')
      let body = (mm && !/^={3}/.test(mm[1] || '')) ? mm[2] : raw
      if (!/^\s*={3}/m.test(body) && q) body = q
      const files = parseProject(stripFence(body))
      if (!files.length) return reply(`${B('PROYEK → ZIP')}\nSatukan beberapa file jadi satu .zip. Awali tiap file dengan baris === nama-file:\n\n${P}snip proyek blogku\n=== index.js\nconsole.log('halo')\n=== package.json\n{ "name": "blogku" }\n=== src/util.js\nmodule.exports = {}\n\n• Boleh berfolder (src/util.js) • maks ${MAX_ZIP_ENTRIES} file`)
      if (files.length > 60) return reply('✕ Terlalu banyak file (maks 60 per perintah).')
      const seen = new Set(), entries = []
      for (const f of files) {
        const p = safePath(f.name); if (!p) return reply(`✕ Nama file tidak valid: ${f.name}`)
        if (seen.has(p)) return reply(`✕ Nama file ganda: ${p}`)
        seen.add(p); entries.push({ name: p, data: Buffer.from(f.text + '\n', 'utf8') })
      }
      const buf = makeZip(entries)
      if (buf.length > 5 * 1024 * 1024) return reply('✕ Hasil zip terlalu besar (maks 5 MB).')
      await sock.sendMessage(m.chat, { document: buf, fileName: zname + '.zip', mimetype: 'application/zip', caption: `🗜️ *${zname}.zip* — ${entries.length} file, ${size(buf.length)}\n${entries.slice(0, 12).map(e => '• ' + e.name).join('\n')}${entries.length > 12 ? `\n… +${entries.length - 12} lagi` : ''}` }, { quoted: m })
      return react(sock, m, '✅')
    }

    // ── isizip: daftar / buka satu file ──
    if (command === 'isizip') {
      const media = AJ.pickNode(m, ['document'])
      if (!media) return reply(`${B('ISI ZIP')}\nReply dokumen .zip dengan:\n${P}snip isizip           → daftar isi\n${P}snip isizip src/app.js   → buka satu file sebagai blok kode`)
      const nm = String(media.node.fileName || 'arsip.zip'), sz = Number(media.node.fileLength || 0)
      if (sz > MAX_ZIP_IN) return reply(`✕ Zip terlalu besar (maks ${size(MAX_ZIP_IN)}).`)
      let buf; try { buf = await AJ.download(media) } catch { return reply('✕ Gagal mengunduh dokumen.') }
      let list; try { list = listZip(buf) } catch (e) { return reply(`✕ ${e.message}.`) }
      const want = raw.trim().replace(/^\/+/, '')
      if (!want) {
        const files = list.filter(x => !x.dir)
        const rows = [['Berkas', 'Ukuran'], ...files.slice(0, 40).map(x => [x.name, size(x.size)])]
        return CB.sendTable(sock, m, { intro: `🗜️ *${nm}* — ${files.length} berkas${files.length > 40 ? ' (40 pertama)' : ''}`, title: nm, rows, outro: `Buka satu file: ${P}snip isizip <path>`, react: '🗜️' })
      }
      const ent = list.find(x => !x.dir && (x.name === want || x.name.toLowerCase() === want.toLowerCase())) || list.find(x => !x.dir && x.name.toLowerCase().endsWith('/' + want.toLowerCase()))
      if (!ent) return reply(`✕ "${want}" tidak ada di zip. Lihat daftar: ${P}snip isizip`)
      let data; try { data = readZipEntry(buf, ent) } catch (e) { return reply(`✕ Gagal membuka ${ent.name}: ${e.message}.`) }
      if (looksBinary(data)) return reply('✕ File itu biner, bukan teks/kode.')
      let code = data.toString('utf8').replace(/\r\n/g, '\n'); const cut = code.length > CB.MAX_CODE
      if (cut) code = code.slice(0, CB.MAX_CODE)
      return CB.sendCode(sock, m, { intro: `📄 *${ent.name}* (dalam ${nm}) — ${size(ent.size)}, ${code.split('\n').length} baris${cut ? ' (dipotong)' : ''}`, code, lang: CB.EXT_LANG(ent.name) || CB.detectLang(code), react: '📄' })
    }

    // ── npm ──
    if (command === 'npminfo') {
      const pkg = raw.trim().split(/\s+/)[0] || ''
      if (!pkg) return reply(`${B('INFO NPM')}\n${P}snip npm axios\n${P}snip npm @hapi/boom`)
      if (!/^(@[a-z0-9~][a-z0-9._~-]*\/)?[a-z0-9~][a-z0-9._~-]*$/i.test(pkg) || pkg.length > 120) return reply('✕ Nama paket tidak valid.')
      const wait = cooldown(); if (wait) return reply(`⏳ Tunggu ${wait} detik.`)
      react(sock, m, '🕕')
      try {
        const res = await fetchBuf('https://registry.npmjs.org/' + pkg.replace('/', '%2F'), { maxBytes: 8 * 1024 * 1024, headers: { Accept: 'application/vnd.npm.install-v1+json, application/json' } })
        const d = JSON.parse(res.buf.toString('utf8')), tag = (d['dist-tags'] || {}).latest, v = (d.versions || {})[tag] || {}
        const deps = Object.entries(v.dependencies || {})
        const rows = [['Info', 'Nilai'], ['Versi', tag || '-'], ['Lisensi', typeof v.license === 'string' ? v.license : '-'], ['Dependensi', String(deps.length)], ['Node', (v.engines && v.engines.node) || '-'], ['Total versi', String(Object.keys(d.versions || {}).length)]]
        const parts = [{ text: `📦 *${d.name}*${d.description ? `\n${String(d.description).slice(0, 200)}` : ''}\n🔗 https://www.npmjs.com/package/${d.name}` }, { table: { title: 'Paket', rows } }]
        if (deps.length) parts.push({ text: '🧩 *Dependensi*' }, { code: deps.slice(0, 40).map(([k, x]) => `${k}  ${x}`).join('\n'), lang: 'text' })
        parts.push({ text: `Pasang: npm install ${d.name}` })
        return CB.sendRich(sock, m, parts, { react: '📦' })
      } catch (e) {
        react(sock, m, '❌')
        return reply(e.code === 'EHTTP' && e.status === 404 ? `✕ Paket "${pkg}" tidak ditemukan di npm.` : `✕ ${netErr(e)}`)
      }
    }

    // ── regex ──
    if (command === 'ujiregex') {
      const mm = raw.match(/^\s*\/((?:\\.|[^/\\\n])+)\/([a-z]*)[ \t]*\n?([\s\S]*)$/i)
      if (!mm) return reply(`${B('UJI REGEX')}\n${P}snip regex /\\d+/g Harga 120 dan 45\n${P}snip regex /(?<nama>\\w+)@(\\w+)\\.com/ budi@mail.com\n\nBisa juga reply teks, lalu: ${P}snip regex /pola/g\nBatas waktu 300 ms (regex rakus akan dihentikan).`)
      let text = mm[3] || ''; if (!text.trim() && q) text = q
      text = text.replace(/\r\n/g, '\n').replace(/\n$/, '')
      if (!text) return reply('✕ Tidak ada teks untuk diuji. Tulis teks setelah regex atau reply sebuah pesan.')
      if (text.length > 20000) return reply('✕ Teks terlalu panjang (maks 20.000 karakter).')
      if (!/^[dgimsuy]*$/.test(mm[2]) || new Set(mm[2]).size !== mm[2].length) return reply('✕ Flag regex tidak valid (boleh: d g i m s u y).')
      let hits
      try { hits = runRegex(mm[1], mm[2], text) } catch (e) {
        return reply(/timed out/i.test(e.message) ? '⏱️ Regex dihentikan: terlalu lama diproses (kemungkinan backtracking berlebihan).' : `✕ Regex bermasalah: ${String(e.message).replace(/^Invalid regular expression: /, '').slice(0, 200)}`)
      }
      if (!hits.length) return reply(`🔍 /${mm[1]}/${mm[2]} — *tidak ada yang cocok*.`)
      const rows = [['#', 'Posisi', 'Cocok', 'Grup'], ...hits.slice(0, 25).map((h, i) => [String(i + 1), String(h.i), h.t.length > 40 ? h.t.slice(0, 40) + '…' : h.t || '(kosong)', [...h.g.map(x => x === null ? '-' : x), ...(h.n ? Object.entries(h.n).map(([k, x]) => `${k}=${x}`) : [])].join(', ').slice(0, 60) || '-'])]
      return CB.sendTable(sock, m, { intro: `🔍 /${mm[1]}/${mm[2]} — *${hits.length}${hits.length >= 50 ? '+' : ''} kecocokan*`, title: 'Hasil regex', rows, react: '🔍' })
    }

    // ── diff ──
    if (command === 'bedakode') {
      let a, b
      const body = stripFence(raw).replace(/\r\n/g, '\n')
      const sp = body.split(/\n={5,}[ \t]*\n/)
      if (sp.length >= 2) { a = sp[0]; b = sp.slice(1).join('\n=====\n') } else if (q.trim() && body.trim()) { a = stripFence(q).replace(/\r\n/g, '\n'); b = body }
      if (a === undefined || !a.trim() || !String(b).trim()) return reply(`${B('BANDINGKAN KODE')}\nDua cara:\n1) Satu pesan: kode A, baris =====, lalu kode B\n${P}snip beda\nlet a = 1\n=====\nlet a = 2\n\n2) Reply kode A, lalu tulis kode B setelah perintah.`)
      const d = lineDiff(a.replace(/^\n+|\s+$/g, ''), String(b).replace(/^\n+|\s+$/g, ''))
      if (!d) return reply('✕ Kode terlalu panjang untuk dibandingkan (maks 400 baris per sisi).')
      if (!d.add && !d.del) return reply('✅ Kedua kode *identik*.')
      return CB.sendCode(sock, m, { intro: `🔀 *Perbedaan* — +${d.add} baris, −${d.del} baris`, code: d.text, lang: 'text', react: '🔀' })
    }
  },
}
