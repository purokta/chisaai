/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat developer ringan: urlenc/urldec, hexenc/hexdec, jwt, epoch, regex, jsonfmt, slug, bytes, htmlenc/htmldec, csvjson, cron
const ST = require('../../lib/style'), K = require('../../lib/praktis')
const src = (text, m) => (text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
const b64u = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
const human = (n) => { const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; let i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ } return `${n.toFixed(i ? 2 : 0)} ${u[i]}` }
const wib = (d) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'medium' }).format(d) + ' WIB'
const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const CRON = ['menit (0-59)', 'jam (0-23)', 'tanggal (1-31)', 'bulan (1-12)', 'hari (0-6, 0=Minggu)']

function cron(expr) {
  const f = expr.trim().split(/\s+/)
  if (f.length !== 5) return null
  const HR = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const part = (v, i) => v === '*' ? 'setiap ' + CRON[i].split(' ')[0] : /^\*\/\d+$/.test(v) ? `setiap ${v.slice(2)} ${CRON[i].split(' ')[0]}` : i === 4 ? v.split(',').map(x => HR[+x % 7] || x).join(', ') : v
  return f.map((v, i) => `• ${CRON[i].split(' ')[0]}: ${part(v, i)}`).join('\n')
}

module.exports = {
  name: 'devtools', alias: ['urlenc', 'urldec', 'hexenc', 'hexdec', 'jwt', 'epoch', 'timestamp', 'regex', 'jsonfmt', 'json', 'slug', 'bytes', 'htmlenc', 'htmldec', 'csvjson', 'cron'],
  category: 'tools', cmds: ['urlenc', 'urldec', 'hexenc', 'hexdec', 'jwt', 'epoch', 'regex', 'jsonfmt', 'slug', 'bytes', 'htmlenc', 'htmldec', 'csvjson', 'cron'],
  desc: 'Alat developer: urlenc, urldec, hexenc, hexdec, jwt, epoch, regex, jsonfmt, slug, bytes, htmlenc, csvjson, cron',
  run: async ({ m, text, command, prefix, reply }) => {
    const t = src(text, m), need = (ex) => reply(`Teksnya kosong.\nContoh: ${prefix}${command} ${ex}`)
    try {
      switch (command) {
        case 'urlenc': return t ? reply(encodeURIComponent(t)) : need('halo dunia & kawan')
        case 'urldec': return t ? reply(decodeURIComponent(t)) : need('halo%20dunia')
        case 'hexenc': return t ? reply(Buffer.from(t).toString('hex')) : need('Chisa AI')
        case 'hexdec': return t ? reply(Buffer.from(t.replace(/\s|0x/g, ''), 'hex').toString('utf8')) : need('44696f6e79737573')
        case 'htmlenc': return t ? reply(t.replace(/[&<>"']/g, c => ENT[c])) : need('<b>hai</b>')
        case 'htmldec': return t ? reply(t.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[e]))) : need('&lt;b&gt;')
        case 'slug': return t ? reply(t.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) : need('Judul Artikel Saya!')
        case 'bytes': { const n = parseFloat(t.replace(',', '.')); return Number.isFinite(n) && n >= 0 ? reply(`${n} byte = *${human(n)}*`) : need('1500000') }
        case 'epoch': case 'timestamp': {
          if (!t) { const n = Date.now(); return reply(`${ST.B('EPOCH')}\nDetik   : ${Math.floor(n / 1000)}\nMilidetik: ${n}\n${wib(new Date(n))}`) }
          if (/^\d{9,13}$/.test(t)) { const n = t.length > 11 ? +t : +t * 1000; return reply(`${ST.B('EPOCH')}\n${t} =\n${wib(new Date(n))}\nUTC: ${new Date(n).toISOString()}`) }
          const key = K.parseTanggal(t); const d = key ? new Date(key + 'T00:00:00+07:00') : new Date(t)
          return Number.isNaN(+d) ? need('1700000000  atau  2026-10-07') : reply(`${ST.B('EPOCH')}\n${wib(d)}\nDetik: ${Math.floor(+d / 1000)}\nMilidetik: ${+d}`)
        }
        case 'jwt': {
          const p = t.split('.'); if (p.length < 2) return need('eyJhbGciOi...')
          const h = JSON.parse(b64u(p[0])), pl = JSON.parse(b64u(p[1]))
          const exp = pl.exp ? `\nKedaluwarsa: ${wib(new Date(pl.exp * 1000))} ${pl.exp * 1000 < Date.now() ? '(SUDAH LEWAT)' : '(masih berlaku)'}` : ''
          return reply(`${ST.B('JWT')} (tanpa verifikasi tanda tangan)\n*Header*\n${JSON.stringify(h, null, 2)}\n*Payload*\n${JSON.stringify(pl, null, 2)}${exp}`)
        }
        case 'jsonfmt': case 'json': { if (!t) return need('{"a":1,"b":[1,2]}'); const o = JSON.parse(t); return reply('```\n' + JSON.stringify(o, null, 2) + '\n```') }
        case 'regex': {
          const mm = t.match(/^\/((?:\\.|[^/])+)\/([gimsuy]*)\s+([\s\S]+)$/)
          if (!mm) return need('/\\d+/g tanggal 12 dan 34')
          const flags = mm[2].includes('g') ? mm[2] : mm[2] + 'g', re = new RegExp(mm[1], flags), all = [...mm[3].matchAll(re)].slice(0, 20)
          if (!all.length) return reply('Tidak ada yang cocok.')
          return reply(`${ST.B('REGEX')} /${mm[1]}/${mm[2]}\n${all.length} kecocokan:\n` + all.map((x, i) => `${i + 1}. "${x[0]}" @${x.index}${x.length > 1 ? ' grup: ' + x.slice(1).map(g => `"${g}"`).join(', ') : ''}`).join('\n'))
        }
        case 'csvjson': {
          const lines = t.split(/\r?\n/).filter(Boolean); if (lines.length < 2) return need('nama,umur [Enter] Ani,20 [Enter] Budi,22')
          const sep = lines[0].includes(';') ? ';' : ',', head = lines[0].split(sep).map(s => s.trim())
          return reply('```\n' + JSON.stringify(lines.slice(1).map(l => Object.fromEntries(l.split(sep).map((v, i) => [head[i] || 'kol' + (i + 1), isNaN(v) || v.trim() === '' ? v.trim() : +v]))), null, 2) + '\n```')
        }
        case 'cron': { const r = t && cron(t); return r ? reply(`${ST.B('CRON')} ${t}\n${r}`) : need('*/15 9-17 * * 1-5') }
      }
    } catch (e) { return reply(`✕ Gagal: ${e.message}`) }
  },
}
