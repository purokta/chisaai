// Kompatibilitas Android (nodejs-mobile): Node-nya dibangun TANPA Intl, jadi `Intl` tidak ada sama sekali.
// Modul ini menyediakan Intl.DateTimeFormat / NumberFormat (cukup untuk bot: id-ID, en-GB, en-CA, en-US, sv-SE, zona waktu umum,
// kalender Hijriyah) dan membetulkan toLocale*String. Hanya dipasang kalau Intl memang tidak ada.

const pad = (n, l = 2) => String(n).padStart(l, '0')

// ---------- zona waktu (tanpa database tz): offset tetap + aturan DST umum ----------
const FIX = {
  'Asia/Jakarta': 420, 'Asia/Pontianak': 420, 'Asia/Makassar': 480, 'Asia/Jayapura': 540, 'Asia/Singapore': 480, 'Asia/Kuala_Lumpur': 480,
  'Asia/Manila': 480, 'Asia/Shanghai': 480, 'Asia/Hong_Kong': 480, 'Asia/Taipei': 480, 'Asia/Bangkok': 420, 'Asia/Ho_Chi_Minh': 420,
  'Asia/Tokyo': 540, 'Asia/Seoul': 540, 'Asia/Dubai': 240, 'Asia/Riyadh': 180, 'Asia/Kolkata': 330, 'Asia/Calcutta': 330, 'Asia/Karachi': 300,
  'Asia/Dhaka': 360, 'Asia/Kathmandu': 345, 'Asia/Brunei': 480, 'Asia/Baghdad': 180, 'Asia/Qatar': 180, 'Asia/Kuwait': 180, 'Asia/Tehran': 210,
  'Europe/Istanbul': 180, 'Europe/Moscow': 180, 'Africa/Lagos': 60, 'Africa/Johannesburg': 120, 'Africa/Nairobi': 180, 'America/Sao_Paulo': -180,
  'America/Bogota': -300, 'America/Argentina/Buenos_Aires': -180, 'UTC': 0, 'GMT': 0, 'Etc/UTC': 0, 'Etc/GMT': 0, 'Pacific/Honolulu': -600, 'Australia/Perth': 480, 'Australia/Brisbane': 600
}
const EU = { 'Europe/London': 0, 'Europe/Dublin': 0, 'Europe/Lisbon': 0, 'Europe/Paris': 60, 'Europe/Berlin': 60, 'Europe/Amsterdam': 60, 'Europe/Madrid': 60, 'Europe/Rome': 60, 'Europe/Brussels': 60, 'Europe/Vienna': 60, 'Europe/Zurich': 60, 'Europe/Stockholm': 60, 'Europe/Oslo': 60, 'Europe/Copenhagen': 60, 'Europe/Warsaw': 60, 'Europe/Prague': 60, 'Europe/Athens': 120, 'Europe/Helsinki': 120, 'Europe/Kiev': 120, 'Europe/Kyiv': 120 }
const US = { 'America/New_York': -300, 'America/Toronto': -300, 'America/Chicago': -360, 'America/Denver': -420, 'America/Los_Angeles': -480, 'America/Vancouver': -480, 'America/Phoenix': null, 'America/Anchorage': -540 }

const dayOfMonthNthSun = (y, m, n) => { const first = new Date(Date.UTC(y, m, 1)).getUTCDay(); return 1 + ((7 - first) % 7) + (n - 1) * 7 }
const lastSun = (y, m) => { const last = new Date(Date.UTC(y, m + 1, 0)); return last.getUTCDate() - last.getUTCDay() }
const lastDow = (y, m, dow) => { const last = new Date(Date.UTC(y, m + 1, 0)); return last.getUTCDate() - ((last.getUTCDay() - dow + 7) % 7) }

function offsetMin(tz, ms) {
  if (tz == null) return -new Date(ms).getTimezoneOffset() // zona sistem
  if (tz in FIX) return FIX[tz]
  const y = new Date(ms).getUTCFullYear()
  if (tz in EU) {
    const s = Date.UTC(y, 2, lastSun(y, 2), 1), e = Date.UTC(y, 9, lastSun(y, 9), 1)
    return EU[tz] + (ms >= s && ms < e ? 60 : 0)
  }
  if (tz in US) {
    const std = US[tz]; if (std === null) return -420
    const s = Date.UTC(y, 2, dayOfMonthNthSun(y, 2, 2), 2) - std * 60000, e = Date.UTC(y, 10, dayOfMonthNthSun(y, 10, 1), 2) - (std + 60) * 60000
    return std + (ms >= s && ms < e ? 60 : 0)
  }
  if (tz === 'Australia/Sydney' || tz === 'Australia/Melbourne') {
    const e = Date.UTC(y, 3, dayOfMonthNthSun(y, 3, 1), 2) - 600 * 60000, s = Date.UTC(y, 9, dayOfMonthNthSun(y, 9, 1), 2) - 600 * 60000
    return 600 + (ms < e || ms >= s ? 60 : 0)
  }
  if (tz === 'Pacific/Auckland') {
    const e = Date.UTC(y, 3, dayOfMonthNthSun(y, 3, 1), 2) - 720 * 60000, s = Date.UTC(y, 8, lastSun(y, 8), 2) - 720 * 60000
    return 720 + (ms < e || ms >= s ? 60 : 0)
  }
  if (tz === 'Africa/Cairo') {
    const s = Date.UTC(y, 3, lastDow(y, 3, 5)) - 120 * 60000, e = Date.UTC(y, 9, lastDow(y, 9, 4) + 1) - 180 * 60000
    return 120 + (ms >= s && ms < e ? 60 : 0)
  }
  const m = /^(?:Etc\/)?GMT([+-])(\d{1,2})$/.exec(tz) // Etc/GMT-7 = UTC+7
  if (m) return (m[1] === '-' ? 1 : -1) * Number(m[2]) * 60
  throw new RangeError('Invalid time zone specified: ' + tz)
}

// ---------- nama bulan/hari ----------
const N = {
  id: { m: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
        ms: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        d: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], ds: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] },
  en: { m: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        ms: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        d: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], ds: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
}
N.sv = N.en

// Hijriyah (algoritma tabular/Kuwaiti) — cukup akurat (±1 hari)
function islamic(y, m, d) {
  const jd = Math.floor(Date.UTC(y, m - 1, d) / 86400000 + 2440587.5 + 0.5)
  let l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  l = l - 10631 * n + 354
  const j = Math.floor((10985 - l) / 5316) * Math.floor(50 * l / 17719) + Math.floor(l / 5670) * Math.floor(43 * l / 15238)
  l = l - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29
  const mm = Math.floor(24 * l / 709)
  return { y: 30 * n + j - 30, m: mm, d: l - Math.floor(709 * mm / 24) }
}

function langOf(loc) {
  const l = String(loc || 'en-US')
  if (/^id/i.test(l)) return 'id'
  if (/^sv/i.test(l)) return 'sv'
  if (/^en-GB/i.test(l)) return 'gb'
  if (/^en-CA/i.test(l)) return 'ca'
  return 'us'
}

function normalize(o) {
  o = { ...(o || {}) }
  const has = (...k) => k.some(x => o[x] != null)
  if (o.dateStyle || o.timeStyle) {
    const ds = o.dateStyle, ts = o.timeStyle
    if (ds === 'full') Object.assign(o, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    else if (ds === 'long') Object.assign(o, { day: 'numeric', month: 'long', year: 'numeric' })
    else if (ds === 'medium') Object.assign(o, { day: 'numeric', month: 'short', year: 'numeric' })
    else if (ds === 'short') Object.assign(o, { day: 'numeric', month: 'numeric', year: '2-digit', _short: true })
    if (ts) Object.assign(o, { hour: 'numeric', minute: '2-digit' }, ts === 'short' ? {} : { second: '2-digit' })
    o._styled = ds
  } else if (!has('weekday', 'year', 'month', 'day', 'hour', 'minute', 'second', 'dayPeriod')) {
    Object.assign(o, { year: 'numeric', month: 'numeric', day: 'numeric' })
  }
  return o
}

function DateTimeFormat(locale, options) {
  if (!(this instanceof DateTimeFormat)) return new DateTimeFormat(locale, options)
  const loc = Array.isArray(locale) ? locale[0] : locale
  this._loc = String(loc || 'en-US')
  this._lang = langOf(this._loc)
  this._islamic = /-u-.*ca-islamic/.test(this._loc)
  this._o = normalize(options)
  this._tz = options && options.timeZone != null ? String(options.timeZone) : null
  if (this._tz) offsetMin(this._tz, Date.now()) // validasi: lempar RangeError seperti Intl asli
}

DateTimeFormat.prototype.formatToParts = function (date) {
  const ms = date === undefined ? Date.now() : +date
  if (!isFinite(ms)) throw new RangeError('Invalid time value')
  const o = this._o, lang = this._lang, nm = N[lang === 'id' ? 'id' : 'en']
  const off = this._tz === 'UTC' ? 0 : offsetMin(this._tz, ms)
  const t = new Date(ms + off * 60000)
  let Y = t.getUTCFullYear(), M = t.getUTCMonth() + 1, D = t.getUTCDate(), W = t.getUTCDay()
  if (this._islamic) { const i = islamic(Y, M, D); Y = i.y; M = i.m; D = i.d }
  const P = (type, value) => ({ type, value: String(value) })
  const L = (v) => P('literal', v)
  const parts = []
  const add = (arr) => { for (const p of arr) parts.push(p) }

  // ----- tanggal -----
  const dateParts = []
  const wd = o.weekday ? P('weekday', (o.weekday === 'long' ? nm.d : nm.ds)[W]) : null
  const textMonth = o.month === 'long' || o.month === 'short' || o.month === 'narrow'
  const yr = o.year ? P('year', o.year === '2-digit' ? pad(Y % 100) : Y) : null
  const dy = o.day ? P('day', o.day === '2-digit' || (lang === 'id' && (o._styled === 'full' || o._styled === 'short')) || ((lang === 'gb' || lang === 'ca' || lang === 'sv') && !textMonth && o.month) ? pad(D) : D) : null
  let mo = null
  if (o.month) {
    if (textMonth) mo = P('month', (o.month === 'long' ? nm.m : nm.ms)[M - 1])
    else mo = P('month', o.month === '2-digit' || (lang === 'id' && o._styled === 'short') || lang === 'gb' || lang === 'ca' || lang === 'sv' ? (o.day || o.year ? pad(M) : M) : M)
  }
  if (wd || yr || mo || dy) {
    if (textMonth) {
      if (lang === 'us' || lang === 'ca') { // Thu, Oct 29, 2026
        if (wd) { dateParts.push(wd); dateParts.push(L(', ')) }
        dateParts.push(mo); if (dy) { dateParts.push(L(' ')); dateParts.push(dy) }
        if (yr) { dateParts.push(L(dy ? ', ' : ' ')); dateParts.push(yr) }
      } else { // Kam, 29 Okt 2026
        if (wd) { dateParts.push(wd); dateParts.push(L(lang === 'id' || lang === 'gb' ? ', ' : ' ')) }
        if (dy) { dateParts.push(dy); dateParts.push(L(' ')) }
        dateParts.push(mo); if (yr) { dateParts.push(L(' ')); dateParts.push(yr) }
      }
    } else {
      const fields = []
      if (lang === 'ca' || lang === 'sv') { if (yr) fields.push(yr); if (mo) fields.push(mo); if (dy) fields.push(dy) }
      else if (lang === 'us') { if (mo) fields.push(mo); if (dy) fields.push(dy); if (yr) fields.push(yr) }
      else { if (dy) fields.push(dy); if (mo) fields.push(mo); if (yr) fields.push(yr) }
      const sep = (lang === 'ca' || lang === 'sv') ? '-' : '/'
      if (wd) { dateParts.push(wd); if (fields.length) dateParts.push(L(', ')) }
      fields.forEach((f, i) => { if (i) dateParts.push(L(sep)); dateParts.push(f) })
    }
  }

  // ----- waktu -----
  const timeParts = []
  if (o.hour || o.minute || o.second) {
    const h12 = o.hour12 != null ? !!o.hour12 : o.hourCycle ? /h1[12]/.test(o.hourCycle) : (lang === 'us' || lang === 'ca')
    const sepT = lang === 'id' ? '.' : ':'
    let H = t.getUTCHours()
    let period = null
    if (h12) { period = H >= 12 ? 'PM' : 'AM'; if (lang === 'ca') period = H >= 12 ? 'p.m.' : 'a.m.'; H = H % 12 || 12 }
    if (o.hour) timeParts.push(P('hour', h12 ? (o.hour === '2-digit' ? pad(H) : H) : pad(H)))
    if (o.minute) { if (timeParts.length) timeParts.push(L(sepT)); timeParts.push(P('minute', o.hour || o.second ? pad(t.getUTCMinutes()) : t.getUTCMinutes())) }
    if (o.second) { if (timeParts.length) timeParts.push(L(sepT)); timeParts.push(P('second', o.minute ? pad(t.getUTCSeconds()) : t.getUTCSeconds())) }
    if (period && o.hour) { timeParts.push(L(' ')); timeParts.push(P('dayPeriod', period)) }
  }

  add(dateParts)
  if (dateParts.length && timeParts.length) {
    const joiner = lang === 'sv' ? ' ' : (o._styled === 'full' || o._styled === 'long') ? (lang === 'id' ? ' pukul ' : ' at ') : ', '
    parts.push(L(joiner))
  }
  add(timeParts)
  return parts
}
DateTimeFormat.prototype.format = function (date) { return this.formatToParts(date).map(p => p.value).join('') }
DateTimeFormat.prototype.resolvedOptions = function () {
  return { locale: this._loc, calendar: this._islamic ? 'islamic' : 'gregory', numberingSystem: 'latn', timeZone: this._tz || systemZone() }
}
DateTimeFormat.supportedLocalesOf = (l) => [].concat(l || [])

function systemZone() {
  const off = -new Date().getTimezoneOffset()
  for (const [z, o] of Object.entries(FIX)) if (o === off && z.includes('/')) return z
  return 'UTC'
}

// ---------- NumberFormat ----------
function NumberFormat(locale, options) {
  if (!(this instanceof NumberFormat)) return new NumberFormat(locale, options)
  const o = options || {}
  this._id = /^id/i.test(String(Array.isArray(locale) ? locale[0] : locale || ''))
  const minF = o.minimumFractionDigits != null ? o.minimumFractionDigits : 0
  const maxDefault = o.style === 'currency' ? 2 : o.style === 'percent' ? 0 : 3
  this._min = minF
  this._max = Math.max(minF, o.maximumFractionDigits != null ? o.maximumFractionDigits : Math.max(minF, maxDefault))
  this._group = o.useGrouping !== false
  this._o = o
}
NumberFormat.prototype.format = function (v) {
  let n = typeof v === 'bigint' ? Number(v) : Number(v)
  if (Number.isNaN(n)) return 'NaN'
  const neg = n < 0 || Object.is(n, -0) && false
  if (!isFinite(n)) return (neg ? '-' : '') + '∞'
  if (this._o.style === 'percent') n *= 100
  const a = Math.abs(n)
  let s = a >= 1e21 ? String(a) : a.toFixed(Math.min(this._max, 100))
  if (s.includes('.')) {
    let [i, f] = s.split('.')
    while (f.length > this._min && f.endsWith('0')) f = f.slice(0, -1)
    s = f ? i + '.' + f : i
  } else if (this._min) s += '.' + '0'.repeat(this._min)
  let [ip, fp] = s.split('.')
  if (this._group) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, this._id ? '.' : ',')
  let out = fp ? ip + (this._id ? ',' : '.') + fp : ip
  if (this._o.style === 'percent') out += '%'
  if (this._o.style === 'currency') out = (this._o.currency === 'IDR' ? 'Rp' : this._o.currency === 'USD' ? '$' : (this._o.currency || '') + ' ') + out
  return (n < 0 && Number(s) !== 0 ? '-' : '') + out
}
NumberFormat.prototype.resolvedOptions = function () { return { locale: this._id ? 'id-ID' : 'en-US', minimumFractionDigits: this._min, maximumFractionDigits: this._max } }
NumberFormat.supportedLocalesOf = (l) => [].concat(l || [])

// ---------- stub kecil untuk bagian Intl lain ----------
function Collator() { if (!(this instanceof Collator)) return new Collator(); this.compare = (a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0) }
function PluralRules() { if (!(this instanceof PluralRules)) return new PluralRules(); this.select = (n) => (n === 1 ? 'one' : 'other') }
function ListFormat(l, o) { if (!(this instanceof ListFormat)) return new ListFormat(l, o); const w = (o && o.type === 'disjunction') ? 'or' : 'and'; this.format = (a) => { a = [...a]; return a.length < 3 ? a.join(` ${w} `) : a.slice(0, -1).join(', ') + `, ${w} ` + a[a.length - 1] } }
function Segmenter() { if (!(this instanceof Segmenter)) return new Segmenter(); this.segment = (s) => Array.from(String(s), (c, i) => ({ segment: c, index: i })) }

function build() { return { DateTimeFormat, NumberFormat, Collator, PluralRules, ListFormat, Segmenter, getCanonicalLocales: (l) => [].concat(l || []) } }

function install(force) {
  if (!force && typeof Intl !== 'undefined') return false
  globalThis.Intl = build()
  const dateWith = (def) => function (loc, opts) {
    const o = { ...(opts || {}) }
    const hasDate = ['weekday', 'year', 'month', 'day', 'dateStyle'].some(k => o[k] != null)
    const hasTime = ['hour', 'minute', 'second', 'timeStyle'].some(k => o[k] != null)
    if (def === 'date' && !hasDate) Object.assign(o, { year: 'numeric', month: 'numeric', day: 'numeric' })
    if (def === 'time' && !hasTime) Object.assign(o, { hour: 'numeric', minute: 'numeric', second: 'numeric' })
    if (def === 'both' && !hasDate && !hasTime) Object.assign(o, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    return new DateTimeFormat(loc, o).format(this)
  }
  Date.prototype.toLocaleString = dateWith('both')
  Date.prototype.toLocaleDateString = dateWith('date')
  Date.prototype.toLocaleTimeString = dateWith('time')
  Number.prototype.toLocaleString = function (loc, opts) { return new NumberFormat(loc, opts).format(Number(this)) }
  return true
}

module.exports = { install, build, DateTimeFormat, NumberFormat }
