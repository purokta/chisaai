/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .anagram — susun huruf acak jadi kata benar. Jawab langsung di chat tanpa perintah. Poin masuk .topgame
//   .anagram [kategori] • .anahint (petunjuk, poin berkurang) • .anamenyerah
const { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const WORDS = {
  hewan: ['harimau', 'kucing', 'elang', 'bunglon', 'kakatua', 'orangutan', 'komodo', 'pinguin', 'kelelawar', 'landak', 'jerapah', 'gajah', 'buaya', 'kelinci', 'lumba'],
  buah: ['mangga', 'semangka', 'durian', 'rambutan', 'jambu', 'nanas', 'manggis', 'pepaya', 'salak', 'alpukat', 'melon', 'jeruk', 'stroberi', 'anggur', 'belimbing'],
  benda: ['kulkas', 'payung', 'gitar', 'kacamata', 'televisi', 'sepatu', 'lampu', 'jendela', 'kompor', 'sendok', 'gunting', 'bantal', 'sepeda', 'kunci', 'cermin'],
  negara: ['indonesia', 'jepang', 'brasil', 'mesir', 'argentina', 'malaysia', 'thailand', 'norwegia', 'kanada', 'australia', 'filipina', 'portugal', 'maroko', 'turki', 'vietnam'],
  teknologi: ['internet', 'aplikasi', 'komputer', 'keyboard', 'baterai', 'algoritma', 'server', 'browser', 'database', 'router', 'sensor', 'robot', 'satelit', 'layar', 'modem'],
}
const games = new Map(), TIME = 90e3
const scramble = (w) => { let s; do { s = E.shuffle(w.split('')).join('') } while (s === w); return s }
const end = (chat) => { const g = games.get(chat); if (g) clearTimeout(g.tm); games.delete(chat) }
const show = (g, pre = '') => `${B('ANAGRAM')} • ${g.cat}\n━━━━━━━━━━━━━━━━━━━━\n${pre}Susun huruf ini:\n\n*${g.s.toUpperCase().split('').join(' ')}*  (${g.w.length} huruf)\n\nWaktu 90 detik. Ketik jawabanmu langsung!\n_.anahint untuk petunjuk • .anamenyerah_`
module.exports = {
  name: 'anagram', alias: ['anahint', 'anamenyerah', 'acakkata'], category: 'ekstra', noLimit: true, cmds: ['anagram', 'anahint', 'anamenyerah'],
  desc: 'Anagram: susun huruf acak jadi kata (.anagram [kategori], .anahint, .anamenyerah)',
  run: async ({ sock, m, args, command, prefix, reply }) => {
    const g = games.get(m.chat)
    if (command === 'anamenyerah') { if (!g) return reply('Tidak ada permainan anagram.'); end(m.chat); return reply(`Menyerah? Jawabannya: *${g.w.toUpperCase()}*`) }
    if (command === 'anahint') {
      if (!g) return reply(`Belum ada permainan. Mulai: ${prefix}anagram`)
      g.hint = Math.min(g.w.length - 1, (g.hint || 0) + 1)
      return reply(`✦ Petunjuk: *${g.w.slice(0, g.hint).toUpperCase()}${' _'.repeat(g.w.length - g.hint)}*\n_Poin kemenangan berkurang._`)
    }
    if (g) return reply(show(g, '(permainan masih berjalan)\n'))
    const cat = Object.keys(WORDS).includes((args[0] || '').toLowerCase()) ? args[0].toLowerCase() : E.rnd(Object.keys(WORDS)), w = E.rnd(WORDS[cat])
    const ng = { w, cat, s: scramble(w), hint: 0 }; ng.tm = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! Jawabannya: *${w.toUpperCase()}*` }).catch(() => {}) } }, TIME)
    games.set(m.chat, ng)
    return reply(show(ng) + `\n_Kategori: ${Object.keys(WORDS).join(', ')}_`)
  },
  before: async ({ m, budy, reply }) => {
    const g = games.get(m.chat); if (!g || !budy || budy.length > 40) return false
    if (E.norm(budy) !== E.norm(g.w)) return false
    const pts = Math.max(3, 10 - (g.hint || 0) * 3); end(m.chat)
    const sc = E.addScore(m.sender, m.pushName, pts, 'anagram')
    await reply(`✦ *${m.pushName || 'Kamu'}* benar! Jawabannya *${g.w.toUpperCase()}*\n+${pts} poin (total ${sc.pts})\n_Main lagi: .anagram • .topgame_`)
    return true
  },
}
