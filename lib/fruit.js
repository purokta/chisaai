// Game inventory buah: petik buah, simpan di inventory, jual jadi koin. Tiap buah nilainya beda.
const db = require('./db')
const config = require('../config')

// key, emoji, nama, nilai (koin), bobot peluang (makin kecil = makin langka)
const FRUITS = [
  { key: 'pisang', emoji: '🍌', name: 'Pisang', value: 8, w: 30 },
  { key: 'apel', emoji: '🍎', name: 'Apel', value: 10, w: 30 },
  { key: 'jeruk', emoji: '🍊', name: 'Jeruk', value: 12, w: 25 },
  { key: 'anggur', emoji: '🍇', name: 'Anggur', value: 20, w: 18 },
  { key: 'semangka', emoji: '🍉', name: 'Semangka', value: 25, w: 15 },
  { key: 'stroberi', emoji: '🍓', name: 'Stroberi', value: 30, w: 12 },
  { key: 'nanas', emoji: '🍍', name: 'Nanas', value: 40, w: 9 },
  { key: 'mangga', emoji: '🥭', name: 'Mangga', value: 50, w: 7 },
  { key: 'persik', emoji: '🍑', name: 'Persik', value: 65, w: 5 },
  { key: 'kiwi', emoji: '🥝', name: 'Kiwi', value: 80, w: 4 },
  { key: 'ceri', emoji: '🍒', name: 'Ceri', value: 100, w: 3 },
  { key: 'kelapa', emoji: '🥥', name: 'Kelapa', value: 150, w: 2 },
  { key: 'melon', emoji: '🍈', name: 'Melon Emas', value: 300, w: 1 }
]
const BY_KEY = Object.fromEntries(FRUITS.map(f => [f.key, f]))
const COOLDOWN = 30000

const rarity = v => (v >= 150 ? 'Legendaris' : v >= 65 ? 'Epik' : v >= 25 ? 'Langka' : 'Umum')
const fmt = n => Number(n).toLocaleString('id-ID')

// cari buah dari nama / emoji (apel, 🍎, "melon", "melon emas")
function find(text) {
  const t = String(text || '').toLowerCase().trim().replace(/\s+/g, '')
  if (!t) return null
  return FRUITS.find(f => t === f.key || t === f.emoji || t === f.name.toLowerCase().replace(/\s+/g, '') || f.key.startsWith(t) && t.length >= 3) || null
}

const all = () => db.get('fruit', {})
function user(id) {
  const u = all()[id] || {}
  return { inv: u.inv || {}, coins: u.coins || 0, last: u.last || 0, picked: u.picked || 0, exp: u.exp || 0 }
}
function save(id, u) {
  const a = all()
  a[id] = u
  db.set('fruit', a)
}

function rollOne(rnd = Math.random) {
  const total = FRUITS.reduce((s, f) => s + f.w, 0)
  let r = rnd() * total
  for (const f of FRUITS) {
    r -= f.w
    if (r < 0) return f
  }
  return FRUITS[0]
}

// petik 1-3 buah. Mengembalikan { wait } kalau masih cooldown.
function pick(id, now = Date.now(), rnd = Math.random) {
  const u = user(id)
  if (now - u.last < COOLDOWN) return { wait: Math.ceil((COOLDOWN - (now - u.last)) / 1000) }
  const n = 1 + Math.floor(rnd() * 3)
  const got = {}
  for (let i = 0; i < n; i++) {
    const f = rollOne(rnd)
    got[f.key] = (got[f.key] || 0) + 1
    u.inv[f.key] = (u.inv[f.key] || 0) + 1
  }
  u.last = now
  u.picked += n
  save(id, u)
  return { got }
}

const worth = inv => Object.entries(inv).reduce((s, [k, n]) => s + (BY_KEY[k]?.value || 0) * n, 0)

// jual: key buah, atau 'semua'. count: angka / 'semua' / undefined (= semua buah jenis itu)
function sell(id, key, count) {
  const u = user(id)
  const sold = {}
  let gain = 0
  const keys = key === 'semua' ? Object.keys(u.inv) : [key]
  for (const k of keys) {
    const have = u.inv[k] || 0
    if (!have) continue
    const n = key === 'semua' || count === undefined || count === 'semua' ? have : Math.min(have, count)
    if (n <= 0) continue
    u.inv[k] = have - n
    if (!u.inv[k]) delete u.inv[k]
    sold[k] = n
    gain += n * BY_KEY[k].value
  }
  if (!gain) return null
  u.coins += gain
  save(id, u)
  return { sold, gain, coins: u.coins }
}

function board(n = 10) {
  return Object.entries(all())
    .map(([id, u]) => ({ id, total: (u.coins || 0) + worth(u.inv || {}) }))
    .filter(x => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, n)
}

// ---- EXP & level (menang game = EXP + peluang dapat buah; makan buah = EXP sebesar nilainya) ----
const levelOf = exp => Math.floor(Math.sqrt(exp / 50)) + 1
function progress(exp) {
  const lv = levelOf(exp)
  const base = lv === 1 ? 0 : 50 * (lv - 1) * (lv - 1)
  const next = 50 * lv * lv
  return { lv, base, next, into: exp - base, span: next - base }
}
function addExp(u, n) {
  const from = levelOf(u.exp)
  u.exp += n
  const to = levelOf(u.exp)
  return { exp: n, levelUp: to > from, from, to }
}

// hadiah menang game
function reward(id, rnd = Math.random) {
  const u = user(id)
  const r = addExp(u, config.rpg?.gameExp ?? 20)
  let drop = null
  if (rnd() < (config.rpg?.dropChance ?? 0.6)) {
    drop = rollOne(rnd)
    u.inv[drop.key] = (u.inv[drop.key] || 0) + 1
  }
  save(id, u)
  return { ...r, drop, total: u.exp }
}

// makan buah -> EXP = nilai buah x jumlah
function eat(id, key, count) {
  const u = user(id)
  const have = u.inv[key] || 0
  if (!have) return null
  const n = count === undefined || count === 'semua' ? (count === 'semua' ? have : 1) : Math.min(have, count)
  u.inv[key] = have - n
  if (!u.inv[key]) delete u.inv[key]
  const gain = BY_KEY[key].value * n
  const r = addExp(u, gain)
  save(id, u)
  return { n, gain, total: u.exp, ...r }
}

module.exports = { levelOf, progress, addExp, reward, eat, FRUITS, BY_KEY, COOLDOWN, rarity, fmt, find, user, save, pick, sell, worth, board, rollOne }
