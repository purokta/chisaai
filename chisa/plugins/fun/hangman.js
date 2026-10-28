/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .hangman — tebak kata huruf per huruf (7 nyawa). Hiburan murni.
//   .hangman [kategori]  -> mulai   |   .huruf <a-z>  -> tebak huruf   |   .kata <tebakan>  -> tebak seluruh kata   |   .hmenyerah
const ST = require('../../lib/style')
const WORDS = {
  hewan: ['harimau', 'kucing', 'elang', 'kuda nil', 'bunglon', 'kakatua', 'orangutan', 'komodo', 'cicak', 'kupu kupu', 'belalang', 'pinguin', 'kelelawar', 'cumi cumi', 'landak'],
  buah: ['mangga', 'semangka', 'durian', 'rambutan', 'jambu', 'nanas', 'manggis', 'pepaya', 'salak', 'alpukat', 'melon', 'jeruk', 'stroberi', 'anggur', 'leci'],
  negara: ['indonesia', 'jepang', 'brasil', 'mesir', 'argentina', 'malaysia', 'thailand', 'norwegia', 'kanada', 'australia', 'filipina', 'portugal', 'maroko', 'turki', 'vietnam'],
  benda: ['kulkas', 'payung', 'gitar', 'kacamata', 'televisi', 'sepatu', 'lampu', 'jendela', 'kompor', 'sendok', 'gunting', 'bantal', 'sepeda', 'kunci', 'jam dinding'],
  teknologi: ['internet', 'aplikasi', 'komputer', 'keyboard', 'baterai', 'algoritma', 'server', 'browser', 'password', 'database', 'router', 'sensor', 'robot', 'satelit', 'pixel'],
}
const games = new Map()   // chat -> game
const STAGES = ['', '┃', '┃\n┃  O', '┃\n┃  O\n┃  |', '┃\n┃  O\n┃ /|', '┃\n┃  O\n┃ /|\\', '┃\n┃  O\n┃ /|\\\n┃ /', '┃\n┃  O\n┃ /|\\\n┃ / \\']
const show = (g) => g.w.split('').map(c => c === ' ' ? '  ' : g.got.has(c) ? c.toUpperCase() : '_').join(' ')
const status = (g, pre = '') => `${ST.B('HANGMAN')} • ${g.cat}\n━━━━━━━━━━━━━━━━━━━━\n${pre}${STAGES[g.miss] ? '```\n' + STAGES[g.miss] + '\n```\n' : ''}${show(g)}\n\nNyawa: ${'♥'.repeat(7 - g.miss)}${'♡'.repeat(g.miss)}\nSalah: ${[...g.bad].join(' ').toUpperCase() || '-'}`
const done = (g) => g.w.replace(/ /g, '').split('').every(c => g.got.has(c))

module.exports = {
  name: 'hangman', alias: ['huruf', 'kata', 'hmenyerah', 'hmenyerah'], category: 'fun', cmds: ['hangman', 'huruf', 'hmenyerah'], noLimit: true,
  desc: 'Hangman: tebak kata per huruf (.hangman, .huruf <a>, .hmenyerah)',
  run: async ({ m, args, command, prefix, reply }) => {
    const g = games.get(m.chat)
    if (command === 'hmenyerah') { if (!g) return reply('Tidak ada permainan.'); games.delete(m.chat); return reply(`Menyerah? Katanya: *${g.w.toUpperCase()}*`) }
    if (command === 'huruf' || command === 'kata') {
      if (!g) return reply(`Belum ada permainan. Mulai: ${prefix}hangman`)
      const t = args.join(' ').toLowerCase().trim()
      if (!t) return reply(`Contoh: ${prefix}huruf a  atau  ${prefix}kata harimau`)
      if (t.length > 1) {
        if (t === g.w) { games.delete(m.chat); return reply(`${ST.B('BENAR!')} Katanya *${g.w.toUpperCase()}*. Hebat!`) }
        g.miss++
      } else {
        if (!/[a-z]/.test(t)) return reply('Masukkan satu huruf a-z.')
        if (g.got.has(t) || g.bad.has(t)) return reply('Huruf itu sudah ditebak.')
        if (g.w.includes(t)) g.got.add(t); else { g.bad.add(t); g.miss++ }
      }
      if (done(g)) { games.delete(m.chat); return reply(`${ST.B('MENANG!')} Katanya *${g.w.toUpperCase()}*. Mantap!`) }
      if (g.miss >= 7) { games.delete(m.chat); return reply(`${status(g)}\n\n*Kalah.* Katanya: *${g.w.toUpperCase()}*`) }
      return reply(status(g) + `\n\n_${prefix}huruf <a-z>  •  ${prefix}kata <tebakan>_`)
    }
    if (g) return reply(status(g) + `\n\n_Sedang berjalan. ${prefix}huruf <a-z> / ${prefix}hmenyerah_`)
    const cats = Object.keys(WORDS), cat = cats.includes((args[0] || '').toLowerCase()) ? args[0].toLowerCase() : cats[Math.floor(Math.random() * cats.length)]
    const w = WORDS[cat][Math.floor(Math.random() * WORDS[cat].length)]
    const ng = { w, cat, got: new Set(), bad: new Set(), miss: 0 }; games.set(m.chat, ng)
    setTimeout(() => { if (games.get(m.chat) === ng) games.delete(m.chat) }, 15 * 60 * 1000)
    return reply(status(ng) + `\n\n_${prefix}huruf <a-z>  •  ${prefix}kata <tebakan>  •  kategori: ${cats.join(', ')}_`)
  },
}
