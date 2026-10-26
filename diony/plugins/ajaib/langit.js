/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .langit — peta langit NYATA untuk kota & waktu mana pun (Matahari, Bulan + fase, 5 planet, 85 bintang, rasi, Bima Sakti)
// .bulan  — fase Bulan, jarak, terbit/terbenam, kapan purnama & bulan baru berikutnya
//   .langit                      -> langit di Jakarta sekarang
//   .langit Makassar 22:00       -> jam 22:00 waktu setempat
//   .langit Tokyo 2026-12-25 21:00
//   .langit -6.2,106.8           -> koordinat lintang,bujur
const A = require('../../lib/astro'), K = require('../../lib/praktis'), D = require('../../lib/daily'), G = require('../../lib/geo')
const { B } = require('../../lib/style'), { esc } = require('../../lib/ajaib')

const FONT = "'DejaVu Sans', Arial, sans-serif"
const tzLabel = (tz) => (tz === 7 ? 'WIB' : tz === 8 ? 'WITA' : tz === 9 ? 'WIT' : `UTC${tz >= 0 ? '+' : ''}${tz}`)
const pad = (n) => String(n).padStart(2, '0')
const local = (d, tz) => new Date(d.getTime() + tz * 3600e3)
const hm = (d, tz) => { if (!d) return '—'; const l = local(d, tz); return `${pad(l.getUTCHours())}:${pad(l.getUTCMinutes())}` }
const dmy = (d, tz) => { const l = local(d, tz); return `${pad(l.getUTCDate())} ${K.BULAN[l.getUTCMonth()].slice(0, 3)} ${l.getUTCFullYear()}` }
const STAR_COLOR = { Betelgeuse: '#ffb27a', Antares: '#ff9a6b', Aldebaran: '#ffc08a', Arcturus: '#ffcf9a', Rigel: '#bcd4ff', Spica: '#b9d0ff', Vega: '#d6e4ff', Sirius: '#e4eeff', Achernar: '#c6d8ff', Hadar: '#c0d4ff', Mimosa: '#c0d4ff', Acrux: '#c6d8ff', Bellatrix: '#c4d8ff' }

// ── parse argumen: kota | lat,lng | tanggal | jam ──
async function parseArgs(args) {
  let key = null, hh = null, mm = null; const rest = []
  for (const a of args) {
    let m
    if ((m = a.match(/^(\d{1,2})[:.](\d{2})$/))) { hh = +m[1]; mm = +m[2]; if (hh > 23 || mm > 59) return { error: 'Jam tidak valid (00:00 - 23:59).' } }
    else if (K.parseTanggal(a) && /[-/.]|^(hariini|besok|kemarin)$/i.test(a)) key = K.parseTanggal(a)
    else rest.push(a)
  }
  let place = null, q = rest.join(' ').trim()
  if (!q) place = G.resolve ? await G.resolve('jakarta') : null
  else if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(q)) { const [la, ln] = q.split(',').map(Number); if (Math.abs(la) > 90 || Math.abs(ln) > 180) return { error: 'Koordinat di luar jangkauan.' }; place = { name: `${la.toFixed(2)}°, ${ln.toFixed(2)}°`, lat: la, lng: ln, tz: Math.round(ln / 15) } }
  else place = await G.resolve(q)
  if (!place) return { error: `Kota "${q}" tidak ditemukan. Coba nama kota lain atau koordinat: -6.2,106.8` }
  let date
  const nowL = G.nowAt(place.tz)
  if (!key && hh === null) date = new Date()
  else {
    const y = key ? +key.slice(0, 4) : nowL.y, mo = key ? +key.slice(5, 7) : nowL.m, d = key ? +key.slice(8, 10) : nowL.d
    if (y < 1800 || y > 2200) return { error: 'Rentang tahun yang didukung: 1800–2200.' }
    date = new Date(Date.UTC(y, mo - 1, d, hh === null ? 20 : hh, mm === null ? 0 : mm) - place.tz * 3600e3)
  }
  return { place, date }
}

// ── hitung seluruh isi langit ──
function sky(date, lat, lng) {
  const s = A.sun(date), sa = A.altaz(s.ra, s.dec, date, lat, lng), mo = A.moonAltAz(date, lat, lng), ph = A.phase(date)
  const planets = A.PLANETS.map(([name, color, mag]) => { const p = A.planet(name, date), h = A.altaz(p.ra, p.dec, date, lat, lng); return { name, color, mag, ...p, ...h } })
  const stars = A.STARS.map(([name, rah, dec, mag]) => ({ name, mag, ...A.altaz(rah * 15, dec, date, lat, lng) }))
  return { sun: { ...s, ...sa }, moon: { ...mo, ...ph }, planets, stars }
}

// ── bentuk fase Bulan (sisi terang menghadap arah +x lokal) ──
function moonShape(r, elong, id) {
  const c = Math.cos(elong * A.RAD), rx = Math.abs(c) * r
  const lit = c >= 0 ? `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 0 0 ${-r} Z` : `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 1 0 ${-r} Z`
  return `<circle r="${r}" fill="#262b38" stroke="#4a5266" stroke-width="1"/><path d="${lit}" fill="url(#${id})"/>`
}

// ── gambar peta langit (SVG -> PNG) ──
function skySvg(S, place, date) {
  const W = 1080, H = 1240, cx = 540, cy = 650, R = 455
  const sunAlt = S.sun.alt, day = sunAlt > 0, tw = sunAlt > -18
  const P = (alt, az) => { const r = R * (90 - alt) / 90, a = az * A.RAD; return [cx - r * Math.sin(a), cy - r * Math.cos(a)] }
  const bgIn = day ? '#4f86c4' : sunAlt > -6 ? '#3a3f78' : tw ? '#10173a' : '#050816', bgOut = day ? '#9cc4ea' : sunAlt > -6 ? '#c9715a' : tw ? '#0b1030' : '#02030a'
  const starVis = day ? 0.18 : sunAlt > -6 ? 0.55 : tw ? 0.85 : 1
  let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<radialGradient id="sky" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${bgIn}"/><stop offset="1" stop-color="${bgOut}"/></radialGradient>
<radialGradient id="mw" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#cfd8ff" stop-opacity="0.9"/><stop offset="1" stop-color="#cfd8ff" stop-opacity="0"/></radialGradient>
<linearGradient id="lit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9e4d0"/><stop offset="1" stop-color="#fffdf2"/></linearGradient>
<radialGradient id="sunG"><stop offset="0" stop-color="#fff7c2"/><stop offset="0.35" stop-color="#ffd54a"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
<filter id="blur" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feGaussianBlur stdDeviation="19"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="1.6"/></filter>
<clipPath id="disc"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="#04050d"/>
<circle cx="${cx}" cy="${cy}" r="${R + 22}" fill="#0c1022" stroke="#2c3560" stroke-width="2"/>
<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#sky)"/>
<g clip-path="url(#disc)">`
  // Bima Sakti: bidang galaksi (b = 0), sisi terang di arah pusat galaksi (l = 0)
  const NGP = { ra: 192.85948 * A.RAD, dec: 27.12825 * A.RAD }, LNCP = 122.93192 * A.RAD
  if (!day) {
    const segs = []; let cur = []
    for (let l = 0; l <= 360; l += 2) {
      const L = l * A.RAD, dec = Math.asin(Math.cos(NGP.dec) * Math.cos(LNCP - L)), ra = (NGP.ra + Math.atan2(Math.sin(LNCP - L), -Math.sin(NGP.dec) * Math.cos(LNCP - L))) * A.DEG
      const h = A.altaz(ra, dec * A.DEG, date, place.lat, place.lng); const [x, y] = P(h.alt, h.az)
      if (h.alt > -12) cur.push([x, y, l]); else { if (cur.length > 1) segs.push(cur); cur = [] }
    }
    if (cur.length > 1) segs.push(cur)
    for (const sg of segs) {
      const bright = (l) => { const d = Math.min(l, 360 - l); return 0.10 + 0.20 * Math.exp(-(d * d) / (2 * 55 * 55)) }
      // satu grup berkabur + opasitas grup (bukan per garis) supaya segmen yang bertumpuk tidak saling menjumlah
      const mix = (t) => { const c = (a, b) => Math.round(a + (b - a) * t).toString(16).padStart(2, '0'); return `#${c(0x5d, 0xdc)}${c(0x6a, 0xe3)}${c(0x9c, 0xfb)}` }
      o += `<g filter="url(#blur)" opacity="${(0.34 * starVis).toFixed(3)}">`
      for (let i = 0; i < sg.length - 1; i++) o += `<line x1="${sg[i][0].toFixed(1)}" y1="${sg[i][1].toFixed(1)}" x2="${sg[i + 1][0].toFixed(1)}" y2="${sg[i + 1][1].toFixed(1)}" stroke="${mix((bright(sg[i][2]) - 0.10) / 0.20)}" stroke-width="54" stroke-linecap="round"/>`
      o += '</g>'
    }
  }
  // cincin ketinggian + garis arah
  for (const a of [30, 60]) o += `<circle cx="${cx}" cy="${cy}" r="${(R * (90 - a) / 90).toFixed(1)}" fill="none" stroke="#ffffff" stroke-opacity="0.13" stroke-dasharray="4 8"/>`
  o += `<line x1="${cx}" y1="${cy - R}" x2="${cx}" y2="${cy + R}" stroke="#fff" stroke-opacity="0.08"/><line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="#fff" stroke-opacity="0.08"/>`
  // garis rasi
  const byName = Object.fromEntries(S.stars.map(s => [s.name, s]))
  for (const [cname, pairs] of Object.entries(A.LINES)) {
    let sx = 0, sy = 0, n = 0, seen = new Set()
    for (const [a, b] of pairs) {
      const A1 = byName[a], B1 = byName[b]; if (!A1 || !B1) continue
      if (A1.alt < -3 && B1.alt < -3) continue
      const [x1, y1] = P(A1.alt, A1.az), [x2, y2] = P(B1.alt, B1.az)
      o += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#8fb4ff" stroke-opacity="${(0.42 * starVis).toFixed(2)}" stroke-width="1.6"/>`
      for (const [nm, s, x, y] of [[a, A1, x1, y1], [b, B1, x2, y2]]) if (!seen.has(nm) && s.alt > 4) { seen.add(nm); sx += x; sy += y; n++ }
    }
    if (n >= 3 && starVis > 0.5) o += `<text x="${(sx / n).toFixed(0)}" y="${(sy / n - 20).toFixed(0)}" fill="#9fc0ff" fill-opacity="0.62" font-family="${FONT}" font-size="15" text-anchor="middle" font-style="italic">${esc(cname)}</text>`
  }
  // bintang
  for (const s of S.stars) {
    if (s.alt < -2) continue
    const [x, y] = P(s.alt, s.az), r = Math.max(1.1, 3.6 - s.mag * 0.95), col = STAR_COLOR[s.name] || '#ffffff', ex = Math.max(0, 1 - Math.max(0, 6 - s.alt) / 6 * 0.5)
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 3).toFixed(1)}" fill="${col}" opacity="${(0.13 * starVis).toFixed(3)}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${col}" opacity="${(starVis * ex).toFixed(2)}"/>`
    if (s.mag < 1.3 && starVis > 0.5) o += `<text x="${(x + r + 5).toFixed(0)}" y="${(y + 4).toFixed(0)}" fill="#dbe6ff" fill-opacity="0.75" font-family="${FONT}" font-size="14">${esc(s.name)}</text>`
  }
  // planet
  for (const p of S.planets) {
    if (p.alt < -1) continue
    const [x, y] = P(p.alt, p.az), r = Math.max(4, 6.2 - p.mag * 0.8)
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 2.6).toFixed(1)}" fill="${p.color}" opacity="${day ? 0.25 : 0.2}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${p.color}" stroke="#fff" stroke-opacity="0.6"/><text x="${(x + r + 7).toFixed(0)}" y="${(y + 5).toFixed(0)}" fill="${p.color}" font-family="${FONT}" font-size="17" font-weight="700">${esc(p.name)}</text>`
  }
  // Matahari
  if (S.sun.alt > -2) { const [x, y] = P(S.sun.alt, S.sun.az); o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="62" fill="url(#sunG)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="#fff4b0"/><text x="${(x + 24).toFixed(0)}" y="${(y + 6).toFixed(0)}" fill="#fff4b0" font-family="${FONT}" font-size="18" font-weight="700">Matahari</text>` }
  // Bulan (sisi terang menghadap Matahari)
  if (S.moon.alt > -2) {
    const [x, y] = P(S.moon.alt, S.moon.az), [sx, sy] = P(S.sun.alt, S.sun.az), ang = Math.atan2(sy - y, sx - x) * A.DEG
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="46" fill="#fff" opacity="${(0.08 + 0.1 * S.moon.illum).toFixed(2)}"/><g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})">${moonShape(17, S.moon.elong, 'lit')}</g><text x="${(x + 26).toFixed(0)}" y="${(y + 6).toFixed(0)}" fill="#fff8d6" font-family="${FONT}" font-size="17" font-weight="700">Bulan</text>`
  }
  o += `</g>`
  // cincin luar + arah mata angin (Timur di KIRI, seperti memandang ke atas)
  o += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#6f7fc4" stroke-width="2.5"/>`
  for (const [t, az] of [['U', 0], ['T', 90], ['S', 180], ['B', 270]]) { const a = az * A.RAD, x = cx - (R + 46) * Math.sin(a), y = cy - (R + 46) * Math.cos(a) + 10; o += `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}" fill="${t === 'U' ? '#ff8a80' : '#c9d3ff'}" font-family="${FONT}" font-size="30" font-weight="700" text-anchor="middle">${t}</text>` }
  for (const a of [30, 60]) o += `<text x="${cx + 6}" y="${(cy - R * (90 - a) / 90 - 4).toFixed(0)}" fill="#fff" fill-opacity="0.35" font-family="${FONT}" font-size="12">${a}°</text>`
  // judul
  const l = local(date, place.tz), dayName = D.DAYS[l.getUTCDay()]
  o += `<text x="${cx}" y="62" fill="#f1e6c0" font-family="${FONT}" font-size="40" font-weight="700" text-anchor="middle" letter-spacing="3">PETA LANGIT</text>
<text x="${cx}" y="102" fill="#aab6e8" font-family="${FONT}" font-size="22" text-anchor="middle">${esc(place.name)} • ${dayName}, ${pad(l.getUTCDate())} ${K.BULAN[l.getUTCMonth()]} ${l.getUTCFullYear()} • ${hm(date, place.tz)} ${tzLabel(place.tz)}</text>
<text x="${cx}" y="${H - 28}" fill="#7f8bb8" font-family="${FONT}" font-size="17" text-anchor="middle">Pandangan ke atas: pusat = tepat di atas kepala • tepi = cakrawala • Timur di kiri • lintang ${place.lat.toFixed(2)}° bujur ${place.lng.toFixed(2)}°</text></svg>`
  return o
}

function describe(S, place, date, prefix) {
  const tz = place.tz, l = local(date, tz)
  const sr = A.riseSet('sun', new Date(date.getTime() - (l.getUTCHours() * 60 + l.getUTCMinutes()) * 60e3), place.lat, place.lng)
  const mr = A.riseSet('moon', new Date(date.getTime() - (l.getUTCHours() * 60 + l.getUTCMinutes()) * 60e3), place.lat, place.lng)
  const sunA = S.sun.alt, state = sunA > 0 ? 'siang hari (bintang tak terlihat; posisi bersifat teoretis)' : sunA > -6 ? 'senja sipil' : sunA > -12 ? 'senja nautika' : sunA > -18 ? 'senja astronomis' : 'malam gelap'
  const lines = [`✦ ${B('PETA LANGIT')}`, `${place.name} • ${D.DAYS[l.getUTCDay()]}, ${dmy(date, tz)} • ${hm(date, tz)} ${tzLabel(tz)}`, `Kondisi: ${state}`, '']
  lines.push(`${B('Matahari')}  terbit ${hm(sr.rise, tz)} • terbenam ${hm(sr.set, tz)}`)
  lines.push(`${B('Bulan')}  ${A.phaseName(S.moon.elong)} (${Math.round(S.moon.illum * 100)}% terang) • ${S.moon.alt > 0 ? `di langit ${A.compass(S.moon.az)}, tinggi ${Math.round(S.moon.alt)}°` : 'di bawah cakrawala'}`)
  lines.push('')
  const pl = S.planets.filter(p => p.alt > 3).sort((a, b) => a.mag - b.mag)
  lines.push(`${B('Planet di atas cakrawala')}`)
  lines.push(pl.length ? pl.map(p => `◆ ${p.name}: arah ${A.compass(p.az)}, tinggi ${Math.round(p.alt)}°${sunA > -6 ? ' (tak terlihat, terlalu terang)' : ''}`).join('\n') : '◇ tidak ada (semua di bawah cakrawala)')
  const rasi = Object.entries(A.LINES).filter(([, pairs]) => { const names = new Set(pairs.flat()); const up = S.stars.filter(s => names.has(s.name) && s.alt > 8).length; return up >= names.size - 1 }).map(([n]) => A.CONSTELLATION_NAMES[n] || n)
  if (sunA < -6) lines.push('', `${B('Rasi yang tampak utuh')}`, rasi.length ? rasi.join(' • ') : '—')
  const top = S.stars.filter(s => s.alt > 10).sort((a, b) => a.mag - b.mag).slice(0, 5)
  if (sunA < -6 && top.length) lines.push('', `${B('Bintang paling terang di langit')}`, top.map(s => `${s.name} (${A.compass(s.az)}, ${Math.round(s.alt)}°)`).join(' • '))
  lines.push('', `_Hitungan nyata dari posisi astronomi, bukan gambar acak. Coba: ${prefix}langit Tokyo 21:00 • ${prefix}langit Makassar 2026-12-25 20:00_`)
  return lines.join('\n')
}

function moonSvg(elong, W = 900) {
  const r = 330, cx = W / 2, cy = W / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><defs><radialGradient id="bg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#101735"/><stop offset="1" stop-color="#02030a"/></radialGradient><radialGradient id="halo"><stop offset="0" stop-color="#fff7d6" stop-opacity="0.35"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient><radialGradient id="lit" cx="40%" cy="38%" r="75%"><stop offset="0" stop-color="#fffdf0"/><stop offset="0.6" stop-color="#e8e2c8"/><stop offset="1" stop-color="#c9c2a4"/></radialGradient></defs><rect width="${W}" height="${W}" fill="url(#bg)"/><circle cx="${cx}" cy="${cy}" r="${r * 1.5}" fill="url(#halo)"/><g transform="translate(${cx} ${cy}) rotate(${elong < 180 ? 0 : 180})">${moonShape(r, elong < 180 ? elong : 360 - elong, 'lit')}</g></svg>`
}

module.exports = {
  name: 'langit', alias: ['petalangit', 'sky', 'bulan', 'fasebulan', 'moon'], category: 'ajaib', noLimit: true, cmds: ['langit', 'bulan'],
  desc: 'Peta langit nyata (planet, bulan, bintang, rasi, Bima Sakti) + fase bulan untuk kota & waktu mana pun',
  run: async ({ sock, m, args, command, prefix, reply }) => {
    const sharp = require('../../lib/sharp.js')
    const parsed = await parseArgs(args)
    if (parsed.error) return reply(`✕ ${parsed.error}\n\nContoh:\n${prefix}langit\n${prefix}langit Makassar 22:00\n${prefix}langit Tokyo 2026-12-25 21:00\n${prefix}langit -6.2,106.8`)
    const { place, date } = parsed
    try {
      if (command === 'bulan' || command === 'fasebulan' || command === 'moon') {
        const ph = A.phase(date), mo = A.moon(date), tz = place.tz
        const nb = A.nextPhase(date, 0), np = A.nextPhase(date, 180), nk = A.nextPhase(date, 90), nl = A.nextPhase(date, 270)
        const l = local(date, tz), start = new Date(date.getTime() - (l.getUTCHours() * 60 + l.getUTCMinutes()) * 60e3), mr = A.riseSet('moon', start, place.lat, place.lng)
        const age = (A.norm(ph.elong) / 360) * 29.530588
        const png = await sharp(Buffer.from(moonSvg(ph.elong))).png().toBuffer()
        const cap = [`✦ ${B('FASE BULAN')}`, `${place.name} • ${dmy(date, tz)} ${hm(date, tz)} ${tzLabel(tz)}`, '', `${B(A.phaseName(ph.elong))} • ${Math.round(ph.illum * 100)}% terang • ${ph.waxing ? 'menuju purnama' : 'menuju bulan baru'}`, `Umur bulan: ${age.toFixed(1)} hari`, `Jarak ke Bumi: ${Math.round(mo.dist).toLocaleString('id-ID')} km`, `Bulan terbit ${hm(mr.rise, tz)} • terbenam ${hm(mr.set, tz)}`, '', `${B('Berikutnya')}`, `◇ Bulan Baru   : ${dmy(nb, tz)} ${hm(nb, tz)}`, `◇ Kuartal Awal : ${dmy(nk, tz)} ${hm(nk, tz)}`, `◇ Purnama      : ${dmy(np, tz)} ${hm(np, tz)}`, `◇ Kuartal Akhir: ${dmy(nl, tz)} ${hm(nl, tz)}`, '', `_Gambar: sisi terang di kanan = menuju purnama (pandangan belahan utara). Peta langit: ${prefix}langit_`].join('\n')
        return sock.sendMessage(m.chat, { image: png, caption: cap }, { quoted: m })
      }
      const S = sky(date, place.lat, place.lng)
      const png = await sharp(Buffer.from(skySvg(S, place, date))).png().toBuffer()
      return sock.sendMessage(m.chat, { image: png, caption: describe(S, place, date, prefix) }, { quoted: m })
    } catch (e) { console.log('[langit]', e); return reply(`✕ Gagal membuat peta langit.\n_${e.message}_`) }
  },
}
