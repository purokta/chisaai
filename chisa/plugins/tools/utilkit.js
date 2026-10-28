/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Utility Toolkit (v4.17): urlparse, ua, jarak, koordinat, estunduh, rasio, pecahan, wibwita, progres, akar.
// Semua berjalan lokal, tanpa API eksternal dan tanpa dependensi baru.
const { B } = require('../../lib/style')
const D = require('../../lib/daily')

const CMDS = ['urlparse', 'ua', 'jarak', 'koordinat', 'estunduh', 'rasio', 'pecahan', 'wibwita', 'progres', 'akar']
const src = (text, m) => String(text || (m && m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
const num = (n, d = 2) => (Number.isInteger(n) ? String(n) : n.toFixed(d).replace(/\.?0+$/, '')).replace('.', ',')
const pad = (n) => String(n).padStart(2, '0')
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a }
const parseNum = (s) => { const x = Number(String(s).trim().replace(',', '.')); return Number.isFinite(x) ? x : NaN }

// ───────────── urlparse ─────────────
const TRACK = /^(utm_[a-z]+|fbclid|gclid|dclid|msclkid|igshid|mc_eid|mc_cid|yclid|_ga|ref_src|si)$/i
function doUrl(raw) {
  let s = String(raw || '').trim().split(/\s+/)[0]; if (!s) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s
  let u; try { u = new URL(s) } catch { return null }
  if (!u.hostname) return null
  const rows = [['Protokol', u.protocol.replace(':', '')], ['Host', u.hostname], ['Port', u.port || '(bawaan)'], ['Path', decodeSafe(u.pathname)]]
  if (u.hash) rows.push(['Fragmen', decodeSafe(u.hash.slice(1))])
  const params = [...u.searchParams.entries()], out = [`${B('URL PARSER')}`, ...rows.map(([k, v]) => `${k.padEnd(9)}: ${v}`)]
  if (params.length) out.push('', `${B('Parameter')} (${params.length})`, ...params.slice(0, 25).map(([k, v]) => `• ${k} = ${v.length > 80 ? v.slice(0, 80) + '…' : v}`), ...(params.length > 25 ? [`_…${params.length - 25} parameter lagi_`] : []))
  const warn = []
  if (u.username || u.password) warn.push('Ada nama pengguna/kata sandi di dalam URL — jangan dibagikan.')
  if (/(^|\.)xn--/i.test(u.hostname)) warn.push('Domain memakai punycode (xn--): bisa jadi penyamaran huruf mirip. Periksa baik-baik.')
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) warn.push('Host berupa alamat IP, bukan nama domain.')
  if (u.protocol === 'http:') warn.push('Tanpa enkripsi (http).')
  const clean = new URL(u.href); let removed = 0
  for (const k of [...clean.searchParams.keys()]) if (TRACK.test(k)) { clean.searchParams.delete(k); removed++ }
  if (removed) out.push('', `${B('Tanpa pelacak')} (${removed} parameter dibuang)`, clean.href)
  if (warn.length) out.push('', ...warn.map(w => '⚠ ' + w))
  return out.join('\n')
}
function decodeSafe(x) { try { return decodeURIComponent(x) } catch { return x } }

// ───────────── ua (User-Agent) ─────────────
const WINNT = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP' }
function parseUA(ua) {
  const s = String(ua || '').trim(); if (s.length < 8) return null
  const m = (re) => { const r = s.match(re); return r ? r : null }
  let browser = null, v
  if ((v = m(/\bEdgA?\/([\d.]+)/) || m(/\bEdgiOS\/([\d.]+)/))) browser = ['Microsoft Edge', v[1]]
  else if ((v = m(/\b(?:OPR|OPiOS)\/([\d.]+)/))) browser = ['Opera', v[1]]
  else if ((v = m(/\bSamsungBrowser\/([\d.]+)/))) browser = ['Samsung Internet', v[1]]
  else if ((v = m(/\b(?:Firefox|FxiOS)\/([\d.]+)/))) browser = ['Firefox', v[1]]
  else if ((v = m(/\b(?:Chrome|CriOS)\/([\d.]+)/))) browser = ['Chrome / Chromium', v[1]]
  else if ((v = m(/\bVersion\/([\d.]+).*Safari\//))) browser = ['Safari', v[1]]
  else if ((v = m(/\bMSIE ([\d.]+)/) || m(/\brv:([\d.]+)\) like Gecko/))) browser = ['Internet Explorer', v[1]]
  let os = null
  if ((v = m(/Windows NT ([\d.]+)/))) os = 'Windows ' + (WINNT[v[1]] || v[1])
  else if ((v = m(/Android ([\d.]+)/))) os = 'Android ' + v[1]
  else if ((v = m(/(?:iPhone|CPU) OS ([\d_]+)/))) os = 'iOS ' + v[1].replace(/_/g, '.')
  else if ((v = m(/Mac OS X ([\d_.]+)/))) os = 'macOS ' + v[1].replace(/_/g, '.')
  else if (/CrOS/.test(s)) os = 'ChromeOS'
  else if (/Linux/.test(s)) os = 'Linux'
  const bot = /bot|crawl|spider|slurp|curl\/|wget\/|python-requests|okhttp|axios|node-fetch|headless/i.test(s)
  const tablet = /iPad|Tablet|(?:Android(?!.*Mobile))/i.test(s), mobile = /Mobi|iPhone|Android.*Mobile/i.test(s)
  const device = bot ? 'Bot / alat otomatis' : tablet ? 'Tablet' : mobile ? 'Ponsel' : 'Komputer'
  const model = (m(/Android [\d.]+;\s*([^;)]+?)(?:\s+Build|\)|;)/) || [])[1]
  const engine = /Trident/.test(s) ? 'Trident' : /Firefox|FxiOS/.test(s) && /Gecko/.test(s) ? 'Gecko' : /Chrome|CriOS|Edg|OPR|SamsungBrowser/.test(s) ? 'Blink' : /AppleWebKit/.test(s) ? 'WebKit' : null
  const arch = /\b(x86_64|x64|Win64|amd64)\b/i.test(s) ? '64-bit (x64)' : /arm64|aarch64/i.test(s) ? 'ARM64' : /\bi[3-6]86\b|WOW64/i.test(s) ? '32-bit' : null
  const rows = [['Peramban', browser ? `${browser[0]} ${browser[1]}` : null], ['Mesin', engine], ['Sistem', os], ['Perangkat', device], ['Model', model && model !== 'K' ? model : null], ['Arsitektur', arch]].filter(r => r[1])
  if (!rows.length) return null
  return `${B('USER-AGENT')}\n${rows.map(([k, x]) => `${k.padEnd(10)}: ${x}`).join('\n')}${/Chrome\/\d+/.test(s) && /Android/.test(s) && /\bwv\b/.test(s) ? '\nCatatan   : WebView (peramban di dalam aplikasi)' : ''}`
}

// ───────────── jarak & koordinat ─────────────
const R_BUMI = 6371.0088
const toRad = (x) => x * Math.PI / 180, toDeg = (x) => x * 180 / Math.PI
function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng), h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_BUMI * Math.asin(Math.min(1, Math.sqrt(h)))
}
function bearing(a, b) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat)), x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}
const ARAH = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut']
const arah = (deg) => ARAH[Math.round(deg / 45) % 8]
const validLL = (p) => p && p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180
function place(q) {
  const t = String(q || '').trim(), mm = t.match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/)
  if (mm) { const p = { name: `${num(parseNum(mm[1]), 5)}, ${num(parseNum(mm[2]), 5)}`, lat: parseNum(mm[1]), lng: parseNum(mm[2]) }; return validLL(p) ? p : null }
  const c = D.findCity(t); return c ? { name: c.name, lat: c.lat, lng: c.lng } : null
}
function doJarak(input) {
  const t = String(input || '').trim(); if (!t) return null
  let parts = t.split(/\s+(?:ke|to|-|->|→)\s+|\s*\|\s*/i).map(x => x.trim()).filter(Boolean)
  if (parts.length === 1) { const a = t.split(/\s+/); parts = a.length === 2 ? a : a.length === 4 ? [a[0] + ',' + a[1], a[2] + ',' + a[3]] : parts }
  if (parts.length !== 2) return null
  const A = place(parts[0]), Bp = place(parts[1]); if (!A || !Bp) return { err: `Lokasi tidak dikenali: ${!A ? parts[0] : parts[1]}` }
  const km = haversine(A, Bp), br = bearing(A, Bp)
  const road = km * 1.3, hrs = road / 55, h = Math.floor(hrs), mnt = Math.round((hrs - h) * 60)
  return { text: `${B('JARAK')}\n${A.name}  →  ${Bp.name}\n\nLurus (udara) : *${num(km, km < 10 ? 2 : 1)} km*\nArah          : ${arah(br)} (${Math.round(br)}°)\nJalan darat   : ± ${num(road, 0)} km (perkiraan kasar, ×1,3)\nTempuh mobil  : ± ${h ? h + ' jam ' : ''}${mnt} menit (rata-rata 55 km/jam)\n_Perkiraan saja; rute nyata bergantung jalan, laut, dan lalu lintas._`, km, bearing: br }
}
function dms(v, pos, neg) {
  const a = Math.abs(v), d = Math.floor(a), mn = Math.floor((a - d) * 60), s = ((a - d) * 60 - mn) * 60
  return `${d}°${pad(mn)}'${s.toFixed(1).padStart(4, '0')}"${v >= 0 ? pos : neg}`
}
const HEMI = { N: 1, U: 1, S: -1, E: 1, T: 1, W: -1, B: -1 }   // U/T/B = Utara/Timur/Barat
function parseDMS(t) {
  const re = /(\d{1,3})\s*[°º:\s]\s*(\d{1,2})\s*['′:\s]\s*(\d{1,2}(?:[.,]\d+)?)\s*(?:["″]|'')?\s*([NSEWUTB])/gi, out = []
  let x; while ((x = re.exec(t))) out.push((+x[1] + +x[2] / 60 + parseNum(x[3]) / 3600) * HEMI[x[4].toUpperCase()])
  return out.length === 2 ? { lat: out[0], lng: out[1] } : null
}
function doKoord(input) {
  const t = String(input || '').trim(); if (!t) return null
  let p = parseDMS(t)
  if (!p) { const m = t.match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/); if (m) p = { lat: parseNum(m[1]), lng: parseNum(m[2]) } }
  if (!validLL(p)) return null
  const hemiLat = p.lat >= 0 ? 'Utara' : 'Selatan', hemiLng = p.lng >= 0 ? 'Timur' : 'Barat'
  return `${B('KOORDINAT')}\nDesimal : *${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}*\nDMS     : ${dms(p.lat, 'N', 'S')} ${dms(p.lng, 'E', 'W')}\nBelahan : ${hemiLat} • ${hemiLng}\nPeta    : https://maps.google.com/?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`
}

// ───────────── estunduh ─────────────
const SIZE_U = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 }
function parseSize(s) { const m = String(s).trim().match(/^(\d+(?:[.,]\d+)?)\s*(b|kb|mb|gb|tb)$/i); return m ? parseNum(m[1]) * SIZE_U[m[2].toLowerCase()] : NaN }
// -> byte per detik. "Mbps"/"Mbit/s" (b kecil) = bit; "MB/s"/"MBps" (B besar) = byte
function parseSpeed(s) {
  const m = String(s).trim().match(/^(\d+(?:[.,]\d+)?)\s*([kmg])(b|bit)(?:\/s|ps)$/i); if (!m) return NaN
  const v = parseNum(m[1]) * ({ k: 1e3, m: 1e6, g: 1e9 })[m[2].toLowerCase()], isByte = m[3] === 'B'
  return isByte ? v : v / 8
}
function fmtDur(sec) {
  sec = Math.round(sec); if (sec < 1) return 'kurang dari 1 detik'
  const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), mn = Math.floor(sec % 3600 / 60), s = sec % 60
  return [d && d + ' hari', h && h + ' jam', mn && mn + ' menit', (s || (!d && !h && !mn)) && s + ' detik'].filter(Boolean).join(' ')
}
function doUnduh(args) {
  if (args.length < 2) return null
  const bytes = parseSize(args[0]), rate = parseSpeed(args.slice(1).join('')); if (!(bytes > 0) || !(rate > 0)) return null
  const ideal = bytes / rate
  return `${B('ESTIMASI UNDUH')}\nUkuran    : ${args[0].toUpperCase()}\nKecepatan : ${args.slice(1).join(' ')} (≈ ${num(rate / 1048576, 2)} MB/detik)\n\nIdeal     : *${fmtDur(ideal)}*\nRealistis : ± ${fmtDur(ideal / 0.85)} (≈ 85% dari kecepatan)\n_Ukuran memakai 1 MB = 1024 KB; kecepatan jaringan memakai 1 Mbps = 1.000.000 bit/detik._`
}

// ───────────── rasio ─────────────
const NAMA_RASIO = { '1:1': 'Persegi (feed IG)', '4:3': 'Layar klasik', '3:2': 'Foto DSLR', '16:9': 'Widescreen / HD / YouTube', '16:10': 'Laptop', '21:9': 'Ultrawide', '9:16': 'Story / Reels / TikTok', '4:5': 'Potret IG', '2:3': 'Potret foto', '3:4': 'Potret klasik', '2:1': 'Panorama ringan', '32:9': 'Super ultrawide', '9:21': 'Ultrawide potret', '5:4': 'Monitor lama', '1.91:1': 'Tautan/iklan FB' }
function doRasio(args) {
  const m = String(args[0] || '').match(/^(\d+(?:[.,]\d+)?)\s*[x:×*]\s*(\d+(?:[.,]\d+)?)$/i); if (!m) return null
  let w = parseNum(m[1]), h = parseNum(m[2]); if (!(w > 0 && h > 0) || w > 1e6 || h > 1e6) return null
  const dec = Math.max((m[1].split(/[.,]/)[1] || '').length, (m[2].split(/[.,]/)[1] || '').length), f = 10 ** dec
  const g = gcd(Math.round(w * f), Math.round(h * f)), rw = Math.round(w * f) / g, rh = Math.round(h * f) / g
  const key = `${rw}:${rh}`, near = Object.keys(NAMA_RASIO).map(k => { const [a, b] = k.split(':').map(Number); return [k, Math.abs(a / b - w / h)] }).sort((a, b) => a[1] - b[1])[0]
  let t = `${B('RASIO LAYAR')}\n${num(w, 0)} × ${num(h, 0)} px\nRasio  : *${rw > 100 || rh > 100 ? '≈ ' + near[0] : key}*${NAMA_RASIO[key] ? ' — ' + NAMA_RASIO[key] : near[1] < 0.02 ? ` — mendekati ${near[0]} (${NAMA_RASIO[near[0]]})` : ''}\nDesimal: ${num(w / h, 4)}\nMegapiksel: ${num(w * h / 1e6, 2)} MP`
  const tgt = String(args[1] || '').match(/^(?:([lwt]?)(\d+(?:[.,]\d+)?))$/i)
  if (tgt) {
    const v = parseNum(tgt[2]), byH = tgt[1].toLowerCase() === 't', nw = byH ? v * w / h : v, nh = byH ? v : v * h / w
    t += `\n\nUkuran baru (${byH ? 'tinggi' : 'lebar'} ${num(v, 0)}): *${num(Math.round(nw), 0)} × ${num(Math.round(nh), 0)} px*${Math.round(nw) % 2 || Math.round(nh) % 2 ? '\n_Video biasanya butuh angka genap; pilih ' + [Math.round(nw / 2) * 2, Math.round(nh / 2) * 2].join(' × ') + '._' : ''}`
  } else t += `\n_Tambah lebar/tinggi baru: ${'rasio 1920x1080 1280'} atau ${'rasio 16:9 t720'}_`
  return t
}

// ───────────── pecahan ─────────────
const frac = (n, d) => { if (d < 0) { n = -n; d = -d } const g = gcd(n, d) || 1; return { n: n / g, d: d / g } }
function parseFrac(s) {
  s = String(s).trim().replace(/,/g, '.'); let m
  if ((m = s.match(/^(-?\d+)\/(\d+)$/))) return +m[2] ? frac(+m[1], +m[2]) : null
  if ((m = s.match(/^(-?)(\d*)\.(\d+)$/)) || (m = s.match(/^(-?)(\d+)()$/))) {
    const dec = m[3] || '', digits = dec.length; if (digits > 9) return null
    const n = Number(m[2] + dec || '0') * (m[1] ? -1 : 1); return frac(n, 10 ** digits)
  }
  return null
}
const fracStr = (f) => f.d === 1 ? String(f.n) : `${f.n}/${f.d}`
function mixed(f) { const w = Math.trunc(f.n / f.d), r = Math.abs(f.n % f.d); return w !== 0 && r !== 0 ? `${w} ${r}/${f.d}` : null }
function doPecahan(input) {
  const t = String(input || '').trim().replace(/×/g, 'x').replace(/÷/g, ':'); if (!t) return null
  const num_ = '-?\\d+(?:[.,]\\d+)?(?:\\/\\d+)?', op = t.match(new RegExp(`^(${num_})\\s*([+\\-x*:])\\s*(${num_})$`, 'i'))
  let r, head
  if (op) {
    const a = parseFrac(op[1]), b = parseFrac(op[3]); if (!a || !b) return null
    const o = op[2].toLowerCase()
    if ((o === ':' ) && b.n === 0) return { err: 'Tidak bisa dibagi nol.' }
    r = o === '+' ? frac(a.n * b.d + b.n * a.d, a.d * b.d) : o === '-' ? frac(a.n * b.d - b.n * a.d, a.d * b.d) : (o === 'x' || o === '*') ? frac(a.n * b.n, a.d * b.d) : frac(a.n * b.d, a.d * b.n)
    head = `${fracStr(a)} ${o === '*' ? 'x' : o} ${fracStr(b)}`
  } else { r = parseFrac(t); if (!r) return null; head = t }
  if (![r.n, r.d].every(Number.isSafeInteger)) return { err: 'Angkanya terlalu besar.' }
  const v = r.n / r.d, mx = mixed(r)
  return { text: `${B('PECAHAN')}\n${head}\n\nHasil    : *${fracStr(r)}*${mx ? `  (campuran ${mx})` : ''}\nDesimal  : ${num(v, 6)}\nPersen   : ${num(v * 100, 4)}%` }
}

// ───────────── wibwita ─────────────
const ZONA = { wib: 7, wita: 8, wit: 9, utc: 0, gmt: 0 }
const TAMPIL = [['WIB', 7, 'Jakarta, Sumatra, Jawa, Kalbar/Kalteng'], ['WITA', 8, 'Bali, Kaltim, Sulawesi, NTB/NTT'], ['WIT', 9, 'Maluku, Papua'], ['UTC', 0, ''], ['Arab Saudi', 3, 'Makkah / Madinah'], ['Malaysia / Singapura', 8, ''], ['Jepang / Korea', 9, '']]
function parseJam(s) {
  const m = String(s || '').trim().toLowerCase().match(/^(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?$/); if (!m) return null
  let h = +m[1], mn = m[2] ? +m[2] : 0; if (m[3]) { if (h < 1 || h > 12) return null; h = h % 12 + (m[3] === 'pm' ? 12 : 0) }
  return h <= 23 && mn <= 59 ? h * 60 + mn : null
}
function doWib(args, now = new Date()) {
  let from = 7, minutes
  const last = String(args[args.length - 1] || '').toLowerCase()
  if (args.length && last in ZONA) { from = ZONA[last]; args = args.slice(0, -1) }
  else if (args.length && /^(utc|gmt)?[+-]\d{1,2}$/.test(last)) { from = +last.replace(/^(utc|gmt)/, ''); args = args.slice(0, -1) }
  if (args.length) { minutes = parseJam(args.join('')); if (minutes === null) return null }
  const live = minutes === undefined
  if (live) minutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + from * 60 + 1440) % 1440
  const utc = minutes - from * 60, name = Object.entries(ZONA).find(([k, v]) => v === from && k !== 'gmt')
  const rows = TAMPIL.map(([n, off, ket]) => { const t = utc + off * 60, day = Math.floor(t / 1440), mm = ((t % 1440) + 1440) % 1440; return `${n.padEnd(20)} ${pad(Math.floor(mm / 60))}.${pad(mm % 60)}${day ? (day > 0 ? '  (+1 hari)' : '  (−1 hari)') : ''}${ket ? '  • ' + ket : ''}` })
  return `${B('ZONA WAKTU')}\n${live ? 'Sekarang' : `${pad(Math.floor(minutes / 60))}.${pad(minutes % 60)} ${name ? name[0].toUpperCase() : 'UTC' + (from >= 0 ? '+' : '') + from}`}\n\n${rows.join('\n')}`
}

// ───────────── progres ─────────────
const barv = (f, len = 12) => { const on = Math.round(Math.max(0, Math.min(1, f)) * len); return '▰'.repeat(on) + '▱'.repeat(len - on) }
function doProgres(date = new Date()) {
  const p = D.parts(date, D.tzOf()), o = { y: p.y, m: p.m, d: p.d }
  const dayF = (p.hh * 3600 + p.mm * 60 + p.ss) / 86400
  const wd = (p.dow + 6) % 7                       // Senin = 0
  const weekF = (wd + dayF) / 7
  const dim = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate(), monF = (p.d - 1 + dayF) / dim
  const diy = D.isLeap(p.y) ? 366 : 365, doy = D.dayOfYear(o), yearF = (doy - 1 + dayF) / diy
  const line = (n, f, extra) => `${n.padEnd(6)} ${barv(f)} ${String(Math.floor(f * 100)).padStart(2)}%  ${extra}`
  return `${B('PROGRES WAKTU')}\n${D.fmtDate({ ...o, dow: p.dow })} • ${pad(p.hh)}.${pad(p.mm)}\n\n${line('Hari', dayF, `${24 - p.hh - (p.mm ? 1 : 0)} jam lagi`)}\n${line('Pekan', weekF, `${6 - wd} hari lagi`)}\n${line('Bulan', monF, `${dim - p.d} hari lagi`)}\n${line('Tahun', yearF, `${diy - doy} hari lagi`)}\n\nHari ke-${doy} dari ${diy} • Pekan ISO ${D.isoWeek(o)}`
}

// ───────────── akar ─────────────
function factorize(n) {
  const f = new Map(); for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) while (n % p === 0) { f.set(p, (f.get(p) || 0) + 1); n /= p }
  if (n > 1) f.set(n, (f.get(n) || 0) + 1); return f
}
function doAkar(args) {
  const x = parseNum(args[0]), k = args[1] === undefined ? 2 : Number(args[1])
  if (!Number.isFinite(x) || !Number.isInteger(k) || k < 2 || k > 12) return null
  const neg = x < 0; if (neg && k % 2 === 0) return { err: `Akar pangkat ${k} dari bilangan negatif tidak real.` }
  const a = Math.abs(x), approx = (neg ? -1 : 1) * Math.pow(a, 1 / k), sym = k === 2 ? '√' : k === 3 ? '∛' : k === 4 ? '∜' : `${k}√`
  let text = `${B('AKAR')}\n${sym}${num(x, 6)} ≈ *${num(approx, 8)}*`
  if (Number.isInteger(a) && a > 1 && a <= 1e12) {
    let out = 1, inside = 1; for (const [p, e] of factorize(a)) { out *= p ** Math.floor(e / k); inside *= p ** (e % k) }
    const s = neg ? '-' : ''
    if (inside === 1) text += `\nTepat: *${s}${out}*  (${s}${out}${k === 2 ? '²' : '^' + k} = ${num(x, 0)})`
    else if (out > 1) text += `\nBentuk sederhana: *${s}${out}${sym}${inside}*`
    else text += '\nSudah bentuk paling sederhana (bukan akar tepat).'
  }
  return { text: text + (k === 2 ? `\nKuadrat: ${num(x, 6)}² = ${num(x * x, 6)}` : '') }
}

module.exports = {
  name: 'utilkit', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'Utility Toolkit: urlparse, ua, jarak, koordinat, estunduh, rasio, pecahan, wibwita, progres, akar',
  // diekspor agar bisa diuji langsung
  doUrl, parseUA, haversine, bearing, doJarak, doKoord, parseDMS, parseSize, parseSpeed, doUnduh, fmtDur, doRasio, parseFrac, doPecahan, doWib, parseJam, doProgres, doAkar, factorize,
  run: async ({ m, text, args, command, prefix, reply }) => {
    const t = src(text, m), U = (c) => `${prefix}${c}`
    const usage = (title, lines) => reply(`${B(title)}\n${lines.join('\n')}`)
    switch (command) {
      case 'urlparse': return reply(doUrl(t) || `${B('URL PARSER')}\n${U('urlparse https://toko.id/p?id=7&utm_source=wa')}\nBalas pesan berisi tautan lalu ketik ${U('urlparse')}.\n_Diurai lokal: tidak membuka tautan sama sekali._`)
      case 'ua': return reply(parseUA(t) || `${B('USER-AGENT')}\n${U('ua Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 Chrome/118.0 Mobile Safari/537.36')}\nBalas teks user-agent lalu ketik ${U('ua')}.`)
      case 'jarak': { const r = doJarak(t); if (!r) return usage('JARAK', [`${U('jarak jakarta ke surabaya')}`, `${U('jarak -6.2088,106.8456 ke -7.2575,112.7521')}`, '_Kota Indonesia bawaan atau koordinat lintang,bujur._']); return reply(r.err ? `${B('JARAK')}\n✕ ${r.err}` : r.text) }
      case 'koordinat': return reply(doKoord(t) || `${B('KOORDINAT')}\n${U('koordinat -6.2088, 106.8456')}  → DMS + tautan peta\n${U(`koordinat 6°12'31.7"S 106°50'44.2"E`)}  → desimal\n_Arah boleh N/S/E/W atau U/S/T/B (Utara, Selatan, Timur, Barat)._`)
      case 'estunduh': return reply(doUnduh(args) || `${B('ESTIMASI UNDUH')}\n${U('estunduh 1.5GB 20Mbps')}\n${U('estunduh 700MB 2MB/s')}\n_Mbps (b kecil) = bit; MB/s (B besar) = byte. Ukuran: B, KB, MB, GB, TB._`)
      case 'rasio': return reply(doRasio(args) || `${B('RASIO LAYAR')}\n${U('rasio 1920x1080')}  → 16:9\n${U('rasio 1920x1080 1280')}  → lebar baru 1280\n${U('rasio 16:9 t720')}  → tinggi 720`)
      case 'pecahan': { const r = doPecahan(t); if (!r) return usage('PECAHAN', [`${U('pecahan 6/8')}  → sederhanakan`, `${U('pecahan 0,375')}  → 3/8`, `${U('pecahan 1/2 + 3/4')}  (operator + - x :)`]); return reply(r.err ? `${B('PECAHAN')}\n✕ ${r.err}` : r.text) }
      case 'wibwita': return reply(doWib(args) || `${B('ZONA WAKTU')}\n${U('wibwita')}  → jam sekarang di semua zona\n${U('wibwita 19.30')}  → dari WIB\n${U('wibwita 8 pm wit')}  → dari WIT\n_Zona: wib, wita, wit, utc, atau utc+8._`)
      case 'progres': return reply(doProgres())
      case 'akar': { const r = doAkar(args); if (!r) return usage('AKAR', [`${U('akar 72')}  → 6√2`, `${U('akar 27 3')}  → akar pangkat 3`, `${U('akar 2')}  → desimal`]); return reply(r.err ? `${B('AKAR')}\n✕ ${r.err}` : r.text) }
    }
  },
}
