/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pengambil URL yang aman dari SSRF — dipakai .cekweb .geturl .sumberweb .cekssl
//   • hanya http/https, port bebas tetapi alamat tujuan HARUS publik (loopback, LAN, link-local, CGNAT, metadata cloud diblokir)
//   • pengecekan dilakukan di level `lookup` DNS, jadi redirect & DNS-rebinding ikut terjaga (bukan sekadar cek hostname)
//   • redirect diikuti manual (maks 5) dan tiap lompatan diperiksa ulang
//   • ukuran dibatasi: lewat batas → error (atau dipotong bila truncate:true)
// Hanya memakai modul bawaan Node (tanpa axios), sehingga bisa diuji lokal.
const dns = require('dns'), http = require('http'), https = require('https'), net = require('net')

const UA = 'Mozilla/5.0 (compatible; ChisaBot/4.11; +https://whatsapp.com)'
let _allowPrivate = false                       // HANYA untuk skrip uji (server lokal). Jangan dipanggil dari plugin.
const _testAllowPrivate = (v) => { _allowPrivate = !!v }

function isPrivateIp(ip) {
  ip = String(ip || '').toLowerCase()
  if (ip.startsWith('::ffff:') && net.isIPv4(ip.slice(7))) ip = ip.slice(7)
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19))
  }
  if (net.isIPv6(ip)) return ip === '::' || ip === '::1' || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip) || ip.startsWith('ff')
  return true                                    // bukan IP valid → tolak
}

// lookup khusus: tolak jika SALAH SATU alamat hasil DNS bersifat privat
function guardedLookup(host, opts, cb) {
  if (typeof opts === 'function') { cb = opts; opts = {} }
  dns.lookup(host, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err)
    if (!_allowPrivate && addrs.some(a => isPrivateIp(a.address))) return cb(Object.assign(new Error('alamat tujuan privat/internal diblokir'), { code: 'EBLOCKED' }))
    if (opts && opts.all) return cb(null, addrs)
    cb(null, addrs[0].address, addrs[0].family)
  })
}

// normalisasi + validasi awal. Mengembalikan URL atau null.
function parseUrl(u) {
  try {
    u = String(u || '').trim().replace(/[<>]/g, '')
    const x = new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u)
    if (!/^https?:$/.test(x.protocol) || x.username || x.password) return null
    if (net.isIP(x.hostname.replace(/^\[|\]$/g, ''))) { if (!_allowPrivate && isPrivateIp(x.hostname.replace(/^\[|\]$/g, ''))) return null }
    else if (!x.hostname.includes('.') && !_allowPrivate) return null
    if (!_allowPrivate && /\.(local|internal|localhost|lan)$/i.test(x.hostname)) return null
    return x
  } catch { return null }
}

function once(url, { method, headers, timeout, maxBytes, truncate }) {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http
    const req = lib.request(url, { method, headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Encoding': 'identity', ...headers }, lookup: guardedLookup, timeout }, (res) => {
      const out = { status: res.statusCode, headers: res.headers, chunks: [], bytes: 0, truncated: false }
      if (method === 'HEAD' || (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)) { res.resume(); return resolve({ ...out, buffer: Buffer.alloc(0) }) }
      const declared = Number(res.headers['content-length'] || 0)
      if (!truncate && declared > maxBytes) { res.destroy(); return reject(Object.assign(new Error('file terlalu besar'), { code: 'ETOOBIG', size: declared })) }
      res.on('data', (c) => {
        out.bytes += c.length
        if (out.bytes > maxBytes) {
          if (!truncate) { res.destroy(); return reject(Object.assign(new Error('file terlalu besar'), { code: 'ETOOBIG', size: out.bytes })) }
          out.chunks.push(c.subarray(0, c.length - (out.bytes - maxBytes))); out.bytes = maxBytes; out.truncated = true; res.destroy(); return resolve({ ...out, buffer: Buffer.concat(out.chunks) })
        }
        out.chunks.push(c)
      })
      res.on('end', () => resolve({ ...out, buffer: Buffer.concat(out.chunks) }))
      res.on('error', (e) => { if (out.truncated) return; reject(e) })
      res.on('close', () => { if (out.truncated) resolve({ ...out, buffer: Buffer.concat(out.chunks) }) })
    })
    req.on('timeout', () => req.destroy(Object.assign(new Error('waktu habis'), { code: 'ETIMEDOUT' })))
    req.on('error', reject)
    req.end()
  })
}

// safeFetch(url, { method, headers, timeout, maxBytes, truncate, maxRedirects })
//  → { status, headers, buffer, bytes, truncated, url (akhir), chain:[{url,status}], ms }
async function safeFetch(input, o = {}) {
  const opt = { method: o.method || 'GET', headers: o.headers || {}, timeout: o.timeout || 20000, maxBytes: o.maxBytes || 5 * 1024 * 1024, truncate: !!o.truncate }
  let url = parseUrl(input); if (!url) throw Object.assign(new Error('URL tidak valid atau mengarah ke alamat internal'), { code: 'EBADURL' })
  const chain = [], t0 = Date.now(), max = o.maxRedirects == null ? 5 : o.maxRedirects
  for (let i = 0; i <= max; i++) {
    const r = await once(url, opt)
    chain.push({ url: url.href, status: r.status })
    if (r.status >= 300 && r.status < 400 && r.headers.location) {
      let next; try { next = new URL(r.headers.location, url) } catch { throw new Error('redirect tidak valid') }
      const ok = parseUrl(next.href); if (!ok) throw Object.assign(new Error('redirect ke alamat tidak diizinkan'), { code: 'EBADURL' })
      url = ok; continue
    }
    return { ...r, url: url.href, chain, ms: Date.now() - t0 }
  }
  throw new Error('terlalu banyak redirect')
}

const fileNameOf = (res) => {
  const cd = String(res.headers['content-disposition'] || '')
  let n = (cd.match(/filename\*=UTF-8''([^;]+)/i) || [])[1]; if (n) { try { n = decodeURIComponent(n) } catch {} }
  n = n || (cd.match(/filename="?([^";]+)"?/i) || [])[1]
  if (!n) { try { n = decodeURIComponent(new URL(res.url).pathname.split('/').filter(Boolean).pop() || '') } catch { n = '' } }
  n = String(n || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '').slice(0, 100)
  return n || 'file'
}

module.exports = { safeFetch, parseUrl, isPrivateIp, fileNameOf, guardedLookup, UA, _testAllowPrivate }
