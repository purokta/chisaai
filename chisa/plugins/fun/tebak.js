/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tebak — game tebak-tebakan di chat (acak kata, ibu kota, hitung cepat, peribahasa). Menang = gold RPG + papan skor
const fs = require('fs'), path = require('path')
const R = require('../../lib/rpg')
const ST = require('../../lib/style')

const FILE = path.join(global.chisaData, 'tebak.json')
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} } }
const store = (o) => { try { fs.writeFileSync(FILE, JSON.stringify(o)) } catch (e) { console.log('[tebak] gagal simpan:', e.message) } }

const KATA = { Hewan: ['harimau', 'kucing', 'gajah', 'kelinci', 'burung', 'buaya', 'kambing', 'jerapah', 'kupu', 'cicak'], Buah: ['semangka', 'jeruk', 'mangga', 'durian', 'rambutan', 'pepaya', 'nanas', 'jambu', 'salak', 'manggis'], Benda: ['kursi', 'meja', 'lemari', 'payung', 'kacamata', 'sepatu', 'jendela', 'televisi', 'bantal', 'gitar'], Tempat: ['sekolah', 'pasar', 'bandara', 'stasiun', 'perpustakaan', 'pantai', 'gunung', 'rumah', 'museum', 'taman'], Makanan: ['rendang', 'gudeg', 'bakso', 'sate', 'pempek', 'tempe', 'soto', 'martabak', 'cilok', 'nasi'] }
const IBUKOTA = { Indonesia: 'jakarta', Jepang: 'tokyo', Prancis: 'paris', Inggris: 'london', Jerman: 'berlin', Italia: 'roma', Spanyol: 'madrid', Mesir: 'kairo', Thailand: 'bangkok', Malaysia: 'kuala lumpur', Singapura: 'singapura', Filipina: 'manila', Vietnam: 'hanoi', Korea_Selatan: 'seoul', India: 'new delhi', Tiongkok: 'beijing', Australia: 'canberra', Kanada: 'ottawa', Brasil: 'brasilia', Argentina: 'buenos aires', Rusia: 'moskow', Turki: 'ankara', Arab_Saudi: 'riyadh', Belanda: 'amsterdam', Portugal: 'lisboa', Yunani: 'athena', Kuba: 'havana', Peru: 'lima', Maroko: 'rabat', Kenya: 'nairobi' }
const PERIBAHASA = [['Air beriak tanda ...', 'tak dalam'], ['Tong kosong nyaring ...', 'bunyinya'], ['Sedikit demi sedikit lama-lama jadi ...', 'bukit'], ['Berakit-rakit ke hulu, berenang-renang ke ...', 'tepian'], ['Bagai pinang dibelah ...', 'dua'], ['Ada gula ada ...', 'semut'], ['Di mana bumi dipijak, di situ langit ...', 'dijunjung'], ['Sekali mendayung, dua tiga pulau ...', 'terlampaui'], ['Pagar makan ...', 'tanaman'], ['Nasi sudah menjadi ...', 'bubur'], ['Gajah di pelupuk mata tak tampak, kuman di seberang lautan ...', 'tampak'], ['Seperti katak dalam ...', 'tempurung'], ['Rajin pangkal pandai, hemat pangkal ...', 'kaya'], ['Bersatu kita teguh, bercerai kita ...', 'runtuh'], ['Malu bertanya sesat di ...', 'jalan']]

const rnd = (n) => Math.floor(Math.random() * n), pick = (a) => a[rnd(a.length)]
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const shuffle = (w) => { let r = w; for (let i = 0; i < 20 && r === w; i++) r = w.split('').sort(() => Math.random() - 0.5).join(''); return r }
const MODES = { kata: 'Acak Kata', ibukota: 'Ibu Kota', hitung: 'Hitung Cepat', peribahasa: 'Peribahasa' }
const games = new Map() // chat -> { mode, answers[], hint, reward, until, timer }

function make(mode) {
  if (mode === 'kata') { const cat = pick(Object.keys(KATA)), w = pick(KATA[cat]); return { q: `Susun huruf ini menjadi kata (${cat}):\n\n*${shuffle(w).toUpperCase().split('').join(' ')}*`, a: [w], reward: 150 } }
  if (mode === 'ibukota') { const [n, c] = pick(Object.entries(IBUKOTA)); return { q: `Apa ibu kota *${n.replace(/_/g, ' ')}*?`, a: [c], reward: 120 } }
  if (mode === 'peribahasa') { const [q, a] = pick(PERIBAHASA); return { q: `Lengkapi peribahasa:\n\n*${q}*`, a: [a], reward: 130 } }
  const x = 2 + rnd(30), y = 2 + rnd(30), z = 2 + rnd(9), t = rnd(3)
  const e = [[`${x} + ${y} x ${z}`, x + y * z], [`(${x} + ${y}) x ${z}`, (x + y) * z], [`${x * z} - ${y} + ${z}`, x * z - y + z]][t]
  return { q: `Hitung secepatnya:\n\n*${e[0]} = ?*`, a: [String(e[1])], reward: 100 }
}
const mask = (w) => w.split('').map((c, i) => (c === ' ' || i === 0 || i === w.length - 1) ? c : '_').join(' ')
const stop = (chat) => { const g = games.get(chat); if (g) clearTimeout(g.timer); games.delete(chat) }

function pay(sock, m, g) {
  const who = m.sender, u = R.get(who)
  let bonus = ''
  if (u) { const got = R.addGold(u, g.reward); R.save(); bonus = `\n+${R.fmt(got)} gold RPG` } else bonus = '\n_(Buat karakter dengan .rpgstart untuk mendapat hadiah gold)_'
  const db = load(), k = `${m.chat}`; db[k] = db[k] || {}; db[k][who] = (db[k][who] || 0) + 1; store(db)
  return bonus
}

module.exports = {
  name: 'tebak', alias: ['tebakibukota', 'tebakhitung', 'tebakperibahasa', 'petunjuk', 'skortebak'],
  category: 'fun', cmds: ['tebak', 'petunjuk', 'skortebak'],
  desc: 'Game tebak-tebakan: acak kata, ibu kota, hitung cepat, peribahasa (menang dapat gold RPG)',
  run: async ({ sock, m, reply, text, command, prefix }) => {
    if (command === 'skortebak') {
      const top = Object.entries(load()[m.chat] || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
      if (!top.length) return reply('Belum ada skor di chat ini. Mulai dengan ' + prefix + 'tebak')
      return sock.sendMessage(m.chat, { text: `${ST.B('SKOR TEBAK')}\n━━━━━━━━━━━━━━━━━━━━\n` + top.map(([j, n], i) => `${i + 1}. @${j.split('@')[0]} : ${n} menang`).join('\n'), mentions: top.map(t => t[0]) }, { quoted: m })
    }
    if (command === 'nyerah') {
      const g = games.get(m.chat); if (!g) return reply('Tidak ada soal yang berjalan.')
      stop(m.chat); return reply(`Menyerah? Jawabannya: *${g.a[0]}*`)
    }
    if (command === 'petunjuk') {
      const g = games.get(m.chat); if (!g) return reply('Tidak ada soal yang berjalan.')
      return reply(`Petunjuk: ${mask(g.a[0])}  (${g.a[0].length} huruf)`)
    }
    const alias = { tebakkata: 'kata', tebakibukota: 'ibukota', tebakhitung: 'hitung', tebakperibahasa: 'peribahasa' }
    const mode = alias[command] || norm(text).split(' ')[0]
    if (!MODES[mode]) {
      return reply(`${ST.B('TEBAK-TEBAKAN')}\n━━━━━━━━━━━━━━━━━━━━\n${Object.entries(MODES).map(([k, v]) => `${prefix}tebak ${k}  : ${v}`).join('\n')}\n\nBalas saja dengan jawabanmu di chat (tanpa perintah).\n${prefix}petunjuk  : bantuan huruf\n${prefix}nyerah    : lihat jawaban\n${prefix}skortebak : papan skor chat ini\n\nMenang = gold RPG.`)
    }
    if (games.has(m.chat)) return reply(`Masih ada soal yang berjalan. Jawab dulu, atau ketik ${prefix}nyerah`)
    const g = make(mode); g.mode = mode
    g.timer = setTimeout(() => { if (games.get(m.chat) === g) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! Jawabannya: *${g.a[0]}*` }).catch(() => {}) } }, 60000)
    games.set(m.chat, g)
    await sock.sendMessage(m.chat, { text: `${ST.B('TEBAK ' + MODES[mode].toUpperCase())}\n━━━━━━━━━━━━━━━━━━━━\n${g.q}\n\nWaktu 60 detik  •  Hadiah ${g.reward} gold\n_${prefix}petunjuk untuk bantuan_` }, { quoted: m })
  },
  // dipanggil Chisa untuk setiap pesan non-perintah
  before: async ({ sock, m, budy }) => {
    const g = games.get(m.chat); if (!g || !budy) return false
    if (!g.a.some(a => norm(a) === norm(budy))) return false
    stop(m.chat)
    const bonus = pay(sock, m, g)
    await sock.sendMessage(m.chat, { text: `Benar! @${m.sender.split('@')[0]} menjawab *${g.a[0]}*${bonus}`, mentions: [m.sender] }, { quoted: m })
    return true
  },
}
