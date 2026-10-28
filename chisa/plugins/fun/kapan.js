/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .kapan <pertanyaan> — ramalan waktu acak (hiburan).
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const UNIT = ['detik', 'menit', 'jam', 'hari', 'minggu', 'bulan', 'tahun']
const EXTRA = ['Besok.', 'Nanti malam.', 'Setelah gajian.', 'Pas bulan purnama.', 'Tidak akan pernah 😅', 'Sebentar lagi!', 'Tunggu tanggal mainnya.']

module.exports = {
  name: 'kapan', category: 'fun',
  desc: 'Ramalan waktu acak untuk sebuah pertanyaan',
  run: async ({ m, text, prefix, reply }) => {
    if (!text) return reply(`❓ Contoh: ${prefix}kapan aku kaya`)
    const ans = Math.random() < 0.3 ? pick(EXTRA) : `${1 + Math.floor(Math.random() * 30)} ${pick(UNIT)} lagi.`
    reply(`🔮 *Kapan ${text.trim()}?*\n\n${ans}`)
  },
}
