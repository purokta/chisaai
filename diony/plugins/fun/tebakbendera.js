/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tebakbendera — tebak negara dari emoji benderanya. Balas dengan nama negara. Menang = gold RPG.
//   .tebakbendera petunjuk   .tebakbendera nyerah
const R = require('../../lib/rpg')
const ST = require('../../lib/style')
const NEG = {
  ID: ['indonesia'], MY: ['malaysia'], SG: ['singapura', 'singapore'], TH: ['thailand'], VN: ['vietnam'], PH: ['filipina', 'philippines'], BN: ['brunei'], KH: ['kamboja', 'cambodia'], MM: ['myanmar', 'burma'], LA: ['laos'],
  JP: ['jepang', 'japan'], KR: ['korea selatan', 'south korea', 'korea'], KP: ['korea utara', 'north korea'], CN: ['tiongkok', 'china', 'cina'], IN: ['india'], PK: ['pakistan'], BD: ['bangladesh'], LK: ['sri lanka'], NP: ['nepal'],
  SA: ['arab saudi', 'saudi arabia', 'saudi'], AE: ['uni emirat arab', 'emirat arab', 'uea', 'uae'], QA: ['qatar'], KW: ['kuwait'], IR: ['iran'], IQ: ['irak', 'iraq'], TR: ['turki', 'turkey', 'turkiye'], IL: ['israel'], PS: ['palestina', 'palestine'], JO: ['yordania', 'jordan'],
  EG: ['mesir', 'egypt'], MA: ['maroko', 'morocco'], DZ: ['aljazair', 'algeria'], NG: ['nigeria'], ZA: ['afrika selatan', 'south africa'], KE: ['kenya'], ET: ['etiopia', 'ethiopia'], GH: ['ghana'], SN: ['senegal'],
  GB: ['inggris', 'britania raya', 'united kingdom', 'uk'], FR: ['prancis', 'perancis', 'france'], DE: ['jerman', 'germany'], IT: ['italia', 'italy'], ES: ['spanyol', 'spain'], PT: ['portugal'], NL: ['belanda', 'netherlands', 'holland'], BE: ['belgia', 'belgium'], CH: ['swiss', 'switzerland'], AT: ['austria'],
  SE: ['swedia', 'sweden'], NO: ['norwegia', 'norway'], DK: ['denmark'], FI: ['finlandia', 'finland'], PL: ['polandia', 'poland'], GR: ['yunani', 'greece'], UA: ['ukraina', 'ukraine'], RU: ['rusia', 'russia'], IE: ['irlandia', 'ireland'], HR: ['kroasia', 'croatia'],
  US: ['amerika serikat', 'amerika', 'usa', 'united states'], CA: ['kanada', 'canada'], MX: ['meksiko', 'mexico'], BR: ['brasil', 'brazil'], AR: ['argentina'], CL: ['chili', 'chile'], CO: ['kolombia', 'colombia'], PE: ['peru'], CU: ['kuba', 'cuba'],
  AU: ['australia'], NZ: ['selandia baru', 'new zealand'],
}
const flag = (c) => String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const games = new Map() // chat -> { code, answers[], timer }
const stop = (chat) => { const g = games.get(chat); if (g) clearTimeout(g.timer); games.delete(chat) }
const mask = (w) => w.split('').map((c, i) => (c === ' ' || i === 0) ? c : '_').join(' ')

module.exports = {
  name: 'tebakbendera', alias: ['bendera', 'flaggame'], category: 'fun', cmds: ['tebakbendera'],
  desc: 'Tebak negara dari emoji bendera (menang dapat gold RPG)',
  run: async ({ sock, m, reply, args, prefix }) => {
    const sub = String(args[0] || '').toLowerCase(), g = games.get(m.chat)
    if (sub === 'nyerah') { if (!g) return reply('Tidak ada soal yang berjalan.'); stop(m.chat); return reply(`Menyerah? Itu bendera *${g.answers[0]}*`) }
    if (sub === 'petunjuk') { if (!g) return reply('Tidak ada soal yang berjalan.'); return reply(`Petunjuk: ${mask(g.answers[0])}`) }
    if (g) return reply(`Masih ada soal yang berjalan. Jawab dulu, atau ketik ${prefix}tebakbendera nyerah`)
    const codes = Object.keys(NEG), code = codes[Math.floor(Math.random() * codes.length)]
    const ng = { code, answers: NEG[code] }
    ng.timer = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! Itu bendera *${ng.answers[0]}*` }).catch(() => {}) } }, 45000)
    games.set(m.chat, ng)
    await sock.sendMessage(m.chat, { text: `${ST.B('TEBAK BENDERA')}\n━━━━━━━━━━━━━━━━━━━━\nBendera negara apakah ini?\n\n${flag(code)}\n\nWaktu 45 detik  •  Hadiah 120 gold\n_${prefix}tebakbendera petunjuk / nyerah_` }, { quoted: m })
  },
  before: async ({ sock, m, budy }) => {
    const g = games.get(m.chat); if (!g || !budy) return false
    if (!g.answers.some(a => norm(a) === norm(budy))) return false
    stop(m.chat)
    const u = R.get(m.sender); let bonus = '\n_(Buat karakter dengan .rpgstart untuk mendapat hadiah gold)_'
    if (u) { const got = R.addGold(u, 120); R.save(); bonus = `\n+${R.fmt(got)} gold RPG` }
    await sock.sendMessage(m.chat, { text: `Benar! @${m.sender.split('@')[0]} menjawab *${g.answers[0]}* ${flag(g.code)}${bonus}`, mentions: [m.sender] }, { quoted: m })
    return true
  },
}
