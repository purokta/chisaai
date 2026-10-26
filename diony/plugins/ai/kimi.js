/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kimi: asisten koding berpersona gadis (Moonshot AI)
const kimi = require('../../lib/kimi')

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const typing = (sock, m) => sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
const EXT = { js: 'js', javascript: 'js', node: 'js', ts: 'ts', typescript: 'ts', py: 'py', python: 'py', php: 'php', java: 'java', c: 'c', cpp: 'cpp', 'c++': 'cpp', cs: 'cs', csharp: 'cs', go: 'go', rust: 'rs', rs: 'rs', html: 'html', css: 'css', json: 'json', sql: 'sql', sh: 'sh', bash: 'sh', kotlin: 'kt', kt: 'kt', swift: 'swift', rb: 'rb', ruby: 'rb', lua: 'lua', yaml: 'yml', yml: 'yml', xml: 'xml', md: 'md' }
const FILE_MIN = 2200 // blok kode sepanjang ini dikirim juga sebagai file, supaya mudah disalin

const fail = (e, isCreator, reply) => {
  console.log('[kimi]', e.message, e.details || '')
  reply(`Maaf kak, aku lagi nggak bisa jawab nih. Coba lagi sebentar ya.${isCreator ? '\n\n_Detail (owner):_\n' + (e.details && e.details.length ? e.details.map(x => '- ' + x).join('\n') : '- ' + e.message) : ''}`)
}

module.exports = {
  name: 'kimi',
  alias: ['koding', 'kode', 'code', 'coding', 'ngoding', 'kimiclear', 'kimireset'],
  category: 'ai',
  cmds: ['kimi', 'kimiclear'],
  desc: 'Kimi, gadis jago ngoding: tulis, perbaiki, jelaskan, dan review kode',
  run: async ({ sock, m, reply, text, command, prefix, isCreator }) => {
    const uid = 'kimi:' + m.sender
    if (['kimiclear', 'kimireset'].includes(command)) { kimi.clear(uid); return reply('Oke kak, ingatan percakapan koding kita sudah aku hapus. Mulai dari awal lagi ya.') }

    const quoted = (m.quoted && (m.quoted.text || m.quoted.caption)) || ''
    if (!text && !quoted) {
      return reply(`Hai kak, aku Kimi. Aku bantu soal koding.\n\nContoh:\n${prefix}kimi buatkan fungsi JavaScript untuk cek bilangan prima\n${prefix}kimi kenapa kode ini error? (sambil reply pesan berisi kode)\n${prefix}kimi ubah kode ini ke Python (sambil reply kode)\n\nAku ingat percakapan 60 menit. Hapus: ${prefix}kimiclear`)
    }
    await typing(sock, m)
    try {
      const prompt = text && quoted ? `Kode / teks yang dibalas:\n"""\n${quoted.slice(0, 8000)}\n"""\n\nPermintaan: ${text}` : (text || `Tolong review dan jelaskan kode ini:\n"""\n${quoted.slice(0, 8000)}\n"""`)
      const r = await kimi.ask({ uid, text: prompt })
      // Jawaban berisi kode → kirim sebagai blok kode NATIVE WhatsApp (kotak "Lihat kode", ketuk untuk layar penuh berwarna).
      // Matikan lewat global.codeNative = false di config.js. Gagal kirim → CB.sendRich otomatis jatuh ke teks biasa.
      let sentNative = false
      if (global.codeNative !== false && /```/.test(r.raw || '')) {
        const CB = require('../../lib/codeblock'), segs = []
        let pos = 0
        for (const mt of String(r.raw).matchAll(/```([\w+#.-]*)[ \t]*\n([\s\S]*?)```/g)) {
          const before = String(r.raw).slice(pos, mt.index).trim()
          if (before) segs.push({ text: kimi.wa(before) })
          segs.push({ code: mt[2].replace(/\n$/, ''), lang: CB.normLang(mt[1]) || CB.detectLang(mt[2]) })
          pos = mt.index + mt[0].length
        }
        const tail = String(r.raw).slice(pos).trim(); if (tail) segs.push({ text: kimi.wa(tail) })
        if (segs.length && segs.length <= 40) { await CB.sendRich(sock, m, segs); sentNative = true }
      }
      const parts = sentNative ? [] : kimi.chunk(r.text)
      for (let i = 0; i < parts.length; i++) {
        await sock.sendMessage(m.chat, { text: parts[i] }, i === 0 ? { quoted: m } : {})
        if (i < parts.length - 1) await sleep(600)
      }
      // kode panjang: kirim juga sebagai file
      const big = kimi.codeBlocks(r.raw).filter(b => b.code.length >= FILE_MIN).sort((a, b) => b.code.length - a.code.length)[0]
      if (big) {
        const ext = EXT[big.lang] || 'txt'
        await sock.sendMessage(m.chat, { document: Buffer.from(big.code, 'utf8'), mimetype: 'text/plain', fileName: `kimi-kode.${ext}` }, { quoted: m })
      }
    } catch (e) { return fail(e, isCreator, reply) }
  },
}
