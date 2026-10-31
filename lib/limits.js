// Ban pengguna + batas pemakaian harian + anti-spam. Owner dan VIP tidak kena batas.
const db = require('./db')
const config = require('../config')

const numOf = j => String(j || '').split('@')[0].split(':')[0].replace(/\D/g, '')

// perintah ini tidak memakai jatah harian
const FREE = new Set([
  'menu', 'help', 'bantuan', 'start', 'status', 'stats', 'info', 'owner', 'creator', 'pemilik', 'ping', 'myid',
  'daily', 'login', 'absen', 'claim', 'checkin', 'gacha', 'pull', 'gachaanime', 'koleksi', 'collection', 'karakter',
  'limit', 'inv', 'inventory', 'tas', 'harga', 'buah', 'hargabuah', 'topbuah', 'topkoin', 'hint', 'nyerah', 'skip', 'skor', 'leaderboard', 'menumusik', 'musikmenu',
  'inv', 'inventory', 'tas', 'harga', 'buah', 'hargabuah', 'topbuah', 'topkoin'
])

const bannedSet = () => new Set((db.get('banned', []) || []).map(String))
const isBanned = nums => {
  const b = bannedSet()
  return nums.some(n => n && b.has(String(n)))
}

function ban(n) {
  const list = [...bannedSet()]
  if (!list.includes(n)) list.push(n)
  db.set('banned', list)
}
function unban(n) {
  db.set('banned', [...bannedSet()].filter(x => x !== n))
}

let dayFmt, dayAt = 0, dayVal = ''
function today() {
  const now = Date.now()
  if (dayVal && now - dayAt < 30000) return dayVal // dihitung ulang tiap 30 dtk saja (pembuatan Intl mahal di HP)
  const tz = config.menu?.timezone || 'Asia/Jakarta'
  dayFmt = dayFmt || new Intl.DateTimeFormat('en-CA', { timeZone: tz })
  dayAt = now
  return (dayVal = dayFmt.format(new Date())) // YYYY-MM-DD
}
const dailyLimit = () => Number(db.get('limitDaily', config.limit?.daily ?? 100))

function usageOf(who) {
  const u = db.get('usage', {})
  if (u.date !== today()) return 0
  return u.counts?.[who] || 0
}

const last = new Map()

// null = boleh; { silent: true } = abaikan; { text } = tolak dengan pesan
function check(ctx, cmd) {
  if (ctx.isOwner || ctx.isVip || cmd.free) return null
  const names = [cmd.name, ...(cmd.aliases || [])]
  if (names.some(n => FREE.has(n))) return null

  const who = numOf(ctx.sender)
  const now = Date.now()
  const gap = config.limit?.cooldownMs ?? 1200
  if (now - (last.get(who) || 0) < gap) return { silent: true }
  last.set(who, now)

  const max = dailyLimit()
  if (max <= 0) return null
  const u = db.get('usage', {})
  const data = u.date === today() ? u : { date: today(), counts: {} }
  const used = data.counts[who] || 0
  if (used >= max) return { text: `⛔ Limit harian habis (${used}/${max}).\nReset otomatis jam 00:00 WIB.` }
  data.counts[who] = used + 1
  db.set('usage', data)
  return null
}

module.exports = { FREE, numOf, isBanned, ban, unban, bannedSet, check, dailyLimit, usageOf }
