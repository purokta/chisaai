/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// SISTEM BUDAK (Slave Contract) — Dionysus RPG, ala isekai.
// Murni data + logika (tanpa require ke rpg.js supaya tidak melingkar).
// Alur: beli di Pasar Budak -> budak liar harus dijinakkan (skill jinak vs ras) -> pasang / kerja / latih.
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const uid = () => (Math.random().toString(36) + '0000').slice(2, 6)

// Rarity: m = pengali stat, perk = bonus % (exp/gold), w = bobot muncul di pasar, lv = level maks budak di pasar
const RAR = {
  C:  { m: 1.0,  perk: 2,  w: 40, lv: 12, ic: '⚪' },
  B:  { m: 1.25, perk: 3,  w: 28, lv: 20, ic: '🟢' },
  A:  { m: 1.6,  perk: 5,  w: 16, lv: 28, ic: '🔵' },
  S:  { m: 2.1,  perk: 7,  w: 9,  lv: 36, ic: '🟣' },
  SS: { m: 3.0,  perk: 10, w: 3,  lv: 45, ic: '🟡' },
}

// need = skill jinak minimum yang disarankan | aff = stat pemain yang membantu menjinakkan | perk = keunggulan ras
const RACES = {
  manusia:   { n: 'Manusia',            e: '🧑', need: 1,  rar: 'C',  price: 700,   aff: 'int', perk: 'gold', base: { atk: 6,  def: 6,  hp: 50 },  names: ['Alden', 'Mira', 'Tomas', 'Selene', 'Rowan', 'Lysa'], desc: 'Mudah diatur, pandai mencari nafkah.' },
  neko:      { n: 'Beastkin Kucing',    e: '🐱', need: 3,  rar: 'C',  price: 1100,  aff: 'agi', perk: 'atk',  base: { atk: 9,  def: 4,  hp: 40 },  names: ['Mimi', 'Tama', 'Nyaru', 'Kiki', 'Suzu', 'Mochi'],    desc: 'Lincah dan curiga pada orang asing.' },
  serigala:  { n: 'Beastkin Serigala',  e: '🐺', need: 5,  rar: 'B',  price: 1800,  aff: 'str', perk: 'atk',  base: { atk: 10, def: 6,  hp: 60 },  names: ['Kuro', 'Fenn', 'Garo', 'Luna', 'Ookami', 'Rex'],     desc: 'Setia kalau sudah mengakui tuannya.' },
  dwarf:     { n: 'Dwarf',              e: '⛏️', need: 6,  rar: 'B',  price: 2200,  aff: 'str', perk: 'def',  base: { atk: 7,  def: 12, hp: 80 },  names: ['Borin', 'Durgan', 'Helga', 'Thrain', 'Brunna', 'Gimli'], desc: 'Keras kepala, tubuh sekuat batu.' },
  elf:       { n: 'Elf',                e: '🧝', need: 9,  rar: 'A',  price: 4200,  aff: 'int', perk: 'exp',  base: { atk: 8,  def: 6,  hp: 50 },  names: ['Lyra', 'Elowen', 'Faelar', 'Sylva', 'Aeris', 'Taleth'], desc: 'Bangga akan darahnya, cepat belajar.' },
  kitsune:   { n: 'Kitsune',            e: '🦊', need: 11, rar: 'A',  price: 5200,  aff: 'int', perk: 'gold', base: { atk: 7,  def: 6,  hp: 45 },  names: ['Tamaki', 'Yuzu', 'Kohaku', 'Inari', 'Akane', 'Mizuki'], desc: 'Licik, pembawa hoki bagi tuannya.' },
  darkelf:   { n: 'Dark Elf',           e: '🧝‍♂️', need: 13, rar: 'A',  price: 4800,  aff: 'int', perk: 'atk',  base: { atk: 12, def: 6,  hp: 55 },  names: ['Zeryn', 'Nyx', 'Vaelis', 'Sorrel', 'Kaelen', 'Ilvara'], desc: 'Penyihir pendiam yang menyimpan dendam.' },
  oni:       { n: 'Oni',                e: '👹', need: 16, rar: 'S',  price: 8500,  aff: 'str', perk: 'hp',   base: { atk: 12, def: 10, hp: 150 }, names: ['Shuki', 'Ibaraki', 'Gouki', 'Tomoe', 'Raiden', 'Kijin'], desc: 'Tenaga raksasa, hanya tunduk pada yang lebih kuat.' },
  vampir:    { n: 'Vampir',             e: '🧛', need: 18, rar: 'S',  price: 10500, aff: 'agi', perk: 'atk',  base: { atk: 14, def: 8,  hp: 90 },  names: ['Carmilla', 'Vlad', 'Seraphine', 'Lucien', 'Morgana', 'Isolde'], desc: 'Anggun dan berbahaya, haus kuasa.' },
  roh:       { n: 'Roh Hutan',          e: '🌿', need: 20, rar: 'S',  price: 12000, aff: 'int', perk: 'exp',  base: { atk: 10, def: 8,  hp: 70 },  names: ['Sylph', 'Willow', 'Ember', 'Nori', 'Aqua', 'Zephyr'],   desc: 'Makhluk sihir, tak mau dikekang tanpa hati.' },
  dragonkin: { n: 'Dragonkin',          e: '🐲', need: 23, rar: 'SS', price: 22000, aff: 'str', perk: 'atk',  base: { atk: 18, def: 14, hp: 160 }, names: ['Vermithor', 'Ignis', 'Drakena', 'Kaelthas', 'Nidhogg', 'Seryth'], desc: 'Darah naga purba, sangat sulit ditundukkan.' },
  iblis:     { n: 'Iblis Rendahan',     e: '😈', need: 25, rar: 'SS', price: 26000, aff: 'int', perk: 'gold', base: { atk: 20, def: 10, hp: 110 }, names: ['Azazel', 'Lilith', 'Malphas', 'Baal', 'Vassago', 'Nebiros'], desc: 'Hanya patuh pada kontrak yang sempurna.' },
}

// Class pemain yang cocok dengan ras tertentu (+bonus peluang jinak)
const CLASS_AFF = {
  archer:    ['neko', 'serigala', 'kitsune', 'roh'],
  mage:      ['elf', 'darkelf', 'roh', 'iblis', 'kitsune'],
  priest:    ['vampir', 'iblis', 'darkelf', 'roh'],
  berserker: ['oni', 'dragonkin', 'dwarf', 'serigala'],
  swordsman: ['manusia', 'dwarf', 'oni', 'elf'],
  assassin:  ['vampir', 'neko', 'darkelf', 'kitsune'],
}
const CLASS_BONUS = 8

const BATTLE = 0.6   // budak = pendamping, bonus tempurnya 60% dari stat aslinya
const MAXLV = 60, TAME_MAX = 30, MARKET_TTL = 2 * 3600 * 1000, SLOTS = 6
const expNeed = (lv) => Math.floor(30 * Math.pow(lv, 1.3))
const tameNeed = (lv) => 20 * lv
const capacity = (u) => Math.min(12, 3 + Math.floor((u.level || 1) / 10))
const roundTo10 = (n) => Math.max(10, Math.round(n / 10) * 10)

// ── budak ──
function priceOf(race, lv, state) { return roundTo10(RACES[race].price * (1 + (lv - 1) * 0.08) * (state === 'jinak' ? 1.8 : 1)) }
function gen() {
  const ids = Object.keys(RACES), tot = ids.reduce((t, k) => t + RAR[RACES[k].rar].w, 0)
  let r = Math.random() * tot, race = ids[0]
  for (const k of ids) { r -= RAR[RACES[k].rar].w; if (r <= 0) { race = k; break } }
  const rc = RACES[race], lv = rnd(1, RAR[rc.rar].lv), state = Math.random() < 0.6 ? 'liar' : 'jinak'
  return { uid: uid(), race, name: pick(rc.names), lv, exp: 0, state, loyal: state === 'jinak' ? rnd(30, 45) : 0, fails: 0, price: priceOf(race, lv, state), lastWork: 0, lastTrain: 0 }
}
// stat budak (sebelum faktor kesetiaan)
function statsOf(sl) {
  const r = RACES[sl.race], m = RAR[r.rar].m, f = 1 + (sl.lv - 1) * 0.12
  const k = (key) => (r.perk === key ? 1.3 : 1)
  return { atk: Math.floor(r.base.atk * m * f * k('atk')), def: Math.floor(r.base.def * m * f * k('def')), hp: Math.floor(r.base.hp * m * f * k('hp')) }
}
const loyalFactor = (sl) => 0.5 + clamp(sl.loyal, 0, 100) / 200
function perkPct(sl) { const r = RACES[sl.race]; return (r.perk === 'exp' || r.perk === 'gold') ? RAR[r.rar].perk : 0 }
function addExp(sl, n) {
  sl.exp = (sl.exp || 0) + n; let up = 0
  while (sl.lv < MAXLV && sl.exp >= expNeed(sl.lv)) { sl.exp -= expNeed(sl.lv); sl.lv++; up++ }
  if (sl.lv >= MAXLV) sl.exp = 0
  return up
}

// ── pemain ──
function init(u) { u.slaves = u.slaves || []; u.tame = u.tame || { lv: 1, exp: 0 }; return u }
function find(u, a) {
  init(u); const k = String(a || '').toLowerCase().trim(); if (!k) return null
  if (/^\d{1,2}$/.test(k)) return u.slaves[parseInt(k) - 1] || null
  return u.slaves.find(s => s.uid === k) || null
}
function active(u) {
  if (!u || !u.slaveActive || !u.slaves) return null
  const sl = u.slaves.find(s => s.uid === u.slaveActive)
  return sl && sl.state === 'jinak' ? sl : null
}
// bonus budak aktif untuk stats() di rpg.js
function bonus(u) {
  const o = { atk: 0, def: 0, hp: 0, exp: 0, gold: 0 }, sl = active(u); if (!sl) return o
  const s = statsOf(sl), k = loyalFactor(sl), r = RACES[sl.race], p = perkPct(sl) * k
  o.atk = s.atk * k * BATTLE; o.def = s.def * k * BATTLE; o.hp = s.hp * k * BATTLE
  if (r.perk === 'exp') o.exp = p; if (r.perk === 'gold') o.gold = p
  return o
}

// ── menjinakkan ──
function classBonus(cls, race) { return (CLASS_AFF[cls] || []).includes(race) ? CLASS_BONUS : 0 }
// st = hasil R.stats(u) (butuh str/def/agi/int)
function tameChance(u, sl, st) {
  init(u); const r = RACES[sl.race]
  const c = 55 + (u.tame.lv - r.need) * 7 - sl.lv * 0.4 + (st[r.aff] || 0) * 0.15 + classBonus(u.cls, sl.race) + (sl.fails || 0) * 3
  return clamp(Math.round(c), 3, 95)
}
const tameCost = (race) => 8 + RACES[race].need        // biaya MP per percobaan
function addTameExp(u, n) {
  init(u); const t = u.tame; if (t.lv >= TAME_MAX) return 0
  t.exp += n; let up = 0
  while (t.lv < TAME_MAX && t.exp >= tameNeed(t.lv)) { t.exp -= tameNeed(t.lv); t.lv++; up++ }
  if (t.lv >= TAME_MAX) t.exp = 0
  return up
}

// ── pasar (global, stok berganti tiap 2 jam) ──
function market(db) {
  const now = Date.now()
  if (!db.slaveMarket || db.slaveMarket.until < now || !Array.isArray(db.slaveMarket.list)) db.slaveMarket = { until: now + MARKET_TTL, list: Array.from({ length: SLOTS }, gen) }
  return db.slaveMarket
}

module.exports = { BATTLE, RAR, RACES, CLASS_AFF, CLASS_BONUS, MAXLV, TAME_MAX, expNeed, tameNeed, capacity, priceOf, gen, statsOf, loyalFactor, perkPct, addExp,
  init, find, active, bonus, classBonus, tameChance, tameCost, addTameExp, market, rnd, pick, clamp }
