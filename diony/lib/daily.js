/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// MESIN KEHIDUPAN SEHARI-HARI: tanggal, Hijriah, weton, zodiak, shio, libur nasional, salat, kiblat
const tzOf = () => global.settingsDefault?.timezone || 'Asia/Jakarta'
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const HMONTHS = ['Muharam', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jumadilawal', 'Jumadilakhir', 'Rajab', 'Syaban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah']
const pad = (n) => String(n).padStart(2, '0')

// ── waktu sekarang di zona waktu tertentu ──
function parts(date, tz) {
  const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: tz || tzOf(), hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' }).formatToParts(date).forEach(x => { p[x.type] = x.value })
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute, ss: +p.second, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) }
}
const now = (tz) => parts(new Date(), tz)
// selisih UTC (ms) zona waktu pada saat tertentu
const offsetMs = (tz, date) => { const p = parts(date, tz); return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss) - Math.floor(date.getTime() / 1000) * 1000 }
// jam dinding (y,m,d,hh,mm) di zona tz -> epoch ms
function zonedToUtc(y, m, d, hh, mm, tz) { let t = Date.UTC(y, m - 1, d, hh, mm) - offsetMs(tz || tzOf(), new Date(Date.UTC(y, m - 1, d, hh, mm))); t = Date.UTC(y, m - 1, d, hh, mm) - offsetMs(tz || tzOf(), new Date(t)); return t }

const dayNum = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 864e5)           // nomor hari (tanpa jam)
const diffDays = (a, b) => dayNum(b.y, b.m, b.d) - dayNum(a.y, a.m, a.d)
const addDays = (o, n) => { const t = new Date(Date.UTC(o.y, o.m - 1, o.d + n)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() } }
const dowOf = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay()
const fmtDate = (o, withDow = true) => `${withDow ? DAYS[o.dow ?? dowOf(o.y, o.m, o.d)] + ', ' : ''}${o.d} ${MONTHS[o.m - 1]} ${o.y}`
const iso = (o) => `${o.y}-${pad(o.m)}-${pad(o.d)}`
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const dayOfYear = (o) => diffDays({ y: o.y, m: 1, d: 1 }, o) + 1
function isoWeek(o) { const t = new Date(Date.UTC(o.y, o.m - 1, o.d)), dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7) }

// ── parser tanggal: 17-08-2027, 17/8/27, 2027-08-17, "17 agustus 2027", "17 agu" ──
const MON_ALIAS = { jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, jul: 7, juli: 7, agu: 8, agt: 8, agustus: 8, aug: 8, sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, oct: 10, nov: 11, november: 11, des: 12, desember: 12, dec: 12 }
function parseDate(str, ref) {
  const s = String(str || '').toLowerCase().trim().replace(/,/g, ' '); if (!s) return null
  const cur = ref || now(); let m
  const ok = (y, mo, d) => { if (y < 1000) y += y < 50 ? 2000 : 1900; const t = new Date(Date.UTC(y, mo - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? { y, m: mo, d, dow: t.getUTCDay() } : null }
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) return ok(+m[1], +m[2], +m[3])
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) return ok(+m[3], +m[2], +m[1])
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})$/))) return ok(cur.y, +m[2], +m[1])
  if ((m = s.match(/^(\d{1,2})\s+([a-z]+)\s*(\d{2,4})?$/)) && MON_ALIAS[m[2]]) return ok(m[3] ? +m[3] : cur.y, MON_ALIAS[m[2]], +m[1])
  return null
}
// ambil tanggal dari awal teks (1-3 kata) -> {date, rest}
function takeDate(text, ref) {
  const w = String(text || '').trim().split(/\s+/)
  for (const n of [3, 2, 1]) { const d = parseDate(w.slice(0, n).join(' '), ref); if (d) return { date: d, rest: w.slice(n).join(' ') } }
  return { date: null, rest: text }
}

// ── Hijriah (kalender sipil; resmi ditetapkan Kemenag, bisa ±1 hari) ──
function hijri(o) {
  const p = {}; new Intl.DateTimeFormat('en-u-ca-islamic-civil', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).formatToParts(new Date(Date.UTC(o.y, o.m - 1, o.d, 12))).forEach(x => { p[x.type] = x.value })
  return { d: +p.day, m: +p.month, y: parseInt(p.year), name: HMONTHS[+p.month - 1], text: `${+p.day} ${HMONTHS[+p.month - 1]} ${parseInt(p.year)} H` }
}

// ── Weton Jawa ──
const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'], NEPTU_HARI = [5, 4, 3, 7, 8, 6, 9], NEPTU_PASARAN = [5, 9, 7, 4, 8]
const pasaranOf = (o) => PASARAN[(((dayNum(o.y, o.m, o.d) - dayNum(1945, 8, 17)) % 5) + 5) % 5]   // 17-8-1945 = Jumat Legi
function weton(o) { const dow = dowOf(o.y, o.m, o.d), ps = pasaranOf(o), pi = PASARAN.indexOf(ps); return { hari: DAYS[dow], pasaran: ps, neptu: NEPTU_HARI[dow] + NEPTU_PASARAN[pi], nh: NEPTU_HARI[dow], np: NEPTU_PASARAN[pi] } }
const PASARAN_SIFAT = { Legi: 'ramah, murah hati, mudah bergaul', Pahing: 'tegas, ambisius, pekerja keras', Pon: 'tenang, bijaksana, penuh pertimbangan', Wage: 'teguh, mandiri, setia pada prinsip', Kliwon: 'intuitif, peka, punya daya tarik tersendiri' }
const NEPTU_ARTI = (n) => n <= 9 ? 'sederhana dan rendah hati; rezeki mengalir lewat ketekunan' : n <= 12 ? 'seimbang dan tenang; hidup stabil bila sabar' : n <= 15 ? 'penuh semangat dan kepemimpinan; pandai memanfaatkan peluang' : 'berwibawa dan beruntung; hati-hati dengan ego sendiri'

// ── Zodiak & Shio (hiburan) ──
const ZODIAK = [['Capricorn', 12, 22, 'ambisius, disiplin, dan bertanggung jawab'], ['Aquarius', 1, 20, 'mandiri, kreatif, dan visioner'], ['Pisces', 2, 19, 'empatik, imajinatif, dan lembut'], ['Aries', 3, 21, 'berani, energik, dan pemimpin alami'], ['Taurus', 4, 20, 'setia, sabar, dan menyukai kenyamanan'], ['Gemini', 5, 21, 'cerdas, luwes, dan banyak ide'], ['Cancer', 6, 21, 'penyayang, protektif, dan intuitif'], ['Leo', 7, 23, 'percaya diri, hangat, dan dermawan'], ['Virgo', 8, 23, 'teliti, analitis, dan membantu'], ['Libra', 9, 23, 'adil, diplomatis, dan menyukai harmoni'], ['Scorpio', 10, 23, 'gigih, misterius, dan penuh tekad'], ['Sagitarius', 11, 22, 'optimis, bebas, dan suka petualangan']]
function zodiak(o) { let z = ZODIAK[0]; for (const x of ZODIAK) if (o.m > x[1] || (o.m === x[1] && o.d >= x[2])) z = x; if (o.m === 1 && o.d < 20) z = ZODIAK[0]; return { name: z[0], sifat: z[3] } }
const SHIO = [['Tikus', 'cerdik, adaptif, dan pandai melihat peluang'], ['Kerbau', 'tekun, jujur, dan pekerja keras'], ['Macan', 'berani, kharismatik, dan kompetitif'], ['Kelinci', 'lembut, diplomatis, dan artistik'], ['Naga', 'berwibawa, penuh semangat, dan ambisius'], ['Ular', 'bijak, tenang, dan analitis'], ['Kuda', 'bebas, enerjik, dan supel'], ['Kambing', 'kreatif, penyayang, dan cinta damai'], ['Monyet', 'jenaka, cerdas, dan inovatif'], ['Ayam', 'rajin, teliti, dan percaya diri'], ['Anjing', 'setia, jujur, dan melindungi'], ['Babi', 'dermawan, tulus, dan penuh kasih']]
function shio(o) { const y = (o.m < 2 || (o.m === 2 && o.d < 5)) ? o.y - 1 : o.y, i = (((y - 2020) % 12) + 12) % 12, s = SHIO[i]; return { name: s[0], sifat: s[1], year: y, edge: o.m === 1 || (o.m === 2 && o.d < 20) } }

// ── Libur nasional & cuti bersama (SKB 3 Menteri). Update tiap tahun! ──
const L = (d, n, t = 'libur') => ({ d, n, t })
const HOLIDAYS = [
  L('2026-01-01', 'Tahun Baru 2026 Masehi'), L('2026-01-16', 'Isra Mikraj Nabi Muhammad SAW'), L('2026-02-16', 'Cuti Bersama Tahun Baru Imlek', 'cuti'), L('2026-02-17', 'Tahun Baru Imlek 2577'),
  L('2026-03-18', 'Cuti Bersama Hari Suci Nyepi', 'cuti'), L('2026-03-19', 'Hari Suci Nyepi (Tahun Baru Saka 1948)'), L('2026-03-20', 'Cuti Bersama Idulfitri', 'cuti'), L('2026-03-21', 'Hari Raya Idulfitri 1447 H'), L('2026-03-22', 'Hari Raya Idulfitri 1447 H'),
  L('2026-03-23', 'Cuti Bersama Idulfitri', 'cuti'), L('2026-03-24', 'Cuti Bersama Idulfitri', 'cuti'), L('2026-04-03', 'Wafat Yesus Kristus'), L('2026-04-05', 'Kebangkitan Yesus Kristus (Paskah)'),
  L('2026-05-01', 'Hari Buruh Internasional'), L('2026-05-14', 'Kenaikan Yesus Kristus'), L('2026-05-15', 'Cuti Bersama Kenaikan Yesus Kristus', 'cuti'), L('2026-05-27', 'Hari Raya Iduladha 1447 H'), L('2026-05-28', 'Cuti Bersama Iduladha', 'cuti'),
  L('2026-05-31', 'Hari Raya Waisak 2570 BE'), L('2026-06-01', 'Hari Lahir Pancasila'), L('2026-06-16', '1 Muharam Tahun Baru Islam 1448 H'), L('2026-08-17', 'Proklamasi Kemerdekaan RI'), L('2026-08-25', 'Maulid Nabi Muhammad SAW'),
  L('2026-12-24', 'Cuti Bersama Natal', 'cuti'), L('2026-12-25', 'Kelahiran Yesus Kristus (Natal)'),
  L('2027-01-01', 'Tahun Baru 2027 Masehi'), L('2027-01-05', 'Isra Mikraj Nabi Muhammad SAW 1448 H'), L('2027-02-05', 'Cuti Bersama Tahun Baru Imlek', 'cuti'), L('2027-02-06', 'Tahun Baru Imlek 2578 Kongzili'),
  L('2027-03-08', 'Hari Suci Nyepi (Tahun Baru Saka 1949)'), L('2027-03-09', 'Cuti Bersama Idulfitri', 'cuti'), L('2027-03-10', 'Hari Raya Idulfitri 1448 H'), L('2027-03-11', 'Hari Raya Idulfitri 1448 H'),
  L('2027-03-12', 'Cuti Bersama Idulfitri', 'cuti'), L('2027-03-15', 'Cuti Bersama Idulfitri', 'cuti'), L('2027-03-25', 'Cuti Bersama Wafat Yesus Kristus', 'cuti'), L('2027-03-26', 'Wafat Yesus Kristus'), L('2027-03-28', 'Kebangkitan Yesus Kristus (Paskah)'),
  L('2027-05-01', 'Hari Buruh Internasional'), L('2027-05-06', 'Kenaikan Yesus Kristus'), L('2027-05-17', 'Hari Raya Iduladha 1448 H'), L('2027-05-18', 'Cuti Bersama Iduladha', 'cuti'), L('2027-05-19', 'Cuti Bersama Waisak', 'cuti'),
  L('2027-05-20', 'Hari Raya Waisak 2571 BE'), L('2027-06-01', 'Hari Lahir Pancasila'), L('2027-06-06', '1 Muharam Tahun Baru Islam 1449 H'), L('2027-08-15', 'Maulid Nabi Muhammad SAW'), L('2027-08-17', 'Proklamasi Kemerdekaan RI'),
  L('2027-12-24', 'Cuti Bersama Natal', 'cuti'), L('2027-12-25', 'Kelahiran Yesus Kristus (Natal)'), L('2027-12-26', 'Isra Mikraj Nabi Muhammad SAW 1449 H'),
]
const HOL_MAP = Object.fromEntries(HOLIDAYS.map(h => [h.d, h]))
const HOL_LAST = HOLIDAYS[HOLIDAYS.length - 1].d.slice(0, 4)
const holidayOn = (o) => HOL_MAP[iso(o)] || null
const isWorkday = (o) => { const dw = o.dow ?? dowOf(o.y, o.m, o.d); return dw !== 0 && dw !== 6 && !(holidayOn(o) && holidayOn(o).t === 'libur') && !(holidayOn(o) && holidayOn(o).t === 'cuti') }
function nextHolidays(from, n = 5, type = 'libur') {
  const f = iso(from); return HOLIDAYS.filter(h => h.d >= f && (type === 'all' || h.t === type)).slice(0, n).map(h => { const [y, m, d] = h.d.split('-').map(Number); return { ...h, date: h.d, y, m, d, dow: dowOf(y, m, d), in: diffDays(from, { y, m, d }) } })
}

// ── Kota (lat, lng, UTC offset) ──
const C = (name, lat, lng, tz) => ({ name, lat, lng, tz })
const CITIES = { jakarta: C('Jakarta', -6.2088, 106.8456, 7), bandung: C('Bandung', -6.9175, 107.6191, 7), surabaya: C('Surabaya', -7.2575, 112.7521, 7), semarang: C('Semarang', -6.9667, 110.4167, 7), yogyakarta: C('Yogyakarta', -7.7956, 110.3695, 7),
  medan: C('Medan', 3.5952, 98.6722, 7), palembang: C('Palembang', -2.9761, 104.7754, 7), makassar: C('Makassar', -5.1477, 119.4327, 8), denpasar: C('Denpasar', -8.6705, 115.2126, 8), balikpapan: C('Balikpapan', -1.2379, 116.8529, 8),
  pontianak: C('Pontianak', -0.0263, 109.3425, 7), banjarmasin: C('Banjarmasin', -3.3194, 114.5908, 8), manado: C('Manado', 1.4748, 124.8421, 8), padang: C('Padang', -0.9471, 100.4172, 7), pekanbaru: C('Pekanbaru', 0.5071, 101.4478, 7),
  batam: C('Batam', 1.0456, 104.0305, 7), bandarlampung: C('Bandar Lampung', -5.4294, 105.261, 7), malang: C('Malang', -7.9666, 112.6326, 7), bogor: C('Bogor', -6.5971, 106.806, 7), depok: C('Depok', -6.4025, 106.7942, 7),
  tangerang: C('Tangerang', -6.1783, 106.6319, 7), bekasi: C('Bekasi', -6.2383, 106.9756, 7), surakarta: C('Surakarta (Solo)', -7.5755, 110.8243, 7), cirebon: C('Cirebon', -6.732, 108.5523, 7), tasikmalaya: C('Tasikmalaya', -7.3274, 108.2207, 7),
  serang: C('Serang', -6.1201, 106.1503, 7), jambi: C('Jambi', -1.6101, 103.6131, 7), bengkulu: C('Bengkulu', -3.8004, 102.2655, 7), bandaaceh: C('Banda Aceh', 5.5483, 95.3238, 7), mataram: C('Mataram', -8.5833, 116.1167, 8),
  kupang: C('Kupang', -10.1772, 123.607, 8), ambon: C('Ambon', -3.6954, 128.1814, 9), jayapura: C('Jayapura', -2.5337, 140.7181, 9), palu: C('Palu', -0.9003, 119.878, 8), kendari: C('Kendari', -3.9985, 122.513, 8),
  samarinda: C('Samarinda', -0.5022, 117.1536, 8), pangkalpinang: C('Pangkalpinang', -2.1316, 106.1169, 7), tanjungpinang: C('Tanjungpinang', 0.9186, 104.4666, 7), gorontalo: C('Gorontalo', 0.5435, 123.0568, 8), ternate: C('Ternate', 0.7833, 127.3667, 9),
  sorong: C('Sorong', -0.8762, 131.2558, 9), merauke: C('Merauke', -8.4932, 140.4018, 9), palangkaraya: C('Palangkaraya', -2.2161, 113.9135, 7), jember: C('Jember', -8.1845, 113.6681, 7), kediri: C('Kediri', -7.848, 112.0178, 7),
  purwokerto: C('Purwokerto', -7.4242, 109.2393, 7), tegal: C('Tegal', -6.8694, 109.1402, 7), sukabumi: C('Sukabumi', -6.9277, 106.93, 7), cilegon: C('Cilegon', -6.0025, 106.0111, 7), tarakan: C('Tarakan', 3.3, 117.6333, 8),
  bukittinggi: C('Bukittinggi', -0.3055, 100.3692, 7), pematangsiantar: C('Pematangsiantar', 2.9595, 99.0687, 7), lhokseumawe: C('Lhokseumawe', 5.1801, 97.1507, 7), kudus: C('Kudus', -6.8048, 110.8405, 7), madiun: C('Madiun', -7.6298, 111.5239, 7) }
const CITY_ALIAS = { solo: 'surakarta', jogja: 'yogyakarta', jogjakarta: 'yogyakarta', yogya: 'yogyakarta', lampung: 'bandarlampung', bdl: 'bandarlampung', banda: 'bandaaceh', aceh: 'bandaaceh', jkt: 'jakarta', sby: 'surabaya', bali: 'denpasar', ujungpandang: 'makassar' }
function findCity(q) {
  let k = String(q || '').toLowerCase().replace(/^(kota|kab\.?|kabupaten)\s+/, '').replace(/[^a-z]/g, ''); if (!k) return null
  k = CITY_ALIAS[k] || k; if (CITIES[k]) return { key: k, ...CITIES[k] }
  const m = Object.keys(CITIES).find(x => x.startsWith(k) || (k.length >= 4 && x.includes(k))); return m ? { key: m, ...CITIES[m] } : null
}

// ── Jadwal salat (algoritma astronomi; metode Kemenag RI: Subuh 20°, Isya 18°, ihtiyath +2 menit) ──
const R = Math.PI / 180, dsin = d => Math.sin(d * R), dcos = d => Math.cos(d * R), dtan = d => Math.tan(d * R)
const darcsin = x => Math.asin(x) / R, darccos = x => Math.acos(Math.max(-1, Math.min(1, x))) / R, darctan2 = (y, x) => Math.atan2(y, x) / R, darccot = x => Math.atan(1 / x) / R
const fixA = a => a - 360 * Math.floor(a / 360), fixH = a => a - 24 * Math.floor(a / 24)
function julian(y, m, d) { if (m <= 2) { y -= 1; m += 12 } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 }
function sunPos(jd) { const D = jd - 2451545.0, g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D), L = fixA(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g)), e = 23.439 - 0.00000036 * D, RA = darctan2(dcos(e) * dsin(L), dcos(L)) / 15; return { decl: darcsin(dsin(e) * dsin(L)), eqt: q / 15 - fixH(RA) } }
function prayerTimes(o, lat, lng, tz) {
  const jd = julian(o.y, o.m, o.d) - lng / (15 * 24), mid = (t) => fixH(12 - sunPos(jd + t).eqt)
  const ang = (angle, t, ccw) => { const decl = sunPos(jd + t).decl, v = darccos((-dsin(angle) - dsin(decl) * dsin(lat)) / (dcos(decl) * dcos(lat))) / 15; return mid(t) + (ccw ? -v : v) }
  const asr = (f, t) => { const decl = sunPos(jd + t).decl; return ang(-darccot(f + dtan(Math.abs(lat - decl))), t) }
  let T = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 }
  for (let i = 0; i < 2; i++) { const t = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v / 24])); T = { fajr: ang(20, t.fajr, true), sunrise: ang(0.833, t.sunrise, true), dhuhr: mid(t.dhuhr), asr: asr(1, t.asr), sunset: ang(0.833, t.sunset), isha: ang(18, t.isha) } }
  const adj = tz - lng / 15, IH = 2 / 60, out = {}
  out.imsak = T.fajr + adj + IH - 10 / 60; out.subuh = T.fajr + adj + IH; out.terbit = T.sunrise + adj - IH; out.dhuha = T.sunrise + adj + 20 / 60
  out.dzuhur = T.dhuhr + adj + IH; out.ashar = T.asr + adj + IH; out.maghrib = T.sunset + adj + IH; out.isya = T.isha + adj + IH
  return out
}
const hm = (h) => { h = fixH(h + 0.5 / 60); return `${pad(Math.floor(h))}:${pad(Math.floor((h % 1) * 60))}` }
function qibla(lat, lng) {
  const k = [21.4225, 39.8262], dl = (k[1] - lng) * R, b = fixA(darctan2(Math.sin(dl) * dcos(k[0]), dcos(lat) * dsin(k[0]) - dsin(lat) * dcos(k[0]) * Math.cos(dl)))
  const dirs = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'], p1 = lat * R, p2 = k[0] * R
  const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return { deg: b, dir: dirs[Math.round(b / 45) % 8], km: Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) }
}
// zona waktu IANA -> offset jam (untuk kota hasil pencarian internet)
const tzHours = (tz, date) => offsetMs(tz, date || new Date()) / 3600000

const QUOTES = ['Mulailah dari yang kecil, tapi mulailah hari ini.', 'Konsisten mengalahkan motivasi yang naik-turun.', 'Istirahat bukan tanda menyerah, itu bagian dari perjalanan.', 'Hari yang buruk tidak berarti hidup yang buruk.',
  'Fokus pada progres, bukan kesempurnaan.', 'Kerjakan yang bisa kamu kendalikan, lepaskan sisanya.', 'Satu langkah kecil hari ini lebih baik dari seribu rencana.', 'Bersyukur membuat yang cukup terasa lebih dari cukup.',
  'Tidak ada kata terlambat untuk belajar hal baru.', 'Orang sabar dan tekun selalu menemukan jalannya.', 'Jaga kesehatanmu, dia investasi paling berharga.', 'Kebaikan kecil yang konsisten mengubah banyak hal.',
  'Berani salah adalah syarat untuk jadi benar.', 'Air yang tenang pun bisa menghanyutkan, tetaplah rendah hati dan kuat.', 'Percayalah pada prosesmu sendiri.', 'Hari ini adalah halaman baru, tulislah dengan baik.',
  'Waktu tidak bisa dibeli, gunakan dengan bijak.', 'Jangan bandingkan bab awalmu dengan bab tengah orang lain.', 'Senyummu bisa jadi alasan orang lain bertahan hari ini.', 'Disiplin adalah bentuk cinta pada diri di masa depan.',
  'Belajar dari kemarin, hidup untuk hari ini, berharap untuk esok.', 'Lelah itu wajar, menyerah itu pilihan.', 'Mulai dengan alasan, bertahan dengan kebiasaan.', 'Teman baik membuat beban terasa ringan.', 'Rezeki datang pada yang berusaha dan berdoa.',
  'Jangan tunda: hari ini akan jadi "kemarin" besok.', 'Mimpi besar butuh jadwal kecil yang rutin.', 'Sedikit demi sedikit, lama-lama menjadi bukit.', 'Tenangkan pikiran, jawabannya sering muncul saat hening.', 'Hargai prosesnya, nikmati perjalanannya.']
const quoteOf = (o) => QUOTES[dayNum(o.y, o.m, o.d) % QUOTES.length]
const greet = (hh) => hh < 4 ? 'Selamat dini hari' : hh < 11 ? 'Selamat pagi' : hh < 15 ? 'Selamat siang' : hh < 18 ? 'Selamat sore' : 'Selamat malam'
const dur = (min) => { min = Math.max(0, Math.round(min)); const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60; return [d && d + 'h', h && h + 'j', (m || (!d && !h)) && m + 'm'].filter(Boolean).join(' ') }

module.exports = { tzOf, DAYS, MONTHS, pad, parts, now, offsetMs, zonedToUtc, dayNum, diffDays, addDays, dowOf, fmtDate, iso, isLeap, dayOfYear, isoWeek, parseDate, takeDate,
  hijri, weton, pasaranOf, PASARAN_SIFAT, NEPTU_ARTI, zodiak, shio, HOLIDAYS, HOL_LAST, holidayOn, isWorkday, nextHolidays, CITIES, findCity, prayerTimes, hm, qibla, tzHours, quoteOf, greet, dur }
