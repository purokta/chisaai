/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat jaringan (gratis, tanpa key):
//   .dns <domain> [A|AAAA|MX|TXT|NS|CNAME]   cek DNS lewat Cloudflare DoH
//   .cekip [ip|domain]                         lokasi & penyedia IP (ip-api.com)
//   .domaininfo <domain>                       data pendaftaran domain (RDAP)
const axios = require('axios'), { B } = require('../../lib/style')
const L = '━━━━━━━━━━━━━━━━━━━━'
const TYPES = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28 }, NAME = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k]))
const cleanHost = (s) => String(s || '').trim().toLowerCase().replace(/^https?:\/\//, '').split(/[/?#]/)[0].replace(/:\d+$/, '')
const valid = (h) => /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/.test(h) && !/^-|-\./.test(h)
const isPrivate = (h) => /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(h) || h === 'localhost'
module.exports = {
  name: 'dns', alias: ['cekdns', 'cekip', 'ipinfo', 'domaininfo', 'rdap', 'whoisdomain'], category: 'tools', cmds: ['dns', 'cekip', 'domaininfo'], noLimit: false,
  desc: 'Alat jaringan: .dns <domain> [tipe] • .cekip [ip|domain] • .domaininfo <domain>',
  run: async ({ command, args, prefix, reply }) => {
    try {
      if (['cekip', 'ipinfo'].includes(command)) {
        const t = cleanHost(args[0]); if (t && isPrivate(t)) return reply('Alamat lokal/privat tidak bisa dicek.')
        const { data: d } = await axios.get(`http://ip-api.com/json/${encodeURIComponent(t)}`, { timeout: 15000, params: { fields: 'status,message,query,country,regionName,city,isp,org,as,timezone,proxy,hosting,lat,lon' } })
        if (d.status !== 'success') return reply(`Gagal: ${d.message || 'tidak ditemukan'}${t ? '' : '\n_Tulis IP atau domain: ' + prefix + 'cekip 1.1.1.1_'}`)
        return reply(`${B('INFO IP')}\n${L}\nIP        : ${d.query}\nNegara    : ${d.country}\nWilayah   : ${d.regionName}, ${d.city}\nPenyedia  : ${d.isp}\nOrganisasi: ${d.org || '-'}\nASN       : ${d.as || '-'}\nZona waktu: ${d.timezone}\nProxy/VPN : ${d.proxy ? 'ya' : 'tidak'}   Hosting: ${d.hosting ? 'ya' : 'tidak'}\n\n_Lokasi IP hanya perkiraan kota/wilayah._`)
      }
      const h = cleanHost(args[0]); if (!valid(h)) return reply(`${B(command === 'domaininfo' ? 'DOMAIN INFO' : 'DNS')}\nContoh: ${prefix}${command === 'domaininfo' ? 'domaininfo' : 'dns'} google.com${command === 'domaininfo' ? '' : ' MX'}`)
      if (['domaininfo', 'rdap', 'whoisdomain'].includes(command)) {
        const { data: d } = await axios.get(`https://rdap.org/domain/${h}`, { timeout: 20000 })
        const ev = (a) => ((d.events || []).find(e => e.eventAction === a) || {}).eventDate, f = (x) => x ? String(x).slice(0, 10) : '-'
        const reg = ((d.entities || []).find(e => (e.roles || []).includes('registrar')) || {}).vcardArray, rn = reg && (reg[1].find(x => x[0] === 'fn') || [])[3]
        return reply(`${B('DOMAIN INFO')}\n${L}\nDomain    : ${d.ldhName || h}\nRegistrar : ${rn || '-'}\nDibuat    : ${f(ev('registration'))}\nKedaluwarsa: ${f(ev('expiration'))}\nDiperbarui: ${f(ev('last changed'))}\nStatus    : ${(d.status || []).slice(0, 3).join(', ') || '-'}\nNameserver: ${(d.nameservers || []).map(n => (n.ldhName || '').toLowerCase()).slice(0, 4).join(', ') || '-'}`)
      }
      const ty = String(args[1] || 'A').toUpperCase(); if (!TYPES[ty]) return reply(`Tipe: ${Object.keys(TYPES).join(', ')}`)
      const { data: d } = await axios.get('https://cloudflare-dns.com/dns-query', { timeout: 15000, params: { name: h, type: ty }, headers: { accept: 'application/dns-json' } })
      if (d.Status === 3) return reply(`Domain *${h}* tidak ada (NXDOMAIN).`)
      const ans = (d.Answer || []).filter(a => NAME[a.type])
      if (!ans.length) return reply(`Tidak ada catatan ${ty} untuk *${h}*.`)
      return reply(`${B('DNS ' + ty)} • ${h}\n${L}\n` + ans.slice(0, 15).map(a => `${NAME[a.type].padEnd(5)} ${String(a.data).replace(/^"|"$/g, '').slice(0, 150)}  _(TTL ${a.TTL}s)_`).join('\n'))
    } catch (e) { console.log('[dns]', e.message); return reply(e.response && e.response.status === 404 ? 'Data tidak ditemukan (domain/TLD tidak mendukung RDAP).' : 'Gagal: ' + e.message) }
  },
}
module.exports._t = { cleanHost, valid, isPrivate }
