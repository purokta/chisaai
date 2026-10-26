/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat web tambahan (tanpa API key, tanpa dependency):
//   .cekweb <url>    status HTTP, waktu respons, rantai redirect, server, tipe & ukuran, judul halaman
//   .cekssl <domain> sertifikat SSL/TLS: penerbit, masa berlaku, sisa hari, nama domain (SAN), protokol
// Alamat lokal/privat diblokir (lib/netguard.js). Untuk unduh file dari URL / lihat sumber HTML: .snip ambil / .snip lihat
const tls = require('tls'), dns = require('dns'), NG = require('../../lib/netguard'), { B } = require('../../lib/style')

const COOLDOWN = 6000, last = new Map()
const size = (b) => b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B'
const unesc = (s) => String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
const ALIAS = { webcek: 'cekweb', cekstatus: 'cekweb', statusweb: 'cekweb', ssl: 'cekssl', sslcek: 'cekssl', cekssl: 'cekssl', cekweb: 'cekweb' }

function certInfo(host, port = 443) {
  return new Promise((resolve, reject) => {
    dns.lookup(host, { all: true }, (err, addrs) => {
      if (err) return reject(err)
      if (addrs.some(a => NG.isPrivateIp(a.address))) return reject(Object.assign(new Error('alamat tujuan privat/internal diblokir'), { code: 'EBLOCKED' }))
      const sock = tls.connect({ host: addrs[0].address, port, servername: host, rejectUnauthorized: false, timeout: 12000 }, () => {
        const c = sock.getPeerCertificate(), out = { cert: c, authorized: sock.authorized, authError: sock.authorizationError, protocol: sock.getProtocol() }
        sock.end(); resolve(out)
      })
      sock.on('timeout', () => { sock.destroy(); reject(Object.assign(new Error('waktu habis'), { code: 'ETIMEDOUT' })) })
      sock.on('error', reject)
    })
  })
}

module.exports = {
  name: 'webplus', alias: Object.keys(ALIAS), category: 'tools', cmds: ['cekweb', 'cekssl'], noLimit: false,
  desc: 'Cek situs: .cekweb (status, waktu respons, redirect) dan .cekssl (sertifikat SSL)',
  certInfo,
  run: async ({ m, text, command, prefix, reply }) => {
    const P = prefix || '.', cmd = ALIAS[command] || command, q = String(text || '').trim().split(/\s+/)[0] || ''
    if (!q) return reply(cmd === 'cekweb' ? `${B('CEK WEB')}\nContoh: ${P}cekweb google.com` : `${B('CEK SSL')}\nContoh: ${P}cekssl github.com`)
    const now = Date.now(), prev = last.get(m.sender) || 0
    if (now - prev < COOLDOWN) return reply(`⏳ Tunggu ${Math.ceil((COOLDOWN - (now - prev)) / 1000)} detik lagi.`)
    last.set(m.sender, now)
    try {
      if (cmd === 'cekweb') {
        const r = await NG.safeFetch(q, { maxBytes: 512 * 1024, truncate: true, timeout: 15000 })
        const ct = String(r.headers['content-type'] || '-').split(';')[0]
        const title = /html/i.test(ct) ? (r.buffer.toString('utf8', 0, 200000).match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] : ''
        const len = Number(r.headers['content-length'] || 0)
        const hops = r.chain.length > 1 ? r.chain.map(c => `${c.status} ${c.url}`).join('\n   ↪ ') : ''
        return reply([B('CEK WEB'), r.url, '',
          `Status  : ${r.status} ${r.status < 400 ? '(aktif)' : '(bermasalah)'}`, `Respons : ${r.ms} ms${r.chain.length > 1 ? ` (${r.chain.length - 1} redirect)` : ''}`,
          `Server  : ${r.headers.server || '-'}`, `Tipe    : ${ct}`, `Ukuran  : ${len ? size(len) : r.truncated ? '>' + size(r.bytes) : size(r.bytes)}`,
          title ? `Judul   : ${unesc(title).replace(/\s+/g, ' ').trim().slice(0, 100)}` : '', `HSTS    : ${r.headers['strict-transport-security'] ? 'ya' : 'tidak'}`,
          hops ? `\nJalur redirect:\n   ${hops}` : ''].filter(x => x !== '').join('\n'))
      }
      const host = (NG.parseUrl(q) || {}).hostname
      if (!host || /^[\d.]+$|:/.test(host)) return reply('✕ Tulis nama domain, contoh: github.com')
      const { cert: c, authorized, authError, protocol } = await certInfo(host)
      if (!c || !c.valid_to) return reply('✕ Server tidak mengirim sertifikat.')
      const days = Math.floor((new Date(c.valid_to) - Date.now()) / 86400000), tgl = (s) => new Date(s).toISOString().slice(0, 10)
      const san = String(c.subjectaltname || '').split(', ').map(x => x.replace(/^DNS:/, '')).filter(Boolean)
      return reply([B('CEK SSL'), host, '',
        `Status    : ${days < 0 ? 'KEDALUWARSA' : authorized ? 'valid dan tepercaya' : 'tidak tepercaya (' + (authError || 'tidak diketahui') + ')'}`,
        `Berlaku   : ${tgl(c.valid_from)} → ${tgl(c.valid_to)}`, `Sisa      : ${days < 0 ? 'lewat ' + (-days) : days} hari${days >= 0 && days <= 14 ? ' ⚠ segera perpanjang' : ''}`,
        `Penerbit  : ${(c.issuer && (c.issuer.O || c.issuer.CN)) || '-'}`, `Subjek    : ${(c.subject && c.subject.CN) || '-'}`, `Protokol  : ${protocol || '-'}`,
        san.length ? `Domain    : ${san.slice(0, 6).join(', ')}${san.length > 6 ? ` (+${san.length - 6})` : ''}` : ''].filter(Boolean).join('\n'))
    } catch (e) {
      console.log('[webplus]', cmd, e.message)
      const msg = e.code === 'EBADURL' || e.code === 'EBLOCKED' ? 'Alamat tidak valid atau tidak boleh diakses.' : e.code === 'ETIMEDOUT' ? 'Situs terlalu lama merespons.' : e.code === 'ENOTFOUND' ? 'Domain tidak ditemukan.' : e.message
      return reply('✕ ' + msg)
    }
  },
}
