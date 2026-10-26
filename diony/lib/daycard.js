/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KARTU KALENDER (canvas SVG -> PNG lewat sharp)
const sharp = require('./sharp.js')
const AN = require('./ancientsvg'), ST = require('./style')
const D = require('./daily')
const FONT = "Poppins, 'DejaVu Sans', Arial, sans-serif"
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cut = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s }

function stars(seed) { let x = seed, o = ''; const r = () => (x = (x * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 40; i++) o += `<circle cx="${(r() * 1000) | 0}" cy="${(r() * 660) | 0}" r="${(r() * 1.6 + 0.4).toFixed(1)}" fill="#fff" opacity="${(r() * 0.4 + 0.08).toFixed(2)}"/>`; return o }

// opt: { y, m, today:{y,m,d}, botname }
async function calendarCard({ y, m, today, botname = 'Chisa AI' }) {
  botname = ST.plain(botname) || 'CHISA AI'
  const AC = '#38bdf8', RED = '#f87171', ORG = '#fb923c', first = D.dowOf(y, m, 1), dim = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const isCur = today.y === y && today.m === m, hol = {}
  D.HOLIDAYS.forEach(h => { if (h.d.slice(0, 7) === `${y}-${D.pad(m)}`) hol[+h.d.slice(8)] = h })
  const hFirst = D.hijri({ y, m, d: 1 }), hLast = D.hijri({ y, m, d: dim })
  const hRange = hFirst.name === hLast.name ? `${hFirst.name} ${hFirst.y} H` : `${hFirst.name} – ${hLast.name} ${hLast.y === hFirst.y ? hLast.y : hFirst.y + '/' + hLast.y} H`
  let work = 0; for (let d = 1; d <= dim; d++) if (D.isWorkday({ y, m, d, dow: D.dowOf(y, m, d) })) work++
  const holCount = Object.values(hol).filter(h => h.t === 'libur').length

  // sel kalender
  const CW = 84, CH = 60, GX = 372, GY = 150, DN = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']
  let cells = DN.map((n, i) => `<text x="${GX + i * CW + CW / 2}" y="${GY - 14}" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="800" fill="${i === 0 ? RED : i === 6 ? '#fda4af' : '#8fa0cf'}" letter-spacing="1">${n}</text>`).join('')
  for (let d = 1; d <= dim; d++) {
    const idx = first + d - 1, col = idx % 7, row = Math.floor(idx / 7), x = GX + col * CW, yy = GY + row * CH, h = hol[d]
    const isToday = isCur && today.d === d, red = col === 0 || (h && h.t === 'libur'), col2 = h ? (h.t === 'libur' ? RED : ORG) : col === 0 ? RED : col === 6 ? '#fda4af' : '#e5e9ff'
    const hj = D.hijri({ y, m, d })
    cells += `<g>
      <rect x="${x + 3}" y="${yy + 3}" width="${CW - 6}" height="${CH - 6}" rx="14" fill="${isToday ? AC : '#ffffff0b'}" ${isToday ? '' : `stroke="${h ? col2 : '#ffffff14'}" stroke-opacity="${h ? 0.7 : 1}"`}/>
      <text x="${x + CW / 2}" y="${yy + 33}" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="800" fill="${isToday ? '#06202e' : col2}">${d}</text>
      <text x="${x + CW - 11}" y="${yy + CH - 11}" text-anchor="end" font-family="${FONT}" font-size="10" font-weight="600" fill="${isToday ? '#06202e' : '#7f8db8'}">${hj.d}</text>
      ${h ? `<circle cx="${x + 14}" cy="${yy + CH - 15}" r="4" fill="${isToday ? '#06202e' : col2}"/>` : ''}
    </g>`
  }
  // daftar libur bulan ini
  const hents = Object.entries(hol), per = Math.ceil(hents.length / 2) || 1
  const hl = hents.slice(0, 12).map(([d, h], i) => { const col = Math.floor(i / per), row = i % per
    return `<g transform="translate(${GX + col * 300},${GY + 6 * CH + 42 + row * 21})"><circle cx="5" cy="-4" r="4.5" fill="${h.t === 'libur' ? RED : ORG}"/><text x="18" y="0" font-family="${FONT}" font-size="13" font-weight="600" fill="#dfe5ff"><tspan font-weight="800">${d}</tspan>  ${esc(cut(h.n.replace(/\s*\(.*\)$/, ''), col ? 36 : 32))}</text></g>` }).join('')

  // panel kiri
  let left
  if (isCur) {
    const w = D.weton(today), nx = D.nextHolidays(today, 1)[0], hj = D.hijri(today), dow = D.DAYS[D.dowOf(today.y, today.m, today.d)]
    left = `<text x="40" y="128" font-family="${FONT}" font-size="22" font-weight="700" fill="${AC}" letter-spacing="3">${dow.toUpperCase()}</text>
      <text x="40" y="250" font-family="${AN.SERIF}" font-size="140" font-weight="700" fill="url(#agold)">${today.d}</text>
      <text x="40" y="292" font-family="${FONT}" font-size="26" font-weight="700" fill="#e5e9ff">${D.MONTHS[m - 1]} ${y}</text>
      <text x="40" y="326" font-family="${FONT}" font-size="17" font-weight="600" fill="#8fa0cf">${esc(hj.text)}</text>
      <text x="40" y="354" font-family="${FONT}" font-size="17" font-weight="600" fill="#8fa0cf">${dow} ${D.pasaranOf(today)} • neptu ${w.neptu}</text>
      <rect x="40" y="380" width="296" height="104" rx="18" fill="#ffffff0d" stroke="${AC}55"/>
      <text x="58" y="408" font-family="${FONT}" font-size="12" font-weight="800" fill="${AC}" letter-spacing="2">HARI LIBUR BERIKUTNYA</text>
      ${nx ? `<text x="58" y="436" font-family="${FONT}" font-size="15" font-weight="700" fill="#fff">${esc(cut(nx.n, 34))}</text><text x="58" y="464" font-family="${FONT}" font-size="15" font-weight="600" fill="#c7cff0">${nx.d} ${D.MONTHS[nx.m - 1]} • ${nx.in === 0 ? 'HARI INI' : nx.in + ' hari lagi'}</text>` : `<text x="58" y="440" font-family="${FONT}" font-size="15" fill="#c7cff0">Data libur belum tersedia</text>`}`
  } else {
    left = `<text x="40" y="128" font-family="${FONT}" font-size="22" font-weight="700" fill="${AC}" letter-spacing="3">KALENDER</text>
      <text x="40" y="236" font-family="${FONT}" font-size="64" font-weight="800" fill="#fff">${D.MONTHS[m - 1]}</text>
      <text x="40" y="292" font-family="${FONT}" font-size="46" font-weight="800" fill="${AC}">${y}</text>
      <text x="40" y="332" font-family="${FONT}" font-size="17" font-weight="600" fill="#8fa0cf">${esc(hRange)}</text>
      <rect x="40" y="368" width="296" height="116" rx="18" fill="#ffffff0d" stroke="${AC}55"/>
      <text x="58" y="398" font-family="${FONT}" font-size="12" font-weight="800" fill="${AC}" letter-spacing="2">RINGKASAN BULAN</text>
      <text x="58" y="430" font-family="${FONT}" font-size="16" font-weight="700" fill="#fff">${dim} hari • ${work} hari kerja</text>
      <text x="58" y="458" font-family="${FONT}" font-size="16" font-weight="700" fill="#fff">${holCount} libur nasional</text>`
  }
  const prog = isCur ? D.dayOfYear(today) / (D.isLeap(y) ? 366 : 365) : 0
  const info = isCur ? `<text x="40" y="520" font-family="${FONT}" font-size="12" font-weight="800" fill="#8fa0cf" letter-spacing="2">PROGRES TAHUN ${y}</text><rect x="40" y="530" width="296" height="10" rx="5" fill="#0b0f1f" stroke="#ffffff22"/><rect x="40" y="530" width="${Math.max(10, 296 * prog)}" height="10" rx="5" fill="${AC}"/><text x="40" y="566" font-family="${FONT}" font-size="14" font-weight="600" fill="#c7cff0">Hari ke-${D.dayOfYear(today)} • Minggu ke-${D.isoWeek(today)} • ${(prog * 100).toFixed(0)}%</text>` : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="680" viewBox="0 0 1000 680">
  <defs>${AN.defs(AC)}</defs>
  ${AN.frame(1000, 680, AC, 28)}
  ${AN.brand(64, 70, botname, 24, 'KALENDER &amp; PENANGGALAN • CHRONA')}
  <text x="944" y="66" text-anchor="end" font-family="${AN.SERIF}" font-size="30" font-weight="700" fill="url(#agold)">${D.MONTHS[m - 1].toUpperCase()} ${y}</text>
  <text x="944" y="90" text-anchor="end" font-family="${AN.SANS}" font-size="14" font-weight="600" fill="${AN.C.stone}">${esc(hRange)}</text>
  ${left}${info}${cells}${hl}
  <g transform="translate(${GX},${GY + 6 * CH + 6})" font-family="${FONT}" font-size="11" font-weight="600" fill="#8fa0cf"><circle cx="6" cy="-3" r="4" fill="${RED}"/><text x="16" y="0">Libur nasional</text><circle cx="116" cy="-3" r="4" fill="${ORG}"/><text x="126" y="0">Cuti bersama</text><text x="236" y="0">Angka kecil = tanggal Hijriah (perkiraan)</text></g>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
module.exports = { calendarCard }
