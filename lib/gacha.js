// Login harian (streak) + gacha karakter anime. Semua data tersimpan di data/db.json (tidak hilang saat update/restart).
const db = require('./db')
const config = require('../config')
const http = require('./http')
const fruit = require('./fruit')

// tanggal hari ini (WIB) -> '2026-10-25'
const today = (now = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: config.menu?.timezone || 'Asia/Jakarta' }).format(new Date(now))
const yesterday = (now = Date.now()) => today(now - 86400000)
const rnd = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1))
const cfg = () => ({ cost: 200, maxPaid: 5, pitySSR: 50, pitySR: 10, ...(config.rpg?.gacha || {}) })

// ---------------- LOGIN HARIAN ----------------
const dailyAll = () => db.get('daily', {})

function claimDaily(id, now = Date.now(), r = Math.random) {
  const all = dailyAll()
  const d = all[id] || { last: '', streak: 0, best: 0, total: 0 }
  const t = today(now)
  if (d.last === t) return { already: true, streak: d.streak, total: d.total }

  d.streak = d.last === yesterday(now) ? d.streak + 1 : 1
  d.best = Math.max(d.best || 0, d.streak)
  d.total = (d.total || 0) + 1
  d.last = t

  const s = Math.min(d.streak, 30)
  let coins = 100 + s * 15
  const gainExp = 30 + s * 3
  const bonus = []
  let ticket = 0
  const drops = []
  if (d.streak % 7 === 0) {
    coins += 500
    ticket = 1
    for (let i = 0; i < 2; i++) drops.push(fruit.rollOne(r))
    bonus.push('🔥 Bonus streak 7 hari: +500 koin, 1 tiket gacha, 2 buah!')
  }

  const u = fruit.user(id)
  u.coins += coins
  for (const f of drops) u.inv[f.key] = (u.inv[f.key] || 0) + 1
  const lv = fruit.addExp(u, gainExp)
  fruit.save(id, u)
  if (ticket) {
    const g = gachaUser(id)
    g.tickets += ticket
    saveGacha(id, g)
  }
  all[id] = d
  db.set('daily', all)
  return { already: false, streak: d.streak, best: d.best, total: d.total, coins, exp: gainExp, drops, bonus, ticket, levelUp: lv.levelUp ? lv : null, balance: u.coins }
}

// ---------------- GACHA ----------------
const RAR = {
  SSR: { stars: '⭐⭐⭐⭐⭐', label: 'SSR', coins: [600, 1000], exp: 120, newExp: 150, dupe: 250, pages: [1, 2] },
  SR: { stars: '⭐⭐⭐⭐', label: 'SR', coins: [200, 350], exp: 40, newExp: 60, dupe: 80, pages: [3, 8] },
  R: { stars: '⭐⭐⭐', label: 'R', coins: [80, 150], exp: 15, newExp: 25, dupe: 30, pages: [9, 24] },
  N: { stars: '⭐⭐', label: 'N', coins: [30, 60], exp: 5, newExp: 10, dupe: 10, pages: [25, 80] }
}
// cadangan kalau internet/Jikan gagal (tanpa gambar)
const FALLBACK = {
  SSR: ['Monkey D. Luffy', 'Lelouch Lamperouge', 'Levi Ackerman', 'Light Yagami', 'Naruto Uzumaki', 'Roronoa Zoro', 'Edward Elric', 'Gojo Satoru'],
  SR: ['Killua Zoldyck', 'Mikasa Ackerman', 'Itachi Uchiha', 'Rem', 'Zero Two', 'Nezuko Kamado', 'Megumin', 'Anya Forger'],
  R: ['Asuna Yuuki', 'Rin Tohsaka', 'Misaka Mikoto', 'Kaguya Shinomiya', 'Violet Evergarden', 'Hinata Hyuga', 'Chika Fujiwara', 'Mai Sakurajima'],
  N: ['Konata Izumi', 'Yui Hirasawa', 'Chiyo Mihama', 'Nagisa Furukawa', 'Taiga Aisaka', 'Haruhi Suzumiya', 'Tohru Honda', 'Kurisu Makise']
}

const gAll = () => db.get('gacha', {})
function gachaUser(id) {
  const g = gAll()[id] || {}
  const t = today()
  const day = g.day === t ? g : { day: t, free: 0, paid: 0 }
  return { day: day.day, free: day.free || 0, paid: day.paid || 0, tickets: g.tickets || 0, pitySSR: g.pitySSR || 0, pitySR: g.pitySR || 0, total: g.total || 0, col: g.col || {} }
}
function saveGacha(id, g) {
  const a = gAll()
  a[id] = g
  db.set('gacha', a)
}

function pickRarity(g, r = Math.random) {
  const c = cfg()
  if (g.pitySSR + 1 >= c.pitySSR) return 'SSR'
  if (g.pitySR + 1 >= c.pitySR) return r() < 0.2 ? 'SSR' : 'SR'
  const x = r() * 100
  return x < 3 ? 'SSR' : x < 15 ? 'SR' : x < 45 ? 'R' : 'N'
}

// ambil satu halaman "top characters" (di-cache permanen di database supaya tidak mengulang request)
async function page(n) {
  const cache = db.get('gachaCache', {})
  if (cache[n]) return cache[n]
  const res = await http.getJson(`https://api.jikan.moe/v4/top/characters?page=${n}`, { timeout: 9000 })
  const list = (res.data || []).map(c => ({ id: 'm' + c.mal_id, name: c.name, img: c.images?.jpg?.image_url || '', fav: c.favorites || 0, url: c.url || '' })).filter(c => c.name)
  if (list.length) {
    cache[n] = list
    db.set('gachaCache', cache)
  }
  return list
}

async function pickCharacter(rarity, r = Math.random) {
  const [a, b] = RAR[rarity].pages
  const n = rnd(a, b, r)
  try {
    const list = await page(n)
    if (list.length) return { ...list[Math.floor(r() * list.length)], rarity }
  } catch {}
  // coba halaman lain yang sudah tersimpan, lalu cadangan bawaan
  const cache = db.get('gachaCache', {})
  const have = Object.keys(cache).map(Number).filter(p => p >= a && p <= b)
  if (have.length) {
    const list = cache[have[Math.floor(r() * have.length)]]
    return { ...list[Math.floor(r() * list.length)], rarity }
  }
  const name = FALLBACK[rarity][Math.floor(r() * FALLBACK[rarity].length)]
  return { id: 'f' + name.toLowerCase().replace(/\W+/g, ''), name, img: '', fav: 0, url: '', rarity }
}

// status pull hari ini
function status(id) {
  const g = gachaUser(id)
  const c = cfg()
  return { freeLeft: g.free ? 0 : 1, tickets: g.tickets, paidLeft: Math.max(0, c.maxPaid - g.paid), cost: c.cost, pitySSR: g.pitySSR, pitySR: g.pitySR, total: g.total, owned: Object.keys(g.col).length }
}

// mode: 'auto' (gratis -> tiket) | 'beli'. Mengembalikan { error } atau hasil pull.
async function pull(id, mode = 'auto', r = Math.random) {
  const c = cfg()
  const g = gachaUser(id)
  const u = fruit.user(id)
  let how
  if (mode === 'beli') {
    if (g.paid >= c.maxPaid) return { error: 'limit', max: c.maxPaid }
    if (u.coins < c.cost) return { error: 'koin', need: c.cost, have: u.coins }
    how = 'beli'
  } else if (!g.free) how = 'gratis'
  else if (g.tickets > 0) how = 'tiket'
  else return { error: 'habis', cost: c.cost, paidLeft: Math.max(0, c.maxPaid - g.paid), coins: u.coins }

  const rarity = pickRarity(g, r)
  const ch = await pickCharacter(rarity, r)
  const R = RAR[rarity]

  if (how === 'gratis') g.free = 1
  else if (how === 'tiket') g.tickets -= 1
  else {
    g.paid += 1
    u.coins -= c.cost
  }
  g.total += 1
  g.pitySSR = rarity === 'SSR' ? 0 : g.pitySSR + 1
  g.pitySR = rarity === 'SSR' || rarity === 'SR' ? 0 : g.pitySR + 1

  const have = g.col[ch.id]
  const isNew = !have
  g.col[ch.id] = { n: (have?.n || 0) + 1, name: ch.name, r: rarity, at: have?.at || today() }

  const coins = rnd(R.coins[0], R.coins[1], r) + (isNew ? 0 : R.dupe)
  const expGain = R.exp + (isNew ? R.newExp : 0)
  u.coins += coins
  const lv = fruit.addExp(u, expGain)
  fruit.save(id, u)
  saveGacha(id, g)
  return { ...ch, how, isNew, count: g.col[ch.id].n, coins, exp: expGain, levelUp: lv.levelUp ? lv : null, balance: u.coins, pitySSR: g.pitySSR, freeLeft: g.free ? 0 : 1, tickets: g.tickets, paidLeft: Math.max(0, c.maxPaid - g.paid), R }
}

function collection(id) {
  const g = gachaUser(id)
  const list = Object.entries(g.col).map(([k, v]) => ({ id: k, ...v }))
  const order = { SSR: 0, SR: 1, R: 2, N: 3 }
  list.sort((a, b) => order[a.r] - order[b.r] || b.n - a.n || a.name.localeCompare(b.name))
  return { list, total: g.total }
}

module.exports = { today, claimDaily, pull, status, collection, RAR, cfg, pickRarity, gachaUser }
