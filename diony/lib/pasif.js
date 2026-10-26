/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// lib/pasif.js — ENGINE FITUR PASIF DIONYSUS (v4.8.0)
// Fitur yang HIDUP TANPA COMMAND: bot membaca pesan biasa (non-perintah) lalu bereaksi sendiri.
// Dipasang lewat hook `before` milik plugins/group/pasif.js; pengaturan lewat command `.pasif`.
//
//   • Pengaturan disimpan per chat (grup) di lib/database/pasif.json.
//   • Fitur MODERASI (menghapus pesan) hanya menyentuh anggota biasa, dan hanya menghapus bila bot admin grup.
//   • SEMUA fitur pasif KHUSUS GRUP: tidak ada balasan otomatis ke chat pribadi (mengurangi risiko akun diblokir).
//   • handle() mengembalikan true HANYA bila pesan dihapus (supaya hook plugin lain tidak ikut memproses pesan itu).
//   • Tidak ada isi pesan yang disimpan: hanya penghitung (milestone), jeda (cooldown) di memori, dan cache link pendek.
const DB = require('./jsondb')('pasif')
const J = require('./jid')
const S = require('./settingsdb')

const D = DB.data
D.chats = D.chats || {}; D.global = D.global || {}; D.count = D.count || {}; D.since = D.since || {}; 

// ───────────────────────── util ─────────────────────────
const mem = new Map()                                  // cooldown di memori
const cool = (key, ms) => { const n = Date.now(), t = mem.get(key) || 0; if (n - t < ms) return false; mem.set(key, n); if (mem.size > 5000) for (const [k, v] of mem) if (n - v > 3600000) mem.delete(k); return true }
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const num = (n) => Number(n).toLocaleString('id-ID')
const tag = (jid) => '@' + String(jid).split('@')[0].split(':')[0]
const hour = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: S.get('timezone') || 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date())) % 24
const react = (c, emoji) => c.sock.sendMessage(c.m.chat, { react: { text: emoji, key: c.m.key } }).catch(() => {})
const del = (c) => c.sock.sendMessage(c.m.chat, { delete: c.m.key }).catch(() => {})
const say = (c, text, mentions) => c.sock.sendMessage(c.m.chat, mentions ? { text, mentions } : { text }, { quoted: c.m })
const exempt = (c) => c.isAdmins || c.isCreator || c.isDev                      // moderasi tidak menyentuh admin/owner
const canDelete = (c) => c.isGroup && c.isBotAdmins && !exempt(c)

// ───────────────────────── 1. kalkulator otomatis ─────────────────────────
// Parser aritmetika murni (tanpa eval). Mendukung + - * / ^ ( ) % dan angka format Indonesia (1.500,25).
function parseNumber(s) {
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'))      // 1.500.000 / 1.500,5
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return parseFloat(s.replace(/,/g, ''))                           // 1,500.5
  if (/^\d+[.,]\d+$/.test(s)) return parseFloat(s.replace(',', '.'))
  return parseFloat(s)
}
function calc(raw) {
  let s = String(raw || '').toLowerCase().replace(/÷/g, '/').replace(/(?<=[\d)%])\s*[x×]\s*(?=[\d(])/g, '*').replace(/\s+/g, '')
  if (!s || s.length > 60 || /[^0-9.,+\-*/^()%]/.test(s)) return null
  const tok = []
  for (let i = 0; i < s.length;) {
    const ch = s[i]
    if (/\d/.test(ch)) { let j = i; while (j < s.length && /[\d.,]/.test(s[j])) j++; let t = s.slice(i, j); if (/[.,]$/.test(t)) { t = t.slice(0, -1); j-- } const v = parseNumber(t); if (!Number.isFinite(v)) return null; tok.push({ n: v }); i = j }
    else if ('+-*/^()%'.includes(ch)) { tok.push({ o: ch }); i++ }
    else return null
  }
  let p = 0, steps = 0
  const peek = () => tok[p], isO = (o) => tok[p] && tok[p].o === o
  const fail = () => { throw new Error('x') }
  function expr() { let v = term(); while (isO('+') || isO('-')) { const o = tok[p++].o; const r = term(); v = o === '+' ? v + r : v - r } return v }
  function term() { let v = power(); while (isO('*') || isO('/')) { const o = tok[p++].o; const r = power(); if (o === '/' && r === 0) fail(); v = o === '*' ? v * r : v / r } return v }
  function power() { const b = unary(); if (isO('^')) { p++; const e = power(); if (Math.abs(e) > 100) fail(); return Math.pow(b, e) } return b }
  function unary() { if (isO('-')) { p++; return -unary() } if (isO('+')) { p++; return unary() } return post() }
  function post() { let v = prim(); while (isO('%')) { p++; v = v / 100 } return v }
  function prim() { if (++steps > 200) fail(); const t = peek(); if (!t) fail(); if (t.n !== undefined) { p++; return t.n } if (t.o === '(') { p++; const v = expr(); if (!isO(')')) fail(); p++; return v } fail() }
  try { const v = expr(); if (p !== tok.length || !Number.isFinite(v) || Math.abs(v) >= 1e15) return null; return v } catch { return null }
}
function looksLikeMath(t) {
  t = String(t || '').trim()
  if (t.length < 3 || t.length > 60 || !/^[\d\s.,+\-*/x×÷^%()]+$/i.test(t) || /^[x×]|[x×]$/i.test(t)) return false
  if ((t.match(/\d+(?:[.,]\d+)*/g) || []).length < 2) return false
  if (/^\+?\d[\d\s-]{7,}$/.test(t) && !/[+*/^x×÷()%]/.test(t.replace(/^\+/, ''))) return false               // nomor telepon
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(t)) return false                                               // tanggal
  const ops = t.replace(/\d+(?:[.,]\d+)*/g, '').replace(/[\s()]/g, '')
  if (!ops) return false
  if (/^[-/]+$/.test(ops) && !/\s[-/]\s|\(/.test(t)) return false                                             // "3-1" / "1/2" bukan hitungan; "10 - 3" ya
  return true
}
const fmtNum = (v) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 8 }).format(Math.round(v * 1e9) / 1e9)
async function autohitung(c) {
  if (!looksLikeMath(c.text)) return false
  const v = calc(c.text); if (v === null || !cool('hit:' + c.m.chat, 3000)) return false
  const shown = c.text.trim().replace(/\s+/g, ' ').replace(/\*/g, '×')
  await say(c, `🧮 ${shown} = *${fmtNum(v)}*`); return false
}

// ───────────────────────── 2. salam & sapaan ─────────────────────────
const RE_SALAM = /^\s*(a?ss?alamu'?\s?-?alaikum|asalamualaikum|assalamu'?alaikum|assalamualaikum|salam)(\s+(wr\.?|warahmatullah(i)?)(\s+wb\.?|\s+wabarakatuh)?)?\s*(semua|all|guys|bot|dionysus|kak|gaes|gais)?\s*[.!]*\s*$/i
const RE_WAAL = /^\s*(wa'?alaikum\s?-?(u?ss?alam)?|walaikumsalam|waalaikumsalam)/i
const RE_WAKTU = /^\s*(selamat\s+(pagi|siang|sore|malam)|met\s+(pagi|siang|sore|malam)|good\s+(morning|afternoon|evening|night))\s*(semua|all|guys|bot|dionysus|kak|gaes|gais|everyone)?\s*[.!]*\s*$/i
async function salam(c) {
  const t = c.text; if (t.length > 60) return false
  if (RE_SALAM.test(t) && !RE_WAAL.test(t)) {
    if (!cool('salam:' + c.m.chat, 120000)) return false
    await say(c, pick(["Wa'alaikumussalam warahmatullahi wabarakatuh 🙏", "Wa'alaikumussalam wr. wb. 🙏", "Wa'alaikumussalam, semoga harimu penuh berkah 🙏"])); return false
  }
  const mm = t.match(RE_WAKTU)
  if (mm) {
    if (!cool('sapa:' + c.m.chat, 300000)) return false
    const h = hour(), real = h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam'
    const word = (mm[2] || mm[3] || '').toLowerCase().replace('morning', 'pagi').replace('afternoon', 'siang').replace('evening', 'sore').replace('night', 'malam')
    const tail = { pagi: 'Semangat memulai hari! ☀️', siang: 'Jangan lupa makan siang ya 🍛', sore: 'Semoga harimu menyenangkan 🌇', malam: 'Jangan lupa istirahat ya 🌙' }[real]
    await say(c, `Selamat ${real}${(c.m.pushName && c.m.pushName !== 'no name') ? ', ' + c.m.pushName : ''}! ${tail}${word && word !== real ? `\n_(sekarang sudah ${real}, lho)_` : ''}`)
  }
  return false
}

// ───────────────────────── 3. reaksi otomatis ─────────────────────────
const REACTS = [
  [/\b(w[kx]{2,}[wkx]*|wkwk\w*|haha+h*|hehe+|hihi+|lol|lmao|ngakak|kocak)\b/i, '😂'],
  [/\b(makasih|terima\s?kasih|thanks|thx|tengkyu|trims|suwun|matur nuwun)\b/i, '🙏'],
  [/\b(mantap|mantul|keren|gokil|josss*|top\s?banget|sip+|asik+)\b/i, '🔥'],
  [/\b(selamat|congrats|alhamdulillah|hore+|yeay+)\b/i, '🎉'],
  [/\b(sedih|nangis|huhu+|hiks+|kangen|capek banget|lelah)\b/i, '🫂'],
  [/\b(ulang\s?tahun|ultah|hbd|happy birthday)\b/i, '🎂'],
  [/\b(astaghfirullah|innalillahi|inna lillahi|turut berduka)\b/i, '🤲'],
  [/\b(bismillah|insyaallah|insya allah|aamiin|amin)\b/i, '🤲'],
  [/\b(lapar|laper|makan dulu|ngemil)\b/i, '🍽️'],
]
async function autoreact(c) {
  if (c.text.length < 2 || c.text.length > 400) return false
  const hit = REACTS.find(([re]) => re.test(c.text)); if (!hit || !cool('react:' + c.m.chat, 25000)) return false
  await react(c, hit[1]); return false
}

// ───────────────────────── 4. petunjuk tautan unduhan (Mori Downloader) ─────────────────────────
const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi
const PLAT = [
  [/(^|\.)tiktok\.com$/, 'TikTok', 'tiktok'], [/(^|\.)instagram\.com$/, 'Instagram', 'igdl'], [/(^|\.)(facebook\.com|fb\.watch|fb\.com)$/, 'Facebook', 'fbdl'],
  [/(^|\.)(twitter\.com|x\.com)$/, 'Twitter / X', 'twdl'], [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube', 'dl'], [/(^|\.)spotify\.com$/, 'Spotify', 'spotifydl'],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, 'Pinterest', 'pinterestdl'], [/(^|\.)threads\.(net|com)$/, 'Threads', 'threadsdl'], [/(^|\.)(bilibili\.com|b23\.tv)$/, 'Bilibili', 'bilibilidl'],
  [/(^|\.)douyin\.com$/, 'Douyin', 'douyindl'], [/(^|\.)(xiaohongshu\.com|xhslink\.com)$/, 'RedNote', 'rednotedl'], [/(^|\.)pixiv\.net$/, 'Pixiv', 'pixivdl'],
  [/(^|\.)bandcamp\.com$/, 'Bandcamp', 'bandcampdl'], [/(^|\.)music\.apple\.com$/, 'Apple Music', 'applemusicdl'],
]
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase() } catch { return '' } }
async function linkhint(c) {
  const urls = (c.text.match(URL_RE) || []).slice(0, 3); if (!urls.length) return false
  const pl = require('./pluginloader')
  for (const u of urls) {
    const h = hostOf(u), hit = PLAT.find(([re]) => re.test(h)); if (!hit) continue
    if (!cool('lh:' + c.m.chat, 45000) || !cool('lhu:' + c.m.sender + u, 600000)) return false
    const cmd = pl.get(hit[2]) ? hit[2] : 'dl'
    await say(c, `🔗 Tautan *${hit[1]}* terdeteksi.\nUnduh medianya: *${c.prefix}${cmd} ${u.length > 70 ? u.slice(0, 70) + '…' : u}*`); return false
  }
  return false
}

// ───────────────────────── 5. bongkar link pendek ─────────────────────────
const SHORT = /(^|\.)(bit\.ly|tinyurl\.com|s\.id|cutt\.ly|shorturl\.at|rebrand\.ly|is\.gd|v\.gd|ow\.ly|rb\.gy|tiny\.cc|t\.ly|lnkd\.in|shorturl\.asia|bitly\.com|s\.shopee\.co\.id)$/
const SUS_TLD = /\.(xyz|top|click|zip|mov|tk|gq|cf|ml|ga|icu|buzz|cam|rest|monster)$/
const privHost = (h) => { h = h.toLowerCase().replace(/^\[|\]$/g, ''); return h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h === '::1' }
const unmaskCache = new Map()
async function expand(url) {
  let cur = url; const chain = [cur]
  for (let i = 0; i < 6; i++) {
    const u = new URL(cur); if (!/^https?:$/.test(u.protocol) || privHost(u.hostname)) throw new Error('internal')
    try { await require('./shield').assertSafeUrl(cur) } catch { throw new Error('unsafe') }
    const o = { redirect: 'manual', signal: AbortSignal.timeout(6000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; Chisa AI)' } }
    let r = await fetch(cur, { ...o, method: 'HEAD' }); if ([403, 405, 501].includes(r.status)) r = await fetch(cur, { ...o, method: 'GET' })
    const loc = r.headers.get('location'); if (r.status >= 300 && r.status < 400 && loc) { cur = new URL(loc, cur).href; chain.push(cur) } else break
  }
  return chain
}
async function unmask(c) {
  const u = (c.text.match(URL_RE) || []).find(x => SHORT.test(hostOf(x))); if (!u) return false
  if (!cool('um:' + c.m.chat, 20000)) return false
  let chain = unmaskCache.get(u)
  if (!chain) { try { chain = await expand(u) } catch { return false } unmaskCache.set(u, chain); if (unmaskCache.size > 300) unmaskCache.delete(unmaskCache.keys().next().value) }
  if (chain.length < 2) return false
  const fin = chain[chain.length - 1], h = hostOf(fin), sus = SUS_TLD.test(h) || /^xn--|\.xn--/.test(h) || /^\d+\.\d+\.\d+\.\d+$/.test(h)
  await say(c, `🔎 *Tautan pendek dibuka*\nTujuan: *${h}*\n${fin.length > 140 ? fin.slice(0, 140) + '…' : fin}${sus ? '\n⚠️ _Domain tujuan tampak mencurigakan — hati-hati sebelum membuka._' : ''}`); return false
}

// ───────────────────────── 6. bot dipanggil ─────────────────────────
async function botmention(c) {
  const ids = new Set(J.botIds(c.sock).map(J.strip)), men = (c.m.mentionedJid || []).map(J.strip)
  const name = String(S.get('botname') || 'Chisa AI').replace(/[^\w ]/g, '').trim()
  const byTag = men.some(x => ids.has(x)), byName = new RegExp(`\\b(${['chisa', name].filter(Boolean).map(s => s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i').test(c.text) && c.text.length < 80
  if (!byTag && !byName) return false
  if (!cool('bm:' + c.m.chat + c.m.sender, 30000)) return false
  await say(c, pick([`Hadir! 👋 Ketik *${c.prefix}menu* untuk melihat semua fitur.`, `Ya? Aku di sini. Coba *${c.prefix}allmenu* untuk daftar lengkap fitur.`, `Dipanggil nih~ Butuh bantuan? *${c.prefix}menu* ya.`, `Siap! Ketik *${c.prefix}pasif* untuk melihat fitur otomatis yang aktif di chat ini.`])); return false
}

// ───────────────────────── 7. milestone grup ─────────────────────────
const MILES = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
async function milestone(c) {
  const k = c.m.chat; D.since[k] = D.since[k] || new Date().toISOString().slice(0, 10)
  const n = D.count[k] = (D.count[k] || 0) + 1; DB.save()
  if (!MILES.includes(n)) return false
  await c.sock.sendMessage(k, { text: `🎉 *MILESTONE GRUP!*\nGrup ini baru saja mencapai *${num(n)} pesan* sejak dicatat bot (${D.since[k]}).\nTerima kasih sudah membuat grup ini hidup! 🔥` }); return false
}

// ───────────────────────── 8. bantuan sticker otomatis ─────────────────────────
async function autosticker(c) {
  const m = c.m, mt = m.mtype; if (mt !== 'imageMessage' && mt !== 'videoMessage') return false
  const node = m.msg || {}; if (node.viewOnce || (c.isGroup && String(node.caption || '').trim())) return false
  if (mt === 'videoMessage' && Number(node.seconds || 0) > 8) return false
  if (Number(node.fileLength || 0) > 8 * 1048576) return false
  if (!cool('as:' + m.sender, 8000)) return false
  const L = require('./stickerlib')
  try {
    const buf = await L.download({ kind: mt === 'imageMessage' ? 'image' : 'video', node }); if (!buf || !buf.length) return false
    await (mt === 'imageMessage' ? L.sendImageAsSticker : L.sendVideoAsSticker)(c.sock, m, buf, {}, {})
  } catch (e) { console.log('[pasif autosticker]', e.message) }
  return false
}

// ───────────────────────── 9. pengingat huruf kapital ─────────────────────────
async function anticaps(c) {
  if (exempt(c)) return false
  const letters = c.text.replace(/[^A-Za-z]/g, ''); if (letters.length < 25) return false
  if (letters.replace(/[^A-Z]/g, '').length / letters.length < 0.75 || !cool('caps:' + c.m.chat + c.m.sender, 300000)) return false
  await say(c, pick(['Santai, nggak perlu teriak 😄 Huruf kapitalnya dikurangi ya.', 'Pelan-pelan, CAPS LOCK-nya lagi nyala kayaknya 😅', 'Tenang dulu, nggak ada yang ngejar kok 😄'])); return false
}

// ───────────────────────── MODERASI ─────────────────────────
// 11. antivirtex — pesan raksasa / banjir karakter tak terlihat / zalgo yang bisa membuat WhatsApp lambat atau crash
const ZW = /[\u200b-\u200f\u2060-\u2064\u202a-\u202e\u2066-\u2069\ufeff\u180e]/g, MARKS = /\p{M}/gu
function virtexScore(t) {
  const why = []
  if (t.length > 4000) why.push('teks terlalu panjang')
  if ((t.match(ZW) || []).length > 100) why.push('banjir karakter tak terlihat')
  if ((t.match(MARKS) || []).length > 120 && (t.match(MARKS) || []).length / Math.max(t.length, 1) > 0.3) why.push('karakter bertumpuk (zalgo)')
  if (/(.)\1{299,}/su.test(t)) why.push('karakter berulang ratusan kali')
  return why
}
async function antivirtex(c) {
  if (!canDelete(c) || c.text.length < 150) return false
  const why = virtexScore(c.text); if (!why.length) return false
  await del(c); await c.sock.sendMessage(c.m.chat, { text: `🛡️ Pesan dari ${tag(c.m.sender)} dihapus (${why[0]}).`, mentions: [c.m.sender] }).catch(() => {}); return true
}
// 12. antiulang — pesan identik berulang
const rep = new Map()
async function antiulang(c) {
  if (!canDelete(c)) return false
  const norm = c.text.toLowerCase().replace(/\s+/g, ' ').trim(); if (norm.length < 3) return false
  const k = c.m.chat + '|' + c.m.sender, now = Date.now(), h = (rep.get(k) || []).filter(x => now - x.t < 30000 && x.s === norm); h.push({ t: now, s: norm }); rep.set(k, h)
  if (rep.size > 3000) rep.delete(rep.keys().next().value)
  if (h.length < 4) return false
  await del(c); if (cool('ulang:' + k, 30000)) await c.sock.sendMessage(c.m.chat, { text: `⚠️ ${tag(c.m.sender)} jangan kirim pesan yang sama berulang-ulang ya.`, mentions: [c.m.sender] }).catch(() => {}); return true
}
// 13. antitagmassal — mention puluhan orang sekaligus
async function antitagmassal(c) {
  if (!canDelete(c)) return false
  const n = Math.max((c.m.mentionedJid || []).length, (c.text.match(/@\d{5,}/g) || []).length); if (n < 15) return false
  await del(c); await c.sock.sendMessage(c.m.chat, { text: `⚠️ ${tag(c.m.sender)} dilarang mention massal (${n} orang). Pesan dihapus.`, mentions: [c.m.sender] }).catch(() => {}); return true
}
// 14. antipromo — tautan promosi (wa.me, t.me, discord) dari anggota biasa
const PROMO = /(?:https?:\/\/)?(?:wa\.me\/|wa\.link\/|t\.me\/|telegram\.me\/|discord\.gg\/|discord(?:app)?\.com\/invite\/)\S+/i
async function antipromo(c) {
  if (!canDelete(c) || !PROMO.test(c.text)) return false
  await del(c); await c.sock.sendMessage(c.m.chat, { text: `⚠️ ${tag(c.m.sender)} tautan promosi (wa.me / t.me / discord) tidak diizinkan di grup ini.`, mentions: [c.m.sender] }).catch(() => {}); return true
}
// 15. jagadata — NIK / nomor kartu kredit
const PROV = new Set([11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 31, 32, 33, 34, 35, 36, 51, 52, 53, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 76, 81, 82, 91, 92, 93, 94, 95, 96, 97])
const luhn = (d) => { let s = 0, alt = false; for (let i = d.length - 1; i >= 0; i--) { let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9 } s += n; alt = !alt } return s % 10 === 0 }
function validNik(d) { if (!/^\d{16}$/.test(d) || !PROV.has(+d.slice(0, 2))) return false; let day = +d.slice(6, 8); if (day > 40) day -= 40; return day >= 1 && day <= 31 && +d.slice(8, 10) >= 1 && +d.slice(8, 10) <= 12 }
function sensitive(t) {
  for (const x of t.match(/(?<!\d)\d{16}(?!\d)/g) || []) if (validNik(x)) return 'NIK'
  for (const x of t.match(/(?<!\d)(?:\d[ -]?){14,18}\d(?!\d)/g) || []) { const d = x.replace(/\D/g, ''); if (d.length >= 15 && d.length <= 16 && /^(4|5[1-5]|2[2-7]|3[47]|35)/.test(d) && luhn(d)) return 'nomor kartu' }
  return null
}
async function jagadata(c) {
  if (c.isCreator && !c.isGroup) return false
  const what = sensitive(c.text); if (!what) return false
  if (canDelete(c)) { await del(c); await c.sock.sendMessage(c.m.chat, { text: `🔒 Pesan ${tag(c.m.sender)} dihapus karena memuat *${what}*. Jangan bagikan data pribadi di grup.`, mentions: [c.m.sender] }).catch(() => {}); return true }
  if (cool('data:' + c.m.chat, 60000)) await c.sock.sendMessage(c.m.chat, { text: `🔒 ${tag(c.m.sender)}, pesanmu tampak memuat *${what}*. Sebaiknya hapus pesannya demi keamananmu.`, mentions: [c.m.sender] }).catch(() => {})
  return false
}

// ───────────────────────── DAFTAR FITUR ─────────────────────────
// def: boolean | (isGroup)=>boolean · scope: 'group' | 'group' | 'private' · global: pengaturan satu bot (owner)
const FEATURES = [
  // moderasi dulu (bisa menghapus pesan), lalu fitur interaktif
  { key: 'antivirtex', title: 'Anti Virtex', group: 'Keamanan', scope: 'group', def: false, mod: true, run: antivirtex, desc: 'Hapus pesan raksasa / banjir karakter tak terlihat / zalgo yang membuat WhatsApp lag (bot harus admin).' },
  { key: 'antiulang', title: 'Anti Pesan Berulang', group: 'Keamanan', scope: 'group', def: false, mod: true, run: antiulang, desc: 'Hapus pesan identik yang dikirim 4x+ dalam 30 detik (bot harus admin).' },
  { key: 'antitagmassal', title: 'Anti Tag Massal', group: 'Keamanan', scope: 'group', def: false, mod: true, run: antitagmassal, desc: 'Hapus pesan yang me-mention 15+ orang sekaligus (bot harus admin).' },
  { key: 'antipromo', title: 'Anti Promosi', group: 'Keamanan', scope: 'group', def: false, mod: true, run: antipromo, desc: 'Hapus tautan wa.me / t.me / discord dari anggota biasa (bot harus admin).' },
  { key: 'jagadata', title: 'Penjaga Data Pribadi', group: 'Keamanan', scope: 'group', def: false, mod: true, run: jagadata, desc: 'Deteksi NIK & nomor kartu kredit yang dikirim ke grup: hapus (bot admin) atau beri peringatan.' },
  { key: 'anticaps', title: 'Pengingat Huruf Kapital', group: 'Keamanan', scope: 'group', def: false, mod: true, run: anticaps, desc: 'Pengingat ramah bila pesan panjang ditulis dengan HURUF KAPITAL semua (tidak menghapus).' },
  { key: 'salam', title: 'Auto Salam & Sapaan', group: 'Sosial', scope: 'group', def: true, run: salam, desc: "Balas salam (assalamu'alaikum) dan sapaan waktu (selamat pagi/siang/sore/malam) otomatis." },
  { key: 'botmention', title: 'Respon Dipanggil', group: 'Sosial', scope: 'group', def: true, run: botmention, desc: 'Bot menjawab saat di-tag atau namanya disebut, lengkap dengan petunjuk menu.' },
  { key: 'autoreact', title: 'Reaksi Otomatis', group: 'Sosial', scope: 'group', def: false, run: autoreact, desc: 'Beri reaksi emoji pada pesan tertentu (wkwk, makasih, mantap, selamat, ulang tahun, dll).' },
  { key: 'milestone', title: 'Milestone Grup', group: 'Sosial', scope: 'group', def: true, run: milestone, desc: 'Rayakan otomatis saat grup mencapai 100 / 500 / 1.000 / 5.000 pesan dan seterusnya.' },
  { key: 'autohitung', title: 'Kalkulator Otomatis', group: 'Utilitas', scope: 'group', def: true, run: autohitung, desc: 'Ketik rumus seperti 12*5+3 atau 1.500.000 x 12 — bot langsung menjawab hasilnya.' },
  { key: 'linkhint', title: 'Petunjuk Unduh Tautan', group: 'Utilitas', scope: 'group', def: false, run: linkhint, desc: 'Deteksi tautan TikTok / IG / YouTube / FB / X / Spotify dll lalu tunjukkan command unduhnya.' },
  { key: 'unmask', title: 'Pembuka Link Pendek', group: 'Utilitas', scope: 'group', def: true, run: unmask, desc: 'Bongkar bit.ly / tinyurl / s.id dan tampilkan domain tujuan asli (+ peringatan bila mencurigakan).' },
  { key: 'autosticker', title: 'Auto Stiker', group: 'Utilitas', scope: 'group', def: false, run: autosticker, desc: 'Gambar / video pendek (maks 8 detik) yang dikirim langsung dijadikan stiker (di grup: hanya yang tanpa caption).' },
]
const BY = Object.fromEntries(FEATURES.map(f => [f.key, f]))
const defOf = (f, isGroup) => (typeof f.def === 'function' ? !!f.def(isGroup) : !!f.def)
const isOn = (chat, key, isGroup = chat.endsWith('@g.us')) => { const f = BY[key]; if (!f) return false; if (f.global) return key in D.global ? !!D.global[key] : defOf(f, isGroup); const c = D.chats[chat]; return c && key in c ? !!c[key] : defOf(f, isGroup) }
function set(chat, key, val) { const f = BY[key]; if (!f) return false; if (f.global) D.global[key] = !!val; else (D.chats[chat] = D.chats[chat] || {})[key] = !!val; DB.save(); return true }
function reset(chat) { delete D.chats[chat]; DB.save() }
const master = () => D.global.master !== false
const setMaster = (v) => { D.global.master = !!v; DB.save() }
const aliasOf = (k) => { k = String(k || '').toLowerCase().replace(/[^a-z]/g, ''); if (BY[k]) return k; const m = { virtex: 'antivirtex', ulang: 'antiulang', tag: 'antitagmassal', tagmassal: 'antitagmassal', promo: 'antipromo', data: 'jagadata', nik: 'jagadata', caps: 'anticaps', kapital: 'anticaps', sapaan: 'salam', sapa: 'salam', panggil: 'botmention', mention: 'botmention', react: 'autoreact', reaksi: 'autoreact', mile: 'milestone', hitung: 'autohitung', kalkulator: 'autohitung', calc: 'autohitung', link: 'linkhint', unduh: 'linkhint', hint: 'linkhint', pendek: 'unmask', shortlink: 'unmask', stiker: 'autosticker', sticker: 'autosticker' }; return m[k] || null }
const list = (chat, isGroup) => FEATURES.filter(f => f.scope === 'any' || (f.scope === 'group' ? isGroup : !isGroup)).map(f => ({ ...f, on: isOn(chat, f.key, isGroup) }))

async function handle(ctx) {
  const m = ctx.m; if (!m || m.key.fromMe || !master() || !ctx.isGroup) return false   // KHUSUS GRUP: bot tidak pernah membalas chat pribadi secara otomatis (menghindari risiko ban)
  const c = { ...ctx, text: String(ctx.budy || ''), prefix: ctx.prefix || '.' }
  for (const f of FEATURES) {
    if (f.scope === 'group' && !c.isGroup) continue
    if (f.scope === 'private' && c.isGroup) continue
    if (!isOn(m.chat, f.key, c.isGroup)) continue
    try { if (await f.run(c)) return true } catch (e) { console.log('[pasif]', f.key, e.message) }
  }
  return false
}

module.exports = { FEATURES, BY, handle, isOn, set, reset, master, setMaster, aliasOf, list, defOf, calc, looksLikeMath, sensitive, validNik, luhn, virtexScore, parseNumber, SHORT, PLAT, DB }
