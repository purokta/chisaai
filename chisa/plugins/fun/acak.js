/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Hiburan cepat: suit lawan bot, lempar dadu, lempar koin, pilih acak, bola ajaib
//   .suit <batu|gunting|kertas>   .dadu [jumlah 1-6]   .koin   .pilih a | b | c   .tanya <pertanyaan>
const ST = require('../../lib/style')
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const H = (t) => `${ST.B(t)}\n━━━━━━━━━━━━━━━━━━━━\n`

const SUIT = { batu: 'Batu', gunting: 'Gunting', kertas: 'Kertas' }
const WIN = { batu: 'gunting', gunting: 'kertas', kertas: 'batu' }   // kunci mengalahkan nilai
const FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const BALL = ['Tentu saja.', 'Sangat mungkin.', 'Tanda-tandanya mengarah ke ya.', 'Bisa jadi.', 'Tanya lagi nanti.', 'Belum jelas, coba lagi.', 'Jangan terlalu berharap.', 'Jawabanku tidak.', 'Sangat diragukan.', 'Takdir berkata lain.']

module.exports = {
  name: 'suit', alias: ['koin', 'pilih'],   // .dadu dimiliki generatorlive
  category: 'fun', cmds: ['suit', 'koin', 'pilih'],
  desc: 'Mini hiburan: suit lawan bot, dadu, koin, pilih acak, bola ajaib',
  run: async ({ reply, text, command, prefix }) => {
    const t = String(text || '').trim()
    if (command === 'suit') {
      const me = t.toLowerCase()
      if (!SUIT[me]) return reply(`Pilih: batu, gunting, atau kertas.\nContoh: ${prefix}suit batu`)
      const bot = pick(Object.keys(SUIT))
      const res = me === bot ? 'SERI' : WIN[me] === bot ? 'KAMU MENANG' : 'BOT MENANG'
      return reply(`${H('SUIT')}Kamu : ${SUIT[me]}\nBot  : ${SUIT[bot]}\n\n*${res}*`)
    }
    if (command === 'dadu') {
      const n = Math.min(6, Math.max(1, parseInt(t) || 1)), r = Array.from({ length: n }, () => Math.floor(Math.random() * 6))
      return reply(`${H('DADU')}${r.map(x => FACE[x]).join(' ')}\nHasil: ${r.map(x => x + 1).join(' + ')}${n > 1 ? ' = *' + r.reduce((a, b) => a + b + 1, 0) + '*' : ''}`)
    }
    if (command === 'koin') return reply(`${H('KOIN')}Hasil: *${Math.random() < 0.5 ? 'GAMBAR' : 'ANGKA'}*`)
    if (command === 'pilih') {
      const opts = t.split(/[|,]/).map(x => x.trim()).filter(Boolean)
      if (opts.length < 2) return reply(`Beri minimal dua pilihan, pisahkan dengan | atau koma.\nContoh: ${prefix}pilih makan | tidur | main`)
      return reply(`${H('PILIH')}Dari ${opts.length} pilihan, bot memilih:\n*${pick(opts)}*`)
    }
    if (command === 'tanya') {
      if (!t) return reply(`Tulis pertanyaannya.\nContoh: ${prefix}tanya apakah besok hujan?`)
      return reply(`${H('BOLA AJAIB')}${t}\n\n*${pick(BALL)}*`)
    }
  },
}
