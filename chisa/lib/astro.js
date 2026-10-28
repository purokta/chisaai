/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// MESIN ASTRONOMI OFFLINE — posisi Matahari, Bulan, 5 planet, 90 bintang terang, fase bulan, terbit/terbenam.
// Akurasi cukup untuk peta langit (Matahari/planet < 0,1°, Bulan < 0,5°). Tanpa API, tanpa dependensi.
const RAD = Math.PI / 180, DEG = 180 / Math.PI
const norm = (x, p = 360) => ((x % p) + p) % p
const jd = (date) => date.getTime() / 864e5 + 2440587.5
const T = (date) => (jd(date) - 2451545.0) / 36525
const obliq = (t) => 23.439291 - 0.0130042 * t

// ecliptic (lon,lat derajat, jarak apa saja) -> ekuatorial (RA,Dec derajat)
function eclToEq(lon, lat, t) {
  const e = obliq(t) * RAD, l = lon * RAD, b = lat * RAD
  const x = Math.cos(b) * Math.cos(l), y = Math.cos(b) * Math.sin(l) * Math.cos(e) - Math.sin(b) * Math.sin(e), z = Math.cos(b) * Math.sin(l) * Math.sin(e) + Math.sin(b) * Math.cos(e)
  return { ra: norm(Math.atan2(y, x) * DEG), dec: Math.asin(z) * DEG }
}

// ── MATAHARI ──
function sun(date) {
  const t = T(date), L0 = norm(280.46646 + 36000.76983 * t), M = norm(357.52911 + 35999.05029 * t) * RAD
  const C = (1.914602 - 0.004817 * t) * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M)
  const lon = norm(L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * t) * RAD))
  return { lon, ...eclToEq(lon, 0, t) }
}

// ── BULAN (rumus presisi rendah Astronomical Almanac, ± 0,3°) ──
function moon(date) {
  const t = T(date), s = (a, b) => Math.sin((a + b * t) * RAD), c = (a, b) => Math.cos((a + b * t) * RAD)
  const lon = norm(218.32 + 481267.881 * t + 6.29 * s(135.0, 477198.87) - 1.27 * s(259.3, -413335.36) + 0.66 * s(235.7, 890534.22) + 0.21 * s(269.9, 954397.74) - 0.19 * s(357.5, 35999.05) - 0.11 * s(186.5, 966404.03))
  const lat = 5.13 * s(93.3, 483202.02) + 0.28 * s(228.2, 960400.89) - 0.28 * s(318.3, 6003.15) - 0.17 * s(217.6, -407332.21)
  const par = 0.9508 + 0.0518 * c(135.0, 477198.87) + 0.0095 * c(259.3, -413335.36) + 0.0078 * c(235.7, 890534.22) + 0.0028 * c(269.9, 954397.74)
  return { lon, lat, par, dist: 6378.14 / Math.sin(par * RAD), ...eclToEq(lon, lat, t) }
}
// elongasi Bulan dari Matahari (0 = baru, 180 = purnama), iluminasi 0..1
function phase(date) {
  const e = norm(moon(date).lon - sun(date).lon)
  return { elong: e, illum: (1 - Math.cos(e * RAD)) / 2, waxing: e < 180 }
}
const PHASES = ['Bulan Baru', 'Sabit Awal', 'Kuartal Pertama', 'Cembung Awal', 'Purnama', 'Cembung Akhir', 'Kuartal Akhir', 'Sabit Akhir']
const phaseName = (e) => PHASES[Math.floor(norm(e + 22.5) / 45) % 8]
// waktu fase berikutnya: target elongasi 0 (baru), 90, 180 (purnama), 270
function nextPhase(date, target) {
  let t = date.getTime(), step = 6 * 3600e3, f = (x) => ((norm(moon(new Date(x)).lon - sun(new Date(x)).lon) - target + 540) % 360) - 180
  let prev = f(t)
  for (let i = 0; i < 40 * 4; i++) { const n = t + step, cur = f(n); if (prev < 0 && cur >= 0 && cur - prev < 90) { let lo = t, hi = n; for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; (f(mid) < 0 ? (lo = mid) : (hi = mid)) } return new Date((lo + hi) / 2) } t = n; prev = cur }
  return null
}

// ── PLANET (elemen Keplerian JPL, 1800–2050) ──
const EL = {
  Merkurius: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
  Venus: [0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
  Bumi: [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37306329, 102.93768193, 0.32327364, 0, 0],
  Mars: [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
  Jupiter: [5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
  Saturnus: [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
}
function helio(name, t) {
  const p = EL[name], a = p[0] + p[1] * t, e = p[2] + p[3] * t, I = (p[4] + p[5] * t) * RAD, L = p[6] + p[7] * t, w = p[8] + p[9] * t, Om = p[10] + p[11] * t
  const M = norm(L - w) * RAD, om = (w - Om) * RAD, O = Om * RAD
  let E = M + e * Math.sin(M); for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E)
  const co = Math.cos(om), so = Math.sin(om), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I)
  return { x: (co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp, y: (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp, z: (so * sI) * xp + (co * sI) * yp }
}
// bidang ekliptika J2000 -> ekuatorial J2000
const E0 = 23.43928 * RAD
const toEq = (v) => { const x = v.x, y = v.y * Math.cos(E0) - v.z * Math.sin(E0), z = v.y * Math.sin(E0) + v.z * Math.cos(E0); return { ra: norm(Math.atan2(y, x) * DEG), dec: Math.atan2(z, Math.hypot(x, y)) * DEG, dist: Math.hypot(x, y, z) } }
function planet(name, date) {
  const t = T(date), p = helio(name, t), e = helio('Bumi', t)
  const g = { x: p.x - e.x, y: p.y - e.y, z: p.z - e.z }, out = toEq(g)
  return out
}
const PLANETS = [['Merkurius', '#b9b4aa', 0], ['Venus', '#fff1c9', -4], ['Mars', '#ff7b54', 0.6], ['Jupiter', '#ffd9a0', -2.2], ['Saturnus', '#e8d49a', 0.7]]

// ── BINTANG TERANG [nama, RA jam, Dec °, magnitudo] (J2000) ──
const STARS = [
  ['Sirius', 6.7525, -16.716, -1.46], ['Canopus', 6.3992, -52.696, -0.74], ['Arcturus', 14.2610, 19.182, -0.05], ['Alpha Centauri', 14.6600, -60.834, -0.01], ['Vega', 18.6156, 38.784, 0.03],
  ['Capella', 5.2782, 45.998, 0.08], ['Rigel', 5.2423, -8.202, 0.13], ['Procyon', 7.6550, 5.225, 0.34], ['Achernar', 1.6286, -57.237, 0.46], ['Betelgeuse', 5.9195, 7.407, 0.5],
  ['Hadar', 14.0637, -60.373, 0.61], ['Altair', 19.8464, 8.868, 0.76], ['Acrux', 12.4433, -63.099, 0.77], ['Aldebaran', 4.5987, 16.509, 0.85], ['Antares', 16.4901, -26.432, 1.06],
  ['Spica', 13.4199, -11.161, 0.97], ['Pollux', 7.7553, 28.026, 1.14], ['Fomalhaut', 22.9608, -29.622, 1.16], ['Deneb', 20.6905, 45.280, 1.25], ['Mimosa', 12.7953, -59.689, 1.25],
  ['Regulus', 10.1395, 11.967, 1.35], ['Adhara', 6.9771, -28.972, 1.50], ['Castor', 7.5767, 31.888, 1.58], ['Gacrux', 12.5194, -57.113, 1.59], ['Shaula', 17.5601, -37.104, 1.62],
  ['Bellatrix', 5.4189, 6.350, 1.64], ['Elnath', 5.4382, 28.608, 1.65], ['Miaplacidus', 9.2200, -69.717, 1.67], ['Alnilam', 5.6036, -1.202, 1.69], ['Alnair', 22.1372, -46.961, 1.74],
  ['Alnitak', 5.6793, -1.943, 1.77], ['Alioth', 12.9005, 55.960, 1.77], ['Dubhe', 11.0621, 61.751, 1.79], ['Mirfak', 3.4054, 49.861, 1.80], ['Wezen', 7.1399, -26.393, 1.84],
  ['Sargas', 17.6220, -42.998, 1.87], ['Kaus Australis', 18.4029, -34.385, 1.85], ['Avior', 8.3752, -59.509, 1.86], ['Alkaid', 13.7923, 49.313, 1.86], ['Menkalinan', 5.9921, 44.948, 1.90],
  ['Atria', 16.8111, -69.028, 1.92], ['Alhena', 6.6285, 16.399, 1.93], ['Peacock', 20.4275, -56.735, 1.94], ['Alsephina', 8.7451, -54.709, 1.95], ['Mirzam', 6.3783, -17.956, 1.98],
  ['Alphard', 9.4598, -8.659, 1.98], ['Polaris', 2.5303, 89.264, 1.98], ['Hamal', 2.1196, 23.463, 2.00], ['Algieba', 10.3329, 19.842, 2.01], ['Diphda', 0.7265, -17.987, 2.04],
  ['Nunki', 18.9211, -26.297, 2.05], ['Menkent', 14.1114, -36.370, 2.06], ['Mizar', 13.3987, 54.925, 2.04], ['Saiph', 5.7959, -9.670, 2.06], ['Alpheratz', 0.1398, 29.091, 2.06],
  ['Mirach', 1.1622, 35.621, 2.05], ['Rasalhague', 17.5822, 12.560, 2.07], ['Kochab', 14.8451, 74.156, 2.08], ['Denebola', 11.8177, 14.572, 2.14], ['Algol', 3.1361, 40.956, 2.12],
  ['Alphecca', 15.5781, 26.715, 2.23], ['Schedar', 0.6751, 56.537, 2.24], ['Eltanin', 17.9434, 51.489, 2.23], ['Mintaka', 5.5334, -0.299, 2.23], ['Sadr', 20.3705, 40.257, 2.23],
  ['Caph', 0.1529, 59.150, 2.28], ['Dschubba', 16.0056, -22.622, 2.32], ['Merak', 11.0307, 56.382, 2.37], ['Phecda', 11.8972, 53.695, 2.44],
  ['Megrez', 12.2571, 57.033, 3.31], ['Ruchbah', 1.4303, 60.235, 2.68], ['Gamma Cassiopeiae', 0.9451, 60.717, 2.47], ['Enif', 21.7364, 9.875, 2.39],
  ['Markab', 23.0793, 15.205, 2.49], ['Scheat', 23.0629, 28.083, 2.42], ['Algenib', 0.2206, 15.184, 2.83], ['Albireo', 19.5120, 27.960, 3.18], ['Menkar', 3.0380, 4.090, 2.53],
  ['Acamar', 2.9710, -40.305, 2.88], ['Zubeneschamali', 15.2835, -9.383, 2.61], ['Zubenelgenubi', 14.8479, -16.042, 2.75], ['Graffias', 16.0906, -19.805, 2.62], ['Sabik', 17.1730, -15.725, 2.43],
  ['Vindemiatrix', 13.0363, 10.959, 2.83], ['Suhail', 9.1333, -43.433, 2.21], ['Imai', 12.2523, -58.749, 2.80],
]
const UNIQ = STARS
const STAR = Object.fromEntries(UNIQ.map(s => [s[0], s]))
// garis rasi (pasangan nama bintang)
const LINES = {
  'Orion': [['Betelgeuse', 'Bellatrix'], ['Betelgeuse', 'Alnitak'], ['Bellatrix', 'Mintaka'], ['Alnitak', 'Alnilam'], ['Alnilam', 'Mintaka'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel']],
  'Salib Selatan': [['Acrux', 'Gacrux'], ['Mimosa', 'Imai']],
  'Scorpio': [['Graffias', 'Dschubba'], ['Dschubba', 'Antares'], ['Antares', 'Shaula'], ['Antares', 'Sargas']],
  'Beruang Besar': [['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid']],
  'Cassiopeia': [['Caph', 'Schedar'], ['Schedar', 'Gamma Cassiopeiae'], ['Gamma Cassiopeiae', 'Ruchbah']],
  'Segitiga Musim Panas': [['Vega', 'Deneb'], ['Deneb', 'Altair'], ['Altair', 'Vega']],
  'Pegasus': [['Markab', 'Scheat'], ['Scheat', 'Alpheratz'], ['Alpheratz', 'Algenib'], ['Algenib', 'Markab']],
  'Leo': [['Regulus', 'Algieba'], ['Algieba', 'Denebola']],
  'Gemini': [['Castor', 'Pollux']],
  'Centaurus': [['Alpha Centauri', 'Hadar']],
}
const CONSTELLATION_NAMES = { 'Orion': 'Orion (Waluku)', 'Salib Selatan': 'Crux (Salib Selatan)', 'Scorpio': 'Scorpius (Kalajengking)', 'Beruang Besar': 'Ursa Major (Biduk)', 'Cassiopeia': 'Cassiopeia', 'Segitiga Musim Panas': 'Segitiga Musim Panas', 'Pegasus': 'Pegasus', 'Leo': 'Leo (Singa)', 'Gemini': 'Gemini (Kembar)', 'Centaurus': 'Centaurus' }

// ── koordinat horizon ──
const gmst = (date) => norm(280.46061837 + 360.98564736629 * (jd(date) - 2451545.0))
function altaz(ra, dec, date, lat, lng) {
  const H = norm(gmst(date) + lng - ra) * RAD, d = dec * RAD, f = lat * RAD
  const sa = Math.sin(d) * Math.sin(f) + Math.cos(d) * Math.cos(f) * Math.cos(H)
  const alt = Math.asin(sa) * DEG
  const az = norm(Math.atan2(-Math.sin(H) * Math.cos(d), Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.sin(f) * Math.cos(H)) * DEG)
  return { alt, az }
}
// koreksi paralaks Bulan (topocentric): alt sedikit turun
const moonAltAz = (date, lat, lng) => { const m = moon(date), r = altaz(m.ra, m.dec, date, lat, lng); r.alt -= m.par * Math.cos(r.alt * RAD); return { ...r, ...m } }
// refraksi atmosfer kasar (derajat) untuk objek dekat horizon
const refr = (alt) => alt > -1 ? 1.02 / Math.tan((alt + 10.3 / (alt + 5.11)) * RAD) / 60 : 0

// terbit / terbenam / kulminasi dalam rentang 24 jam sejak start. which: 'sun' | 'moon'
function riseSet(which, start, lat, lng) {
  const h0 = which === 'sun' ? -0.833 : 0.125, f = (ms) => { const d = new Date(ms), r = which === 'sun' ? (() => { const s = sun(d); return altaz(s.ra, s.dec, d, lat, lng) })() : moonAltAz(d, lat, lng); return r.alt - h0 }
  const out = { rise: null, set: null }, t0 = start.getTime(), step = 10 * 60e3
  let prev = f(t0)
  for (let t = t0 + step; t <= t0 + 864e5; t += step) {
    const cur = f(t)
    if (prev < 0 && cur >= 0 && !out.rise) out.rise = bisect(f, t - step, t)
    if (prev >= 0 && cur < 0 && !out.set) out.set = bisect(f, t - step, t)
    prev = cur
  }
  return out
}
function bisect(f, lo, hi) { const sl = f(lo) < 0; for (let i = 0; i < 25; i++) { const mid = (lo + hi) / 2; ((f(mid) < 0) === sl ? (lo = mid) : (hi = mid)) } return new Date((lo + hi) / 2) }

const COMPASS = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL']   // Utara, Timur Laut, Timur, Tenggara, Selatan, Barat Daya, Barat, Barat Laut
const compass = (az) => COMPASS[Math.round(norm(az) / 45) % 8]
module.exports = { RAD, DEG, norm, jd, sun, moon, phase, phaseName, nextPhase, planet, PLANETS, STARS: UNIQ, STAR, LINES, CONSTELLATION_NAMES, altaz, moonAltAz, riseSet, compass, refr }
