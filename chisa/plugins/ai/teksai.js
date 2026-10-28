/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat tulis AI: parafrase, koreksi, formal, gaul, eli5, caption, saran balasan, judul, email
//   .parafrase <teks>  .koreksi  .formal  .gaul  .eli5  .caption  .balasan  .judul  .email   (teks boleh dari reply)
const { B } = require('../../lib/style'), ai = require('../../lib/ai')

const MODES = {
  parafrase: ['Tulis ulang teks dengan kata-kata berbeda tanpa mengubah makna. Berikan 2 versi bernomor.', 'PARAFRASE'],
  koreksi:   ['Perbaiki ejaan, tanda baca, dan tata bahasa teks. Keluarkan: (1) teks yang sudah benar, lalu (2) daftar singkat perubahan penting. Pertahankan gaya penulis.', 'KOREKSI'],
  formal:    ['Ubah teks menjadi bahasa formal/baku yang sopan untuk surat atau pesan kerja. Keluarkan hanya hasilnya.', 'FORMAL'],
  gaul:      ['Ubah teks menjadi bahasa santai ala anak muda Indonesia yang natural, tidak berlebihan. Keluarkan hanya hasilnya.', 'GAUL'],
  eli5:      ['Jelaskan topik/teks berikut seperti kepada anak 5 tahun: analogi sehari-hari, kalimat pendek, maksimal 6 kalimat.', 'ELI5'],
  caption:   ['Buat 4 pilihan caption media sosial (lucu, estetik, singkat, informatif) untuk topik/deskripsi berikut, beserta 5 hashtag relevan di akhir.', 'CAPTION'],
  balasan:   ['Pesan berikut adalah pesan yang DITERIMA pengguna. Berikan 3 saran balasan bernomor dengan nada berbeda: sopan, santai, tegas. Singkat dan siap kirim.', 'SARAN BALASAN'],
  judul:     ['Berikan 6 ide judul menarik (artikel/video/konten) untuk topik berikut, campur gaya: informatif, clickbait halus, pertanyaan.', 'IDE JUDUL'],
  email:     ['Susun email profesional lengkap (Subjek, salam, isi, penutup) dari poin-poin berikut, dalam bahasa Indonesia baku kecuali poin ditulis bahasa lain.', 'EMAIL'],
}
const ALIAS = { parafrase: ['paraphrase', 'tulisulang'], koreksi: ['grammar', 'perbaiki', 'cekejaan'], formal: ['bakukan', 'formalkan'], gaul: ['gaulkan', 'santaikan'], eli5: ['jelaskansimpel', 'anak5'], caption: ['bikincaption', 'captionin'], balasan: ['sarankanbalas', 'balasin'], judul: ['idejudul', 'judulin'], email: ['buatemail', 'draftemail'] }
const LOOK = {}; for (const [k, v] of Object.entries(ALIAS)) { LOOK[k] = k; v.forEach(a => LOOK[a] = k) }

module.exports = {
  name: 'parafrase', alias: Object.keys(LOOK).filter(k => k !== 'parafrase'), category: 'ai', cmds: Object.keys(MODES),
  desc: 'Alat tulis AI: parafrase, koreksi, formal, gaul, eli5, caption, saran balasan, judul, email',
  run: async ({ sock, m, text, command, prefix, reply, isCreator }) => {
    const mode = LOOK[command], [instr, title] = MODES[mode]
    const body = (text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
    if (!body) return reply(`${B(title)}\nKetik: ${prefix}${command} <teks>\natau reply sebuah pesan dengan ${prefix}${command}\n\nPerintah serumpun: ${Object.keys(MODES).map(k => prefix + k).join('  ')}`)
    if (body.length > 3000) return reply('✕ Teks terlalu panjang (maks 3000 karakter).')
    sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
    try {
      const r = await ai.ask({ uid: m.sender, memory: false, sys: `Kamu asisten penulisan yang rapi dan jujur. ${instr}`, text: body })
      return reply(`${B(title)}\n${r.text}`)
    } catch (e) { console.log('[teksai]', e.message, e.details || ''); return reply(`Maaf, AI sedang tidak bisa menjawab. Coba lagi sebentar ya.${isCreator && e.details ? '\n_' + e.details.join('\n') + '_' : ''}`) }
  },
}
