/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// IG STALK Dionysus: ambil profil publik Instagram, rapikan datanya, lalu analisis ringan.
// Hanya data publik dari API pihak ketiga. Tidak ada data palsu: kalau gagal, hasilnya error, bukan profil karangan.
// Tambahkan API cadangan lewat settings: global.igstalkApis = ['https://contoh.api/igstalk?username=']
// Bentuk alamat yang diterima: berakhiran '=' (username ditempel), memakai {u} sebagai tempat username,
// atau tanpa parameter (bot mencoba ?username= , ?user= , ?q= , ?url= secara berurutan).
const axios = require('axios')

const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36'
const DEFAULT_APIS = ['https://api.vreden.web.id/api/igstalk?username=', 'https://api.deline.web.id/stalker/igstalk']
const CACHE = new Map(), CACHE_MS = 10 * 60 * 1000

const apis = () => [...(Array.isArray(global.igstalkApis) ? global.igstalkApis : []), ...DEFAULT_APIS]

// ── input ──
function cleanUser(s) {
  let t = String(s || '').trim()
  const m = t.match(/instagram\.com\/(?:_u\/)?([a-z0-9._]+)/i)
  if (m) t = m[1]
  t = t.replace(/^@+/, '').replace(/[/?#].*$/, '').toLowerCase()
  return /^[a-z0-9._]{1,30}$/.test(t) ? t : ''
}

// ── normalisasi ──
function find(o, keys, depth = 0) {
  if (!o || typeof o !== 'object' || depth > 3) return undefined
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]
  for (const c of ['result', 'data', 'user', 'profile', 'graphql', 'info']) {
    if (o[c] && typeof o[c] === 'object') { const r = find(o[c], keys, depth + 1); if (r !== undefined) return r }
  }
  return undefined
}
function toNum(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'object') return v.count !== undefined ? toNum(v.count) : null
  const m = String(v).trim().toLowerCase().replace(/\s/g, '').match(/^([\d.,]+)(k|rb|m|jt|b)?$/)
  if (!m) return null
  if (!m[2]) { const n = parseInt(m[1].replace(/[.,]/g, ''), 10); return Number.isFinite(n) ? n : null }
  const n = parseFloat(m[1].replace(',', '.')); if (!Number.isFinite(n)) return null
  return Math.round(n * ({ k: 1e3, rb: 1e3, m: 1e6, jt: 1e6, b: 1e9 })[m[2]])
}
const toBool = (v) => v === true || v === 1 || /^(true|1|yes|ya)$/i.test(String(v))
const str = (v) => (v === undefined || v === null) ? '' : String(v).trim()

function normalize(raw, username) {
  const f = (...k) => find(raw, k)
  const p = {
    username: str(f('username', 'user_name', 'userName')) || username,
    fullName: str(f('fullName', 'full_name', 'name', 'nickname')),
    bio: str(f('biography', 'bio', 'description', 'about')),
    avatar: str(f('profile_pic_url_hd', 'avatar', 'profilePic', 'profile_pic_url', 'profilePicUrl', 'profile_picture', 'pp', 'image')),
    followers: toNum(f('followers', 'follower_count', 'followersCount', 'edge_followed_by')),
    following: toNum(f('following', 'following_count', 'followingCount', 'edge_follow')),
    posts: toNum(f('posts', 'post_count', 'postsCount', 'media_count', 'edge_owner_to_timeline_media')),
    verified: toBool(f('isVerified', 'is_verified', 'verified')),
    private: toBool(f('isPrivate', 'is_private', 'private')),
    business: toBool(f('isBusiness', 'is_business', 'is_business_account', 'isBusinessAccount')),
    category: str(f('category', 'category_name', 'business_category_name')),
    link: str(f('external_url', 'externalUrl', 'website', 'url')),
    id: str(f('id', 'pk', 'user_id')),
  }
  p.url = 'https://www.instagram.com/' + p.username
  const hasData = p.fullName || p.bio || p.followers !== null || p.posts !== null || p.avatar
  return hasData ? p : null
}

// ── analisis (perkiraan dari data publik) ──
function analyze(p) {
  const a = { tier: '-', ratio: null, ratioNote: '', score: 0, notes: [], tags: [], mentions: [], emails: [], links: [] }
  const fl = p.followers
  if (fl !== null) a.tier = fl >= 1e6 ? 'Mega (1 jt+)' : fl >= 5e5 ? 'Makro (500 rb+)' : fl >= 1e5 ? 'Tengah (100 rb+)' : fl >= 1e4 ? 'Mikro (10 rb+)' : fl >= 1e3 ? 'Nano (1 rb+)' : 'Akun kecil (<1 rb)'
  if (fl !== null && p.following !== null) {
    a.ratio = p.following ? +(fl / p.following).toFixed(2) : null
    a.ratioNote = p.following === 0 ? 'Tidak mengikuti siapa pun' : a.ratio >= 10 ? 'Jauh lebih banyak diikuti daripada mengikuti, ciri akun publik/tokoh' : a.ratio >= 1.5 ? 'Pengikut lebih banyak dari yang diikuti' : a.ratio >= 0.8 ? 'Seimbang, ciri akun pribadi biasa' : 'Mengikuti lebih banyak dari pengikut, ciri akun yang masih tumbuh'
  }
  // kelengkapan profil (0-100)
  const parts = [[p.avatar ? 1 : 0, 'Foto profil', 20], [p.fullName ? 1 : 0, 'Nama lengkap', 15], [p.bio ? 1 : 0, 'Bio', 25], [p.link ? 1 : 0, 'Tautan luar', 15], [(p.posts || 0) > 0 ? 1 : 0, 'Sudah ada postingan', 15], [(p.verified || p.business) ? 1 : 0, 'Terverifikasi / bisnis', 10]]
  a.score = parts.reduce((s, x) => s + (x[0] ? x[2] : 0), 0)
  for (const x of parts) if (!x[0]) a.notes.push('Belum ada: ' + x[1].toLowerCase())
  if (p.private) a.notes.push('Akun privat: postingan hanya terlihat oleh pengikut')
  if (p.posts !== null && fl !== null && p.posts > 0) a.notes.push(`Rata-rata ${Math.round(fl / p.posts).toLocaleString('id-ID')} pengikut per postingan`)
  // isi bio
  const bio = p.bio || ''
  a.tags = [...new Set((bio.match(/#[\p{L}\p{N}_]+/gu) || []))].slice(0, 12)
  a.mentions = [...new Set((bio.match(/(?<![\w.])@[a-z0-9._]{2,30}/gi) || []))].slice(0, 8)
  a.emails = [...new Set((bio.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []))].slice(0, 4)
  a.links = [...new Set([...(bio.match(/https?:\/\/[^\s]+/g) || []), p.link].filter(Boolean))].slice(0, 5)
  return a
}

// ── foto profil → data URI (sandbox kartu tidak bisa memuat gambar luar) ──
async function avatarBuffer(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null
  try {
    const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 9000, maxContentLength: 8 * 1024 * 1024, headers: { 'User-Agent': UA, Referer: 'https://www.instagram.com/' }, validateStatus: s => s === 200 })
    return Buffer.from(r.data)
  } catch { return null }
}
async function avatarDataUri(buf) {
  if (!buf) return ''
  try {
    const out = await require('./sharp.js')(buf).resize(160, 160, { fit: 'cover' }).jpeg({ quality: 68 }).toBuffer()
    return 'data:image/jpeg;base64,' + out.toString('base64')
  } catch { return buf.length < 60000 ? 'data:image/jpeg;base64,' + buf.toString('base64') : '' }
}

// ── utama ──
const candidates = (base, u) => {
  if (base.includes('{u}')) return [base.replace('{u}', encodeURIComponent(u))]
  if (/=$/.test(base)) return [base + encodeURIComponent(u)]
  const sep = base.includes('?') ? '&' : '?'
  return [`${sep}username=${encodeURIComponent(u)}`, `${sep}user=${encodeURIComponent(u)}`, `${sep}q=${encodeURIComponent(u)}`, `${sep}url=${encodeURIComponent('https://www.instagram.com/' + u)}`].map(x => base + x)
}
async function fetchRaw(username) {
  let lastErr = null
  for (const base of apis()) {
    for (const url of candidates(base, username)) {
      try {
        const r = await axios.get(url, { timeout: 12000, headers: { 'User-Agent': UA, Accept: 'application/json' }, validateStatus: s => s < 500 })
        const data = r.data
        if (r.status >= 400) { lastErr = new Error((data && (data.message || data.msg || data.error)) || 'Permintaan ditolak (' + r.status + ')'); continue }   // coba nama parameter berikutnya
        if (data && (data.status === false || data.success === false)) { lastErr = new Error(data.message || data.msg || 'Akun tidak ditemukan'); break }
        const p = normalize(data, username)
        if (p) return p
        lastErr = new Error('Akun tidak ditemukan atau datanya kosong'); break
      } catch (e) { lastErr = e; break }
    }
  }
  throw new Error(lastErr && /timeout|ENOTFOUND|ECONN|socket/i.test(lastErr.message || '') ? 'Server data Instagram sedang tidak bisa dihubungi, coba lagi sebentar lagi' : (lastErr && lastErr.message) || 'Gagal mengambil data')
}

async function lookup(username, { withAvatar = true } = {}) {
  const key = username + (withAvatar ? ':a' : '')
  const hit = CACHE.get(key)
  if (hit && Date.now() - hit.t < CACHE_MS) return hit.v
  const p = await fetchRaw(username)
  p.a = analyze(p)
  p.avatarBuf = withAvatar ? await avatarBuffer(p.avatar) : null
  p.avatarUri = withAvatar ? await avatarDataUri(p.avatarBuf) : ''
  p.takenAt = Date.now()
  CACHE.set(key, { t: Date.now(), v: p })
  if (CACHE.size > 60) CACHE.delete(CACHE.keys().next().value)
  return p
}

// versi ringan untuk dikirim ke kartu (tanpa buffer)
const forCard = (p) => { const { avatarBuf, avatar, ...rest } = p; return rest }

module.exports = { cleanUser, lookup, forCard, normalize, analyze, toNum }
