/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .stt / .transkrip — ubah voice note, audio, atau video jadi teks (Groq Whisper, cadangan Fish ASR)
//   .stt [kode bahasa]        reply media; contoh .stt id   |   tambah "ringkas" untuk langsung diringkas AI: .stt ringkas
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib'), STT = require('../../lib/stt'), ai = require('../../lib/ai')
const extOf = (mime) => /ogg|opus/.test(mime) ? 'ogg' : /mpeg|mp3/.test(mime) ? 'mp3' : /mp4|m4a|aac/.test(mime) ? (mime.startsWith('video') ? 'mp4' : 'm4a') : /wav/.test(mime) ? 'wav' : /webm/.test(mime) ? 'webm' : 'bin'

module.exports = {
  name: 'stt', alias: ['transkrip', 'transcribe', 'vn2teks', 'suaraketeks'], category: 'ai', cmds: ['stt'],
  desc: 'Ubah voice note / audio / video jadi teks (reply); tambah "ringkas" untuk diringkas AI',
  run: async ({ sock, m, args, prefix, reply, isCreator }) => {
    const media = AJ.pickNode(m, ['audio', 'video'])
    if (!media) return reply(`${B('SUARA KE TEKS')}\nReply voice note / audio / video dengan:\n${prefix}stt\n${prefix}stt id   (paksa bahasa Indonesia)\n${prefix}stt ringkas   (sekalian diringkas)`)
    if (Number(media.node.seconds) > 600) return reply('✕ Durasi maksimal 10 menit.')
    if (Number(media.node.fileLength) > 25 * 1024 * 1024) return reply('✕ Ukuran file maksimal 25 MB.')
    const wantSum = args.some(a => /^ringkas|rangkum$/i.test(a)), lang = (args.find(a => /^[a-z]{2}$/i.test(a)) || '').toLowerCase()
    sock.sendMessage(m.chat, { react: { text: '🕕', key: m.key } }).catch(() => {})
    try {
      const src = await AJ.download(media)
      const mp3 = await AJ.runFF(src, extOf(media.mime), 'mp3', ['-vn', '-t', '600', '-ac', '1', '-ar', '16000', '-b:a', '32k', '-f', 'mp3'])
      const r = await STT.transcribe(mp3, 'mp3', lang)
      if (!r.text) throw new Error('Tidak ada ucapan yang terdeteksi.')
      let out = `${B('TRANSKRIP')}\n${r.text}`
      if (wantSum && r.text.length > 120) { try { out += `\n\n${B('RINGKASAN')}\n` + (await ai.ask({ uid: m.sender, memory: false, text: `Ringkas transkrip suara berikut menjadi poin-poin penting (maksimal 6 poin, bahasa sama dengan teksnya):\n\n${r.text.slice(0, 6000)}` })).text } catch {} }
      sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
      return reply(out.slice(0, 4000))
    } catch (e) { sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {}); console.log('[stt]', e.message); return reply(`✕ Gagal membuat transkrip.${isCreator ? '\n_' + e.message + '_' : ''}`) }
  },
}
