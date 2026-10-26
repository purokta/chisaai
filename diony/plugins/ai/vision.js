/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .ocr / .lihat — AI membaca gambar (Gemini): salin teks dari foto, atau jawab pertanyaan tentang gambar
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib'), ai = require('../../lib/ai')

module.exports = {
  name: 'ocr', alias: ['lihat', 'bacagambar', 'jelaskangambar', 'vision', 'scan'], category: 'ai', cmds: ['ocr', 'lihat'],
  desc: 'AI membaca gambar: .ocr salin teks dari foto, .lihat <pertanyaan> jelaskan / jawab soal tentang gambar (reply / kirim foto)',
  run: async ({ sock, m, text, command, prefix, reply, isCreator }) => {
    const isOcr = ['ocr', 'scan', 'bacagambar'].includes(command)
    const media = AJ.pickNode(m, ['image'])
    if (!media) return reply(isOcr ? `${B('OCR')}\nKirim / reply foto dengan ${prefix}${command} untuk menyalin teks di dalamnya (nota, buku, papan, soal).` : `${B('LIHAT')}\nKirim / reply foto dengan:\n${prefix}lihat   (jelaskan isi gambar)\n${prefix}lihat ini makanan apa?\n${prefix}lihat kerjakan soal ini`)
    if (Number(media.node.fileLength) > 15 * 1024 * 1024) return reply('✕ Ukuran gambar maksimal 15 MB.')
    sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
    try {
      const img = await AJ.download(media)
      const prompt = isOcr
        ? 'Salin SEMUA teks yang terlihat pada gambar ini apa adanya, urut dari atas ke bawah, pertahankan baris dan tabel sederhana. Jangan menambah komentar. Jika tidak ada teks, katakan "Tidak ada teks terbaca".'
        : (text || 'Jelaskan isi gambar ini secara singkat dan jelas. Jika ada teks penting, sebutkan.')
      const r = await ai.vision({ image: img, mime: media.mime.split(';')[0] || 'image/jpeg', prompt })
      return reply(`${B(isOcr ? 'HASIL OCR' : 'ANALISIS GAMBAR')}\n${r.text}`)
    } catch (e) { console.log('[vision]', e.message, e.details || ''); return reply(`✕ AI belum bisa membaca gambar ini.${isCreator && e.details ? '\n_' + e.details.slice(0, 3).join('\n') + '_' : ''}`) }
  },
}
