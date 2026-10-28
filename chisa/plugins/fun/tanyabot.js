/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Tanya Bot: jawaban hiburan untuk pertanyaan iseng. Jawaban konsisten untuk pertanyaan yang sama pada hari yang sama.
//   .apakah <pertanyaan> • .kapankah <pertanyaan> • .siapakah <pertanyaan> (grup) • .berapakah <pertanyaan> • .8ball <pertanyaan>
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const seeded = (arr, seed) => arr[hash(seed) % arr.length]
const YN = ['Ya, pasti.', 'Sepertinya iya.', 'Bisa jadi.', 'Peluangnya besar.', 'Kemungkinannya kecil.', 'Tidak.', 'Jangan terlalu berharap.', 'Tentu saja tidak.', 'Hmm, aku ragu...', '100% yakin!', 'Tanyakan lagi nanti ya.', 'Menurut perhitunganku: iya.']
const BALL = ['Pasti begitu.', 'Tanpa keraguan.', 'Ya, tentu saja.', 'Kamu bisa mengandalkannya.', 'Sepertinya baik.', 'Tanda-tandanya mengarah ke ya.', 'Jawabannya kabur, coba lagi.', 'Tanyakan lagi nanti.', 'Lebih baik tidak kukatakan sekarang.', 'Konsentrasi dan tanya lagi.', 'Jangan berharap begitu.', 'Jawabanku: tidak.', 'Sumberku bilang tidak.', 'Prospeknya kurang bagus.', 'Sangat meragukan.']
const WHEN = (seed) => { const n = 2 + (hash(seed + 'n') % 88); return ['Besok.', 'Minggu depan.', `${n} hari lagi.`, `${1 + (n % 11)} bulan lagi.`, `${1 + (n % 9)} tahun lagi.`, 'Sebentar lagi.', 'Nanti kalau sudah siap.', 'Tidak akan pernah.', 'Hari ini juga!', 'Setelah kamu berhenti menunda-nunda.'] }

module.exports = {
  name: 'apakah', alias: ['kapankah', 'siapakah', 'berapakah', '8ball', 'bolasihir'], category: 'fun', noLimit: true, cmds: ['apakah', 'kapankah', 'siapakah', 'berapakah', '8ball'],
  desc: 'Tanya Bot: .apakah / .kapankah / .siapakah / .berapakah / .8ball — jawaban hiburan',
  run: async ({ sock, m, command, text, prefix, reply, isGroup, groupMetadata }) => {
    const c = command === 'bolasihir' ? '8ball' : command, q = String(text || K.quotedText(m)).trim().replace(/\?+$/, '')
    if (!q) return reply(`🔮 ${B('TANYA BOT')}\n${prefix}apakah dia suka aku\n${prefix}kapankah aku kaya\n${prefix}siapakah yang paling ganteng _(grup)_\n${prefix}berapakah umurku nanti\n${prefix}8ball aku lulus?`)
    const seed = c + '|' + q.toLowerCase() + '|' + K.dayKey(), head = `🔮 ${B('TANYA BOT')}\n❓ ${c} ${q}?\n💬 `
    if (c === 'siapakah') {
      if (!isGroup) return reply('✕ .siapakah hanya bisa dipakai di grup.')
      const ps = ((groupMetadata && groupMetadata.participants) || []).map(p => p.id).filter(Boolean)
      if (!ps.length) return reply('✕ Daftar anggota grup tidak terbaca.')
      const who = seeded(ps, seed)
      return sock.sendMessage(m.chat, { text: `${head}*@${String(who).split('@')[0]}*`, mentions: [who] }, { quoted: m })
    }
    const ans = c === 'apakah' ? seeded(YN, seed) : c === '8ball' ? seeded(BALL, seed) : c === 'kapankah' ? seeded(WHEN(seed), seed)
      : `${hash(seed) % 101}${/persen|%|kemungkinan|peluang|yakin/i.test(q) ? '%' : ''}`
    return reply(`${head}*${ans}*`)
  },
}
