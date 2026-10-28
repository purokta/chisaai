/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// REGISTER — alur berlapis supaya tidak asal daftar:
//   1) .daftar Nama.Umur  → bot kirim gambar captcha
//   2) .verif KODE        → captcha benar (3x salah = dikunci 10 menit, kode kedaluwarsa 3 menit)
//   3) .setuju <kalimat>  → ketik kalimat persetujuan (ada angka acak, tidak bisa disalin dari chat lama)
//   4) Bot lapor ke nomor owner, user diminta menghubungi owner; owner menjalankan perintah yang diberikan bot (.acc / .tolak)
//   5) Disahkan → kartu "berhasil register" (canvas kota) dikirim ke user
const fs = require('fs'), path = require('path'), crypto = require('crypto'), sharp = require('./sharp.js')
const FILE = path.join(global.chisaData, 'register.json')

let db = { users: {}, flow: {}, locks: {} }
try { db = Object.assign(db, JSON.parse(fs.readFileSync(FILE, 'utf8'))) } catch {}
let t = null
const save = () => { if (t) return; t = setTimeout(() => { t = null; try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db, null, 2)) } catch (e) { console.log('[register] gagal simpan:', e.message) } }, 800) }
process.on('exit', () => { try { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)) } catch {} })

const CAPTCHA_TTL = 3 * 60 * 1000          // kode captcha berlaku 3 menit
const FLOW_TTL = 15 * 60 * 1000            // seluruh proses sebelum lapor ke owner: 15 menit
const PENDING_TTL = 24 * 60 * 60 * 1000    // menunggu owner: 24 jam
const LOCK_MS = 10 * 60 * 1000             // dikunci setelah 3x salah
const MAX_TRY = 3
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'   // tanpa O/0/I/1/L supaya tidak membingungkan

const rnd = (n) => crypto.randomInt(0, n)
const pick = (s, n) => Array.from({ length: n }, () => s[rnd(s.length)]).join('')
const bare = (jid) => String(jid || '').split('@')[0].split(':')[0]

const isRegistered = (jid) => !!db.users[jid]
const getUser = (jid) => db.users[jid] || null
const allUsers = () => db.users
const delUser = (jid) => { const ok = !!db.users[jid]; delete db.users[jid]; save(); return ok }

function sweep() {
  const now = Date.now()
  for (const [j, f] of Object.entries(db.flow)) {
    const ttl = f.step === 'owner' ? PENDING_TTL : FLOW_TTL
    if (now - f.at > ttl) { delete db.flow[j]; save() }
  }
  for (const [j, u] of Object.entries(db.locks)) if (u < now) { delete db.locks[j]; save() }
}
const getFlow = (jid) => { sweep(); return db.flow[jid] || null }
const lockLeft = (jid) => { sweep(); return Math.max(0, Math.ceil(((db.locks[jid] || 0) - Date.now()) / 1000)) }

// validasi "Nama.Umur" (juga terima "Nama 17" / "Nama|17")
function parseIdentity(text) {
  const m = String(text || '').trim().match(/^(.{3,20}?)\s*[.|,\s]\s*(\d{1,2})$/)
  if (!m) return { ok: false, msg: 'Format salah. Tulis: nama.umur\nContoh: *.daftar Budi.17*' }
  const name = m[1].replace(/\s+/g, ' ').trim(), age = Number(m[2])
  if (!/^[\p{L}][\p{L} ]{2,19}$/u.test(name)) return { ok: false, msg: 'Nama hanya boleh huruf & spasi (3-20 karakter), tanpa angka / simbol / emoji.' }
  if (age < 10 || age > 60) return { ok: false, msg: 'Umur harus 10 sampai 60 tahun.' }
  return { ok: true, name, age }
}

// gambar captcha: huruf miring + garis & titik pengganggu (tanpa dependency tambahan)
async function captchaImage(code) {
  const w = 520, h = 190
  let noise = ''
  for (let i = 0; i < 9; i++) noise += `<path d="M${rnd(w)} ${rnd(h)} Q${rnd(w)} ${rnd(h)} ${rnd(w)} ${rnd(h)}" stroke="hsl(${rnd(360)},70%,65%)" stroke-width="${1 + rnd(3)}" fill="none" opacity="0.75"/>`
  for (let i = 0; i < 90; i++) noise += `<circle cx="${rnd(w)}" cy="${rnd(h)}" r="${(Math.random() * 2.2 + 0.4).toFixed(1)}" fill="hsl(${rnd(360)},60%,70%)" opacity="0.6"/>`
  const gap = (w - 80) / code.length
  const chars = [...code].map((c, i) => {
    const x = 50 + i * gap + rnd(10), y = 118 + rnd(26) - 10, rot = rnd(50) - 25, sz = 70 + rnd(22)
    return `<text x="${x}" y="${y}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${sz}" font-weight="800" fill="hsl(${rnd(360)},75%,${72 + rnd(16)}%)" transform="rotate(${rot} ${x} ${y})">${c}</text>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="22" fill="#0e1330"/><rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="19" fill="none" stroke="#d4af37" stroke-width="3"/>${chars}${noise}</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// langkah 1: mulai (atau mulai ulang) → { code } untuk dibuatkan gambar
function start(jid, name, age, chat) {
  const code = pick(ALPHA, 5)
  db.flow[jid] = { step: 'captcha', name, age, chat, code, exp: Date.now() + CAPTCHA_TTL, tries: 0, at: Date.now() }
  save(); return { code }
}
// langkah 2
function verify(jid, input) {
  const f = getFlow(jid)
  if (!f || f.step !== 'captcha') return { ok: false, msg: 'Kamu belum memulai. Ketik *.daftar nama.umur* dulu.' }
  if (Date.now() > f.exp) { delete db.flow[jid]; save(); return { ok: false, msg: '⌛ Kode captcha kedaluwarsa. Ketik *.daftar nama.umur* untuk mendapat kode baru.' } }
  if (String(input || '').trim().toUpperCase().replace(/\s+/g, '') !== f.code) {
    f.tries++
    if (f.tries >= MAX_TRY) { delete db.flow[jid]; db.locks[jid] = Date.now() + LOCK_MS; save(); return { ok: false, msg: `❌ Salah ${MAX_TRY}x. Pendaftaran dikunci 10 menit.` } }
    save(); return { ok: false, msg: `❌ Kode salah. Sisa percobaan: ${MAX_TRY - f.tries}.` }
  }
  f.step = 'agree'; f.phrase = `saya setuju ${1000 + rnd(9000)}`; f.at = Date.now(); save()
  return { ok: true, phrase: f.phrase, name: f.name }
}
// langkah 3 → buat tiket untuk owner
function agree(jid, input) {
  const f = getFlow(jid)
  if (!f || f.step !== 'agree') return { ok: false, msg: 'Selesaikan captcha dulu dengan *.verif KODE*.' }
  if (String(input || '').trim().toLowerCase().replace(/\s+/g, ' ') !== f.phrase) return { ok: false, msg: `❌ Kalimat harus persis sama:\n*${f.phrase}*` }
  const id = pick(ALPHA, 5)
  f.step = 'owner'; f.id = id; f.at = Date.now(); save()
  return { ok: true, id, name: f.name, age: f.age }
}

const pending = () => { sweep(); return Object.entries(db.flow).filter(([, f]) => f.step === 'owner').map(([jid, f]) => ({ jid, ...f })) }
const findPending = (id) => { const k = String(id || '').toUpperCase().replace(/^REG-?/, '').trim(); return pending().find(p => p.id === k) || null }

// owner setuju → jadi user terdaftar
function approve(id) {
  const p = findPending(id); if (!p) return null
  const serial = 'DNY-' + crypto.randomBytes(4).toString('hex').toUpperCase()
  // data user disimpan lengkap + jatah limit harian awal (Free 7 / Premium 30 / Owner ∞ ditentukan saat pemakaian)
  const user = { name: p.name, age: p.age, number: bare(p.jid), serial, at: Date.now(), from: p.chat, lim: require('./limitdb').fresh() }
  db.users[p.jid] = user; delete db.flow[p.jid]; save()
  return { jid: p.jid, chat: p.chat, user }
}
function reject(id) { const p = findPending(id); if (!p) return null; delete db.flow[p.jid]; save(); return p }

module.exports = { save, isRegistered, getUser, allUsers, delUser, getFlow, lockLeft, parseIdentity, captchaImage, start, verify, agree, pending, findPending, approve, reject, bare, CAPTCHA_TTL, MAX_TRY }
