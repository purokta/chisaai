/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// RPG EXTRA — data & bonus untuk skill pasif, gelar, rebirth, dan party.
// Dipanggil dari R.stats() (lib/rpg.js). JANGAN require('./rpg') di level atas (circular) — pakai lazy require.

// ── SKILL PASIF: tiap skill maks Lv.5, biaya Lv.n = n poin ──
const SKILLS = {
  tebasan:  { n: 'Ketajaman Bilah',   e: 'ATK',  per: 3,   key: 'atk',  unit: '% ATK',  desc: 'Serangan makin mematikan' },
  kulit:    { n: 'Kulit Baja',        e: 'DEF',  per: 3,   key: 'def',  unit: '% DEF',  desc: 'Pertahanan makin keras' },
  vital:    { n: 'Vitalitas Naga',    e: 'HP',   per: 4,   key: 'hp',   unit: '% HP',   desc: 'Nyawa lebih tebal' },
  elang:    { n: 'Mata Elang',        e: 'CRIT', per: 1.5, key: 'crit', unit: '% crit', desc: 'Peluang kritikal naik' },
  pemburu:  { n: 'Insting Pemburu',   e: 'EXP',  per: 4,   key: 'exp',  unit: '% EXP',  desc: 'EXP buruan makin besar' },
  saudagar: { n: 'Naluri Saudagar',   e: 'GOLD', per: 4,   key: 'gold', unit: '% gold', desc: 'Gold buruan makin besar' },
}
const SKILL_MAX = 5
const skillLv = (u, id) => Math.min(SKILL_MAX, ((u.sk || {})[id]) || 0)
const spentPts = (u) => Object.values(u.sk || {}).reduce((t, l) => t + (l * (l + 1)) / 2, 0)
const totalPts = (u) => (u.spBase || 0) + Math.floor(u.level / 2) + (u.rebirth || 0) * 6   // spBase = poin dari level sebelum rebirth (tidak hilang)
const freePts = (u) => Math.max(0, totalPts(u) - spentPts(u))
const costOf = (lv) => lv + 1   // naik dari lv ke lv+1 butuh (lv+1) poin

// ── REBIRTH ──
const REBIRTH_MAX = 10, REBIRTH_LV = 100
const rebirthCost = (n) => 50000 * (n + 1)
const rebirthBonus = (u) => { const n = u.rebirth || 0; return { atk: n * 5, def: n * 5, hp: n * 5, exp: n * 3, gold: n * 3 } }

// ── PARTY ──
const PARTY_MAX = 5
function partyOf(u) {
  const R = require('./rpg')
  const id = u && u.party; if (!id) return null
  const p = (R.db.parties || {})[id]
  if (!p || !p.members.includes(u.id)) { u.party = null; return null }
  return p
}
const partyBonus = (u) => { const p = partyOf(u); const n = p ? p.members.length : 0; return n > 1 ? { exp: (n - 1) * 4, gold: (n - 1) * 2 } : { exp: 0, gold: 0 } }

// bonus gabungan dalam persen — dipakai R.stats()
function bonus(u) {
  const o = { atk: 0, def: 0, hp: 0, crit: 0, exp: 0, gold: 0 }
  for (const [id, sk] of Object.entries(SKILLS)) { const l = skillLv(u, id); if (l) o[sk.key] += l * sk.per }
  const rb = rebirthBonus(u), pb = partyBonus(u)
  o.atk += rb.atk; o.def += rb.def; o.hp += rb.hp; o.exp += rb.exp + pb.exp; o.gold += rb.gold + pb.gold
  return o
}

// ── GELAR ── (kosmetik; tampil di profil & sambutan otomatis)
const clanLeader = (u) => { const R = require('./rpg'); const c = u.clan && R.db.clans[u.clan]; return !!c && c.leader === u.id }
const TITLES = {
  pemula:   { n: 'Petualang Baru',            hint: 'Gelar awal',                  ok: () => true },
  pembantai:{ n: 'Pembantai Monster',         hint: 'Kill 100 monster',            ok: (u) => u.kills >= 100 },
  jagoan:   { n: 'Jagoan Arena',              hint: 'Menang 20 duel',              ok: (u) => u.wins >= 20 },
  veteran:  { n: 'Penakluk Dungeon',          hint: 'Lantai terbaik 25+',          ok: (u) => u.bestFloor >= 25 },
  sultan:   { n: 'Sultan Guild',              hint: 'Total gold 1.000.000+',       ok: (u) => u.gold + ((u.bank && u.bank.bal) || 0) >= 1000000 },
  petani:   { n: 'Dewa Panen',                hint: 'Panen 100 kali',              ok: (u) => (u.farm && u.farm.harvests || 0) >= 100 },
  bayangan: { n: 'Bayangan Pasar Gelap',      hint: 'Rob sukses 15 kali',          ok: (u) => (u.robWins || 0) >= 15 },
  pahlawan: { n: 'Sang Pahlawan',             hint: 'Rank A (Lv.50)',              ok: (u) => u.level >= 50 },
  legenda:  { n: 'Pahlawan Legendaris',       hint: 'Rank S (Lv.70)',              ok: (u) => u.level >= 70 },
  penakluk: { n: 'Penakluk Bencana',          hint: 'Rank SS (Lv.90)',             ok: (u) => u.level >= 90 },
  raja:     { n: 'Pembunuh Raja Iblis',       hint: 'Rank SSS (Lv.120)',           ok: (u) => u.level >= 120 },
  mythic:   { n: 'Penguasa Mitos',            hint: 'Rank EX (Lv.150)',            ok: (u) => u.level >= 150 },
  reborn:   { n: 'Jiwa yang Terlahir Kembali',hint: 'Rebirth 1x',                  ok: (u) => (u.rebirth || 0) >= 1 },
  samsara:  { n: 'Roda Samsara Abadi',        hint: 'Rebirth 5x',                  ok: (u) => (u.rebirth || 0) >= 5 },
  pemimpin: { n: 'Pemimpin Clan',             hint: 'Jadi leader clan',            ok: (u) => clanLeader(u) },
}
// gelar yang pernah terbuka tetap dimiliki (u.tt) — jadi tidak hilang saat rebirth mereset level
const unlocked = (u) => { u.tt = u.tt || {}; return Object.keys(TITLES).filter(k => { if (u.tt[k]) return true; if (TITLES[k].ok(u)) { u.tt[k] = 1; return true } return false }) }
const titleOf = (u) => (u.title && TITLES[u.title] && unlocked(u).includes(u.title)) ? TITLES[u.title].n : null

module.exports = { SKILLS, SKILL_MAX, skillLv, spentPts, totalPts, freePts, costOf, REBIRTH_MAX, REBIRTH_LV, rebirthCost, rebirthBonus, PARTY_MAX, partyOf, partyBonus, bonus, TITLES, unlocked, titleOf }
