/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// WEB TOOLS — ssweb, perpendek link, GitHub, npm, info negara (semua gratis tanpa API key)
//   .ssweb <url> [hp|layar]  tangkapan layar situs (bawaan halaman penuh)        .shortlink <url>   perpendek link (is.gd)
//   .github <user|user/repo>   profil / info repo        .npm <paket>       info paket npm
//   .negara <nama>          bendera, ibu kota, populasi, mata uang, dll
const axios = require('axios'), { B } = require('../../lib/style')
const UA = { 'User-Agent': 'ChisaBot/3.9 (WhatsApp bot)', Accept: 'application/json' }
const get = (url, params) => axios.get(url, { params, headers: UA, timeout: 15000 }).then(r => r.data)
const CMDS = ['ssweb', 'shortlink', 'github', 'npm', 'negara']
const ALIAS = { screenshot: 'ssweb', ss: 'ssweb', pendekkan: 'shortlink', short: 'shortlink', gh: 'github', npmjs: 'npm', country: 'negara' }
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const num = (n) => Number(n || 0).toLocaleString('id-ID')
const okUrl = (u) => { try { const x = new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u); if (!/^https?:$/.test(x.protocol) || !x.hostname.includes('.')) return null
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/i.test(x.hostname) || /\.(local|internal)$/i.test(x.hostname)) return null; return x.href } catch { return null } }

module.exports = {
  name: 'webtools', alias: Object.keys(ALIAS).concat(CMDS), category: 'tools', cmds: CMDS, noLimit: false,
  desc: 'Alat web: ssweb, shortlink, github, npm, negara',
  run: async ({ sock, m, text, command, prefix, reply }) => {
    const cmd = ALIAS[command] || command, q = String(text || '').trim()
    try {
      if (cmd === 'ssweb') {
        const [u0, mode] = q.split(/\s+/), url = okUrl(u0 || ''); if (!url) return reply(`${B('SSWEB')}\nContoh: ${prefix}ssweb nasa.gov\n${prefix}ssweb nasa.gov hp      (tampilan ponsel)\n${prefix}ssweb nasa.gov layar   (hanya layar pertama, tanpa scroll)`)
        sock.sendMessage(m.chat, { react: { text: '📸', key: m.key } }).catch(() => {})
        // bawaan: halaman penuh lebar 2400 px (seperti Furina); hp = lebar ponsel; layar = layar pertama saja
        const w = /^(hp|mobile|phone)$/i.test(mode || '') ? 'fullpage/width/412/crop/2400' : /^(layar|screen|view)$/i.test(mode || '') ? 'width/1280/crop/800' : 'fullpage/viewportWidth/2400'
        const r = await axios.get(`https://image.thum.io/get/png/${w}/noanimate/${url}`, { responseType: 'arraybuffer', timeout: 60000, validateStatus: () => true })
        const type = String(r.headers['content-type'] || '')
        if (r.status !== 200 || !/^image\//.test(type) || !r.data || !r.data.byteLength) throw new Error('screenshot gagal; pastikan situs bisa diakses')
        await sock.sendMessage(m.chat, { image: Buffer.from(r.data), caption: `${B('SSWEB')}\n${url}` }, { quoted: m })
        return sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
      }
      if (cmd === 'shortlink') {
        const url = okUrl(q || (m.quoted && (m.quoted.text || '')).trim()); if (!url) return reply(`${B('SHORTLINK')}\nContoh: ${prefix}shortlink https://situs-panjang.com/artikel/abc`)
        const { data } = await axios.get('https://is.gd/create.php', { params: { format: 'json', url }, timeout: 15000 })
        if (!data.shorturl) throw new Error(data.errormessage || 'gagal memperpendek')
        return reply(`${B('LINK PENDEK')}\n${data.shorturl}`)
      }
      if (cmd === 'github') {
        if (!q) return reply(`${B('GITHUB')}\nContoh: ${prefix}github torvalds\n${prefix}github torvalds/linux`)
        if (q.includes('/')) {
          const [o, r] = q.split('/'), d = await get(`https://api.github.com/repos/${encodeURIComponent(o)}/${encodeURIComponent(r)}`).catch(e => { if (e.response && e.response.status === 404) return null; throw e })
          if (!d) return reply(`Repo "${q}" tidak ditemukan.`)
          return reply([B(d.full_name), LINE, d.description || '_tanpa deskripsi_', '', `⭐ ${num(d.stargazers_count)}  🍴 ${num(d.forks_count)}  👁 ${num(d.watchers_count)}  🐞 ${num(d.open_issues_count)} issue`,
            `Bahasa  : ${d.language || '-'}`, `Lisensi : ${(d.license && d.license.spdx_id) || '-'}`, `Dibuat  : ${String(d.created_at).slice(0, 10)}`, `Update  : ${String(d.pushed_at).slice(0, 10)}`, d.html_url].join('\n'))
        }
        const d = await get(`https://api.github.com/users/${encodeURIComponent(q)}`).catch(e => { if (e.response && e.response.status === 404) return null; throw e })
        if (!d) return reply(`Pengguna "${q}" tidak ditemukan.`)
        const cap = [B(d.login + (d.name ? ' — ' + d.name : '')), LINE, d.bio || '', `Repo   : ${num(d.public_repos)}   Gist: ${num(d.public_gists)}`, `Follower: ${num(d.followers)}   Following: ${num(d.following)}`, d.company ? `Kantor : ${d.company}` : '', d.location ? `Lokasi : ${d.location}` : '', `Gabung : ${String(d.created_at).slice(0, 10)}`, d.html_url].filter(Boolean).join('\n')
        return sock.sendMessage(m.chat, { image: { url: d.avatar_url }, caption: cap }, { quoted: m }).catch(() => reply(cap))
      }
      if (cmd === 'npm') {
        const name = q.split(/\s+/)[0]; if (!name) return reply(`${B('NPM')}\nContoh: ${prefix}npm axios`)
        const d = await get(`https://registry.npmjs.org/${encodeURIComponent(name).replace('%40', '@')}`).catch(e => { if (e.response && e.response.status === 404) return null; throw e })
        if (!d || !d['dist-tags']) return reply(`Paket "${name}" tidak ditemukan.`)
        const v = d['dist-tags'].latest, info = d.versions[v] || {}
        let dl = ''; try { const w = await get(`https://api.npmjs.org/downloads/point/last-week/${name}`); dl = `Unduhan/minggu : ${num(w.downloads)}` } catch {}
        return reply([B(d.name), LINE, d.description || '', `Versi terbaru   : ${v}`, `Lisensi         : ${info.license || d.license || '-'}`, dl, `Rilis terakhir  : ${String((d.time || {})[v] || '').slice(0, 10) || '-'}`, `Instal          : npm i ${d.name}`, `https://www.npmjs.com/package/${d.name}`].filter(Boolean).join('\n'))
      }
      // negara
      if (!q) return reply(`${B('NEGARA')}\nContoh: ${prefix}negara jepang\n${prefix}negara brazil`)
      const ID = { jepang: 'japan', jerman: 'germany', inggris: 'united kingdom', prancis: 'france', perancis: 'france', spanyol: 'spain', italia: 'italy', belanda: 'netherlands', tiongkok: 'china', cina: 'china', korea: 'south korea', 'korea selatan': 'south korea', 'korea utara': 'north korea', arab: 'saudi arabia', 'arab saudi': 'saudi arabia', rusia: 'russia', meksiko: 'mexico', swiss: 'switzerland', swedia: 'sweden', norwegia: 'norway', yunani: 'greece', mesir: 'egypt', turki: 'turkey', filipina: 'philippines', kamboja: 'cambodia', brunei: 'brunei', singapura: 'singapore', selandia: 'new zealand', 'selandia baru': 'new zealand', amerika: 'united states', 'amerika serikat': 'united states', kanada: 'canada', australia: 'australia', india: 'india', malaysia: 'malaysia', thailand: 'thailand', vietnam: 'vietnam', indonesia: 'indonesia' }
      const key = ID[q.toLowerCase()] || q
      const arr = await get(`https://restcountries.com/v3.1/name/${encodeURIComponent(key)}`).catch(e => { if (e.response && e.response.status === 404) return null; throw e })
      const c = arr && arr[0]; if (!c) return reply(`Negara "${q}" tidak ditemukan.`)
      const cur = Object.values(c.currencies || {}).map(x => `${x.name} (${x.symbol || ''})`).join(', ') || '-', lang = Object.values(c.languages || {}).join(', ') || '-'
      return reply([`${c.flag || ''} ${B(c.name.common.toUpperCase())}`, LINE, `Nama resmi : ${c.name.official}`, `Ibu kota   : ${(c.capital || []).join(', ') || '-'}`, `Benua      : ${(c.continents || []).join(', ')} • ${c.subregion || ''}`,
        `Populasi   : ${num(c.population)}`, `Luas       : ${num(c.area)} km²`, `Bahasa     : ${lang}`, `Mata uang  : ${cur}`, `Kode telp  : ${(c.idd && c.idd.root || '') + ((c.idd && c.idd.suffixes || [])[0] || '')}`, `Zona waktu : ${(c.timezones || []).slice(0, 3).join(', ')}`,
        c.maps && c.maps.googleMaps ? c.maps.googleMaps : ''].filter(Boolean).join('\n'))
    } catch (e) { console.log('[webtools]', cmd, e.message); return reply('Gagal: ' + (e.response && e.response.status === 403 ? 'batas permintaan API tercapai, coba lagi nanti' : e.message)) }
  },
}
