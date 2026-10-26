/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// MESIN RPG — Dionysus (database, stat, battle, exp, quest, clan)
const fs = require('fs')
const path = require('path')
const D = require('./rpgdata')

const FILE = path.join(global.dionyData, 'rpg.json')
let db = { users: {}, clans: {}, boss: null }
try { db = Object.assign(db, JSON.parse(fs.readFileSync(FILE, 'utf8'))) } catch {}
let timer = null
function save(now) {
  if (now) { try { fs.writeFileSync(FILE, JSON.stringify(db)) } catch (e) { console.log('[rpg] gagal simpan', e.message) } return }
  if (timer) return
  timer = setTimeout(() => { timer = null; save(true) }, 2000)
}
process.on('exit', () => save(true))
process.on('SIGINT', () => { save(true); process.exit(0) })

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const fmt = (n) => Math.floor(n).toLocaleString('id-ID')
const bar = (c, m, len = 10) => { const f = Math.max(0, Math.min(len, Math.round((c / Math.max(1, m)) * len))); return '█'.repeat(f) + '░'.repeat(len - f) }
const expNeed = (lv) => Math.floor(90 * Math.pow(lv, 1.45))
const MAXLV = 200
const rankOf = (lv) => { let r = D.RANKS[0]; for (const x of D.RANKS) if (lv >= x.min) r = x; return r }
const nextRank = (lv) => D.RANKS.find(x => x.min > lv) || null

function today() {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: global.settingsDefault?.timezone || 'Asia/Jakarta' }).format(new Date()) } catch { return new Date().toISOString().slice(0, 10) }
}

// ── USER ──
function create(jid, name, cls) {
  const c = D.CLASSES[cls]
  const u = {
    id: jid, name: name || jid.split('@')[0], cls, level: 1, exp: 0, gold: 500, pts: 0,
    a: { str: 0, def: 0, agi: 0, int: 0 }, hp: 1, mp: 1,
    inv: { hp_potion: 3, wood_sword: 1 }, eq: { weapon: 'wood_sword', armor: null, acc: null },
    comp: { owned: {}, active: null }, clan: null, kills: 0, wins: 0, losses: 0, floor: 1, bestFloor: 0, bossDmg: 0,
    cd: {}, quest: { day: '', list: [], bonus: false }, createdAt: Date.now(),
  }
  db.users[jid] = u
  const s = stats(u); u.hp = s.maxhp; u.mp = s.maxmp
  save(); return u
}
const get = (jid) => db.users[jid] || null
const allUsers = () => Object.values(db.users)

function compBonus(u) {
  const o = { atk: 0, def: 0, hp: 0, exp: 0, gold: 0 }
  const id = u.comp.active; if (!id || !u.comp.owned[id]) return o
  const c = D.COMPANIONS.find(x => x.id === id); if (!c) return o
  const star = u.comp.owned[id], b = D.RARITY[c.r].bonus * (1 + (star - 1) * 0.5)
  if (c.perk === 'atk') o.atk = b * 5; if (c.perk === 'def') o.def = b * 3
  if (c.perk === 'hp') o.hp = b * 30; if (c.perk === 'exp') o.exp = b; if (c.perk === 'gold') o.gold = b
  return o
}

function stats(u) {
  const c = D.CLASSES[u.cls], lv = u.level, g = Math.floor(lv * 0.9)
  const eq = { atk: 0, def: 0, hp: 0, luck: 0 }
  for (const slot of ['weapon', 'armor', 'acc']) {
    const id = u.eq[slot], it = D.ITEMS[id]
    if (it) { const m = 1 + 0.1 * ((u.enhLv && u.enhLv[id]) || 0); eq.atk += (it.atk || 0) * m; eq.def += (it.def || 0) * m; eq.hp += (it.hp || 0) * m; eq.luck += it.luck || 0 }
  }
  const cb = compBonus(u), sb = require('./slave').bonus(u), clan = u.clan && db.clans[u.clan]
  const str = c.str + u.a.str + g, def = c.def + u.a.def + g, agi = c.agi + u.a.agi + g, int = c.int + u.a.int + g
  const magic = u.cls === 'mage' || u.cls === 'priest'
  const now = Date.now(), bf = u.buff || {}, fo = fortuneOf(u), xb = require('./rpgextra').bonus(u)
  const atk = Math.floor((str * 2 + (magic ? int * 2.2 : 0) + agi * 0.5 + eq.atk + cb.atk + sb.atk) * (bf.atk > now ? 1.15 : 1) * (1 + xb.atk / 100))
  const defv = Math.floor((def * 1.5 + eq.def + cb.def + sb.def) * (bf.def > now ? 1.15 : 1) * (1 + xb.def / 100))
  const maxhp = Math.floor((c.hp + lv * c.hpg + def * 5 + eq.hp + cb.hp + sb.hp) * (1 + xb.hp / 100))
  const maxmp = Math.floor(c.mp + lv * c.mpg + int * 3)
  const crit = Math.min(60, agi * 0.4 + eq.luck + xb.crit)
  const clv = clan ? clan.level : 0
  return { str, def, agi, int, atk, def_: defv, defv, maxhp, maxmp, crit, luck: eq.luck,
    power: Math.floor(atk * 3 + defv * 2 + maxhp / 5), expBonus: cb.exp + sb.exp + clv * 2 + (bf.exp > now ? 20 : 0) + fo.exp + xb.exp, goldBonus: cb.gold + sb.gold + clv + fo.gold + xb.gold }
}

const FORTUNES = [
  { n: 'Daikichi (Keberuntungan Besar)', w: 8,  gold: 25, exp: 15, txt: 'Bintang-bintang tersenyum padamu. Hari ini semua terasa mudah!' },
  { n: 'Kichi (Beruntung)',              w: 25, gold: 15, exp: 8,  txt: 'Angin baik berhembus. Peluang datang bagi yang berani melangkah.' },
  { n: 'Chukichi (Cukup Baik)',          w: 35, gold: 8,  exp: 4,  txt: 'Hari yang stabil. Kerja kerasmu akan dihargai.' },
  { n: 'Shokichi (Sedikit Baik)',        w: 25, gold: 3,  exp: 2,  txt: 'Tidak ada yang spektakuler, tapi kejutan kecil menantimu.' },
  { n: 'Suekichi (Baik di Ujung)',       w: 7,  gold: 0,  exp: 0,  txt: 'Awal hari mungkin lambat, tapi sabar akan berbuah di akhir.' },
]
function fortuneOf(u) { return u.fortune && u.fortune.day === today() ? u.fortune : { gold: 0, exp: 0 } }

// ── EXP & LEVEL ──
// BOOST: pengali hadiah global untuk SEMUA sumber (hunt, dungeon, quest, daily, dll). Ubah angka ini kalau mau lebih/kurang.
const BOOST = { exp: 1.5, gold: 1.5 }
// SATU-SATUNYA sumber kebenaran level & rank (dipakai canvas, notif naik level, profil, grup).
function addExp(u, base, opt = {}) {
  const s = stats(u), from = u.level, rPrev = rankOf(from)
  const amt = Math.floor(base * (1 + s.expBonus / 100) * (opt.raw ? 1 : BOOST.exp))
  u.exp += amt; let up = 0
  while (u.level < MAXLV && u.exp >= expNeed(u.level)) { u.exp -= expNeed(u.level); u.level++; u.pts += 3; up++ }
  if (u.level >= MAXLV) u.exp = 0
  if (up) { const n = stats(u); u.hp = n.maxhp; u.mp = n.maxmp }
  const rank = rankOf(u.level)
  save(); return { amt, up, lvl: u.level, from, pts: up * 3, rank, prev: rPrev, rankUp: rank.tier !== rPrev.tier, exp: u.exp, need: expNeed(u.level) }
}
const addGold = (u, base, opt = {}) => { const g = Math.floor(base * (1 + stats(u).goldBonus / 100) * (opt.raw ? 1 : BOOST.gold)); u.gold += g; return g }

// ── INVENTORY ──
const has = (u, id, n = 1) => (u.inv[id] || 0) >= n
const give = (u, id, n = 1) => { u.inv[id] = (u.inv[id] || 0) + n }
const take = (u, id, n = 1) => { u.inv[id] = (u.inv[id] || 0) - n; if (u.inv[id] <= 0) delete u.inv[id] }

// ── COOLDOWN ──
function cooldown(u, key, sec) {
  const left = Math.ceil(((u.cd[key] || 0) + sec * 1000 - Date.now()) / 1000)
  if (left > 0) return left
  u.cd[key] = Date.now(); return 0
}
const dur = (s) => s >= 3600 ? `${Math.floor(s / 3600)}j ${Math.floor((s % 3600) / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}d` : `${s}d`

// ── BATTLE ──
function fight(u, mob) {
  const s = stats(u), c = D.CLASSES[u.cls]
  let hp = u.hp, mp = u.mp, mhp = mob.hp, turn = 0, dealt = 0, taken = 0
  const log = []
  while (hp > 0 && mhp > 0 && turn < 40) {
    turn++
    let dmg = Math.max(1, Math.round(s.atk * (0.85 + Math.random() * 0.3) - mob.def * 0.5)), tag = ''
    if (Math.random() * 100 < s.crit) { dmg = Math.round(dmg * 1.8); tag = ' 💥CRIT' }
    if (turn % 3 === 0 && mp >= 10) {
      mp -= 10; dmg = Math.round(dmg * c.mult); tag = ` ✨${c.skill}`
      if (u.cls === 'priest') hp = Math.min(s.maxhp, hp + Math.round(s.maxhp * 0.12))
    }
    mhp -= dmg; dealt += dmg
    if (turn <= 3) log.push(`➤ Kamu${tag} → ${fmt(dmg)} dmg`)
    if (mhp <= 0) break
    if (Math.random() * 100 < Math.min(30, s.agi * 0.25)) { if (turn <= 3) log.push('➤ Kamu menghindar!'); continue }
    const md = Math.max(1, Math.round(mob.atk * (0.85 + Math.random() * 0.3) - s.defv * 0.5))
    hp -= md; taken += md
    if (turn <= 3) log.push(`➤ ${mob.n} → ${fmt(md)} dmg`)
  }
  const win = mhp <= 0 && hp > 0
  if (turn > 3) log.push(`… (${turn} ronde)`)
  return { win, hp: Math.max(win ? 1 : 0, hp), mp, turns: turn, dealt, taken, log, mobHp: Math.max(0, mhp) }
}
function applyResult(u, r) {
  u.hp = r.hp; u.mp = r.mp
  if (!r.win) { const s = stats(u); u.hp = Math.max(1, Math.floor(s.maxhp * 0.1)); const lost = Math.floor(u.gold * 0.08); u.gold -= lost; return lost }
  return 0
}
// skala monster sesuai level jika di atas min zona
// skala monster: multiplier dasar tiap zona (supaya butuh gear) + naik tipis jika level jauh di atas zona
const BOSS_HP = 0.5, BOSS_ATK = 0.7
const ZONE_MULT = [1.7, 1.8, 1.8, 1.6, 1.55, 1.45, 1.25]
function scaleMob(m, u, zone) {
  const zi = D.ZONES.indexOf(zone), zm = ZONE_MULT[Math.max(0, zi)] || 1
  const f = 1 + Math.max(0, u.level - zone.min) * 0.04
  const isBoss = m === zone.boss, bh = isBoss ? BOSS_HP : 1, ba = isBoss ? BOSS_ATK : 1
  const hpf = zm * f * bh, atkf = (1 + (zm - 1) * 0.8) * f * ba
  return { ...m, hp: Math.floor(m.hp * hpf), atk: Math.floor(m.atk * atkf), def: Math.floor(m.def * (1 + (zm - 1) * 0.5) * f),
    exp: Math.floor(m.exp * (1 + (f - 1) * 0.6)), gold: Math.floor(m.gold * (1 + (f - 1) * 0.6)) }
}
const zoneFor = (u) => { let z = D.ZONES[0]; for (const x of D.ZONES) if (u.level >= x.min) z = x; return z }

// ── BOUNTY & BESTIARY ──
const MILESTONES = [10, 50, 100, 250]
function bounty(u, rin = 0) {
  const now = Date.now()
  if (u.bounty && u.bounty.until < now) u.bounty = null
  return u.bounty
}
function newBounty(u, rin = 0) {
  const zone = zoneFor(u), mob = pick(zone.mobs), need = rnd(6, 12), mult = 1 + rin * 0.04
  u.bounty = { mob: mob.n, e: mob.e, need, have: 0, g: Math.floor(need * mob.gold * 1.6 * mult), x: Math.floor(need * mob.exp * 1.3 * mult), until: Date.now() + 86400000, ticket: Math.random() < 0.3 }
  return u.bounty
}
// dipanggil tiap kill (hunt/dungeon). Mengembalikan teks tambahan.
function killHooks(u, mob, noa = 0) {
  let t = ''
  u.best = u.best || {}; const before = u.best[mob.n] || 0; u.best[mob.n] = before + 1
  const ms = MILESTONES.find(m => before < m && u.best[mob.n] >= m)
  if (ms) { const i = MILESTONES.indexOf(ms) + 1, g = Math.floor((200 * i + ms * 10) * (1 + noa * 0.1)); u.gold += g; t += `\n📖 Bestiary: ${mob.e} ${mob.n} dikalahkan ${ms}x! +${fmt(g)} gold`; if (ms >= 100) { give(u, 'summon_ticket'); t += ' +1 🎟️' } }
  const b = bounty(u)
  if (b && b.mob === mob.n && b.have < b.need) { b.have++; t += `\n📋 Bounty ${b.e} ${b.mob}: ${b.have}/${b.need}${b.have >= b.need ? ' — SELESAI! klaim: .bounty claim' : ''}` }
  return t
}

// ── QUEST ──
function ensureQuests(u) {
  if (u.quest.day === today()) return
  const pool = [...D.QUESTS].sort(() => Math.random() - 0.5).slice(0, 3)
  u.quest = { day: today(), bonus: false, list: pool.map(q => { const need = rnd(q.min, q.max); return { id: q.id, type: q.type, txt: q.txt.replace('%n', need), need, have: 0, g: q.g * need, x: q.x * need, done: false } }) }
}
function track(u, type, n = 1) { ensureQuests(u); for (const q of u.quest.list) if (q.type === type && !q.done) q.have = Math.min(q.need, q.have + n) }

// ── CLAN ──
const clans = () => db.clans
const clanMax = (c) => 10 + c.level * 5
const clanPower = (c) => c.members.reduce((t, j) => t + (db.users[j] ? stats(db.users[j]).power : 0), 0)
const clanUpCost = (c) => 5000 * c.level * c.level

// ── WORLD BOSS ──
const bossPool = [
  { n: 'Tiamat, Dewi Naga Kekacauan', e: '🐉', hp: 60000, atk: 260, def: 90 },
  { n: 'Raja Iblis Beelzebub', e: '👿', hp: 90000, atk: 330, def: 110 },
  { n: 'Leviathan Penguasa Samudra', e: '🦑', hp: 75000, atk: 290, def: 100 },
  { n: 'Fenrir Serigala Akhir Zaman', e: '🐺', hp: 80000, atk: 310, def: 105 },
]
function spawnBoss() { const b = pick(bossPool); db.boss = { ...b, maxhp: b.hp, dmg: {}, born: Date.now(), dead: false }; save(); return db.boss }

module.exports = { BOOST, FORTUNES, fortuneOf, bounty, newBounty, killHooks, MILESTONES, db, save, rnd, pick, fmt, bar, expNeed, MAXLV, rankOf, nextRank, today, create, get, allUsers, stats, addExp, addGold,
  has, give, take, cooldown, dur, fight, applyResult, scaleMob, zoneFor, ensureQuests, track, clans, clanMax, clanPower, clanUpCost, spawnBoss, D }
