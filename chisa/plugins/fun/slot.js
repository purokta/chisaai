/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .slot — mesin slot bergambar hieroglif (hiburan murni, tidak memakai gold RPG)
const ST = require('../../lib/style')
const SYM = ['✦', '✦', '✦', '✦', '✦', '✦']
const pick = () => SYM[Math.floor(Math.random() * SYM.length)]
module.exports = {
  name: 'slot', alias: ['slots', 'mesinslot'], category: 'fun', cmds: ['slot'], noLimit: true,
  desc: 'Mesin slot hieroglif: tiga simbol sama = jackpot',
  run: async ({ reply, pushname }) => {
    const r = [pick(), pick(), pick()], same = new Set(r).size
    const res = same === 1 ? '*JACKPOT!* Tiga simbol sama. Dewa anggur tersenyum padamu.' : same === 2 ? 'Hampir! Dua simbol sama, coba sekali lagi.' : 'Belum beruntung. Putar lagi, anggur masih banyak.'
    return reply(`${ST.B('MESIN SLOT')}\n━━━━━━━━━━━━━━━━━━━━\n[ ${r.join(' | ')} ]\n\n${pushname}: ${res}`)
  },
}
