/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// AI: tanya jawab, terjemah, ringkas (Groq + Gemini, fallback otomatis)
const ai = require('../../lib/ai')

const typing = (sock, m) => sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
const fail = (e, isCreator, reply) => {
  console.log('[ai]', e.message, e.details || '')
  reply(`Maaf, AI sedang tidak bisa menjawab. Coba lagi sebentar ya.${isCreator ? '\n\n_Detail (owner):_\n' + (e.details && e.details.length ? e.details.map(x => '- ' + x).join('\n') : '- ' + e.message) : ''}`)
}

module.exports = {
  name: 'ai',
  alias: ['ask', 'chisa', 'aiclear', 'resetai', 'translate', 'tr', 'terjemah', 'ringkas', 'summarize', 'rangkum'],
  category: 'ai',
  cmds: ['ai', 'aiclear', 'translate', 'ringkas', 'aistatus', 'guildmaster'],
  desc: 'Tanya AI, terjemahkan, ringkas teks (reply pesan juga bisa)',
  run: async (ctx) => {
    const { sock, m, reply, text, args, command, prefix, isCreator } = ctx
    const quoted = (m.quoted && (m.quoted.text || m.quoted.caption)) || ''
    const uid = m.sender

    if (['aiclear', 'resetai'].includes(command)) { ai.clear(uid); return reply('Ingatan percakapan AI kamu sudah dihapus.') }

    if (['translate', 'tr', 'terjemah'].includes(command)) {
      const lang = (args[0] || '').toLowerCase()
      const body = args.slice(1).join(' ') || quoted
      if (!lang || !body) return reply(`Contoh:\n${prefix}translate en Selamat pagi\n${prefix}translate id (sambil reply pesan asing)\n\nKode bahasa: en, id, ja, ko, ar, zh, es, fr, de, dll.`)
      await typing(sock, m)
      try {
        const r = await ai.ask({ uid, memory: false, text: `Terjemahkan teks berikut ke bahasa dengan kode/nama "${lang}". Balas HANYA hasil terjemahan tanpa penjelasan.\n\n${body}` })
        return reply(r.text)
      } catch (e) { return fail(e, isCreator, reply) }
    }

    if (['ringkas', 'summarize', 'rangkum'].includes(command)) {
      const body = text || quoted
      if (!body || body.length < 80) return reply(`Reply pesan panjang lalu ketik ${prefix}ringkas, atau:\n${prefix}ringkas <teks panjang>`)
      await typing(sock, m)
      try {
        const r = await ai.ask({ uid, memory: false, text: `Ringkas teks berikut menjadi poin-poin penting (maksimal 6 poin, bahasa sama dengan teksnya):\n\n${body}` })
        return reply(`*RINGKASAN*\n\n${r.text}`)
      } catch (e) { return fail(e, isCreator, reply) }
    }

    // .ai / .ask / .tanya / .pix
    // permintaan gambar lewat chat biasa ("buatkan gambar ...", foto + "ganti latar jadi pantai") → Gemini gambar (plugins/kreasi/aigambar.js)
    if (text && ['ai', 'ask', 'chisa'].includes(command)) {
      let it = null, IG = null
      try { IG = require('../kreasi/aigambar'); it = IG.intent(text, !!require('../../lib/ajaib').pickNode(m, ['image'])) } catch (e) { console.log('[ai gambar intent]', e.message) }
      if (it) return IG.chat(ctx, it)
    }
    const q = text || quoted
    if (!q) return reply(`Tanya apa saja ke AI.\nContoh: ${prefix}ai kenapa langit biru?\n\nAI mengingat percakapan 30 menit. Hapus: ${prefix}aiclear`)
    await typing(sock, m)
    try {
      const prompt = text && quoted ? `Konteks (pesan yang dibalas):\n"""${quoted.slice(0, 1500)}"""\n\nPertanyaan: ${text}` : q
      const r = await ai.ask({ uid, text: prompt })
      // jawaban berisi kode → blok native WhatsApp ("Lihat kode": layar penuh berwarna, bisa scroll & salin)
      if (await require('../../lib/codeblock').sendAnswer(sock, m, r.text)) return
      return reply(r.text)
    } catch (e) { return fail(e, isCreator, reply) }
  },
}
