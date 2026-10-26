// Penjaga URL (anti-SSRF) untuk Mode Diony: blokir alamat internal/lokal pada fitur yang mengambil URL dari pengguna.
// (Bagian lain dari "Shield" paket asli — lockdown, shell, auto-join — sengaja TIDAK dibawa.)
const net = require('net')
const dns = require('dns').promises

function privateIp(ip) {
  if (!ip) return true
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::') return true
    if (v.startsWith('::ffff:')) return privateIp(v.slice(7))
    return /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith('ff')
  }
  return true
}
function literalBlocked(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '')
  if (!h || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.lan')) return true
  if (net.isIP(h)) return privateIp(h)
  if (/^(0x[0-9a-f]+|\d+)$/i.test(h)) return true
  return false
}
async function assertSafeUrl(raw) {
  let u; try { u = new URL(String(raw).trim()) } catch { throw new Error('URL tidak valid') }
  if (!/^https?:$/.test(u.protocol)) throw new Error('Hanya http/https yang diizinkan')
  if (u.username || u.password) throw new Error('URL dengan kredensial tidak diizinkan')
  if (literalBlocked(u.hostname)) throw new Error('Alamat internal/lokal tidak diizinkan')
  if (!net.isIP(u.hostname.replace(/^\[|\]$/g, ''))) {
    let addrs = []; try { addrs = await dns.lookup(u.hostname, { all: true }) } catch { throw new Error('Domain tidak ditemukan') }
    if (!addrs.length || addrs.some(a => privateIp(a.address))) throw new Error('Domain mengarah ke alamat internal')
  }
  return u.href
}
const axiosGuard = { maxRedirects: 5, beforeRedirect: opts => { if (literalBlocked(opts.hostname) || !/^https?:$/.test(String(opts.protocol || 'https:'))) throw new Error('Redirect ke alamat internal diblokir') } }
const assertHttpUrl = u => { if (!/^https?:\/\/[^\s]+$/i.test(String(u || '').trim())) throw new Error('URL harus diawali http:// atau https://'); return String(u).trim() }

module.exports = { assertSafeUrl, assertHttpUrl, axiosGuard, literalBlocked, privateIp, log() {}, isMaster: () => false }
