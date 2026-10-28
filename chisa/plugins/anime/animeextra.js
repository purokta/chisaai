/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// ANIME EXTRA — gambar anime, kutipan, dan pelacak adegan
//   .animegambar [kategori]   gambar anime acak aman (waifu, neko, shinobu, megumin, hug, pat, smile, wave, dance, ...)
//   .animequote               kutipan anime acak
//   .animescene               reply screenshot anime -> tebak judul, episode, dan menit adegannya (trace.moe)
const axios = require('axios'), ST = require('../../lib/style'), AJ = require('../../lib/ajaib')
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const CMDS = ['animegambar', 'animequote', 'animescene']
const ALIAS = { waifu: 'animegambar', neko: 'animegambar', animepic: 'animegambar', animeimg: 'animegambar', kutipananime: 'animequote', quoteanime: 'animequote', tracemoe: 'animescene', carianimedarigambar: 'animescene', whatanime: 'animescene', sceneanime: 'animescene' }
const KAT = ['waifu', 'neko', 'shinobu', 'megumin', 'hug', 'cuddle', 'pat', 'smile', 'wave', 'happy', 'blush', 'wink', 'dance', 'poke', 'highfive', 'handhold', 'nom', 'smug', 'cry']
const mmss = (s) => { s = Math.round(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

module.exports = {
  name: 'animeextra', alias: Object.keys(ALIAS).filter(k => k !== 'waifu').concat(CMDS), category: 'anime', cmds: CMDS, noLimit: false,   // .waifu dimiliki gacha RPG (summon), jadi tidak lagi jadi alias di sini
  desc: 'Anime: gambar acak aman, kutipan, dan pelacak judul dari screenshot (trace.moe)',
  run: async ({ sock, m, reply, text, prefix, command }) => {
    const cmd = ALIAS[command] || command, q = String(text || '').trim().toLowerCase()
    try {
      if (cmd === 'animegambar') {
        const kat = KAT.includes(q) ? q : KAT.includes(command) ? command : (q ? null : command === 'neko' ? 'neko' : 'waifu')
        if (!kat) return reply(`${ST.B('GAMBAR ANIME')}\n${LINE}\nKategori: ${KAT.join(', ')}\nContoh: ${prefix}animegambar neko`)
        const { data } = await axios.get(`https://api.waifu.pics/sfw/${kat}`, { timeout: 15000 })
        if (!data || !data.url) throw new Error('gambar tidak tersedia')
        return sock.sendMessage(m.chat, { image: { url: data.url }, caption: `${ST.B(kat.toUpperCase())}\n_Ulangi: ${prefix}animegambar ${kat}_` }, { quoted: m })
      }
      if (cmd === 'animequote') {
        const { data } = await axios.get('https://api.animechan.io/v1/quotes/random', { timeout: 12000 }), d = data && data.data
        if (!d || !d.content) throw new Error('server kutipan sedang tidak merespons')
        const t = d.content, who = d.character && d.character.name, from = d.anime && d.anime.name
        return reply(`${ST.B('KUTIPAN ANIME')}\n${LINE}\n“${t}”\n\n— ${who || '?'}${from ? ', ' + from : ''}`)
      }
      // animescene
      const media = AJ.pickNode(m, ['image'])
      if (!media) return reply(`${ST.B('LACAK ADEGAN ANIME')}\n${LINE}\nKirim / reply *screenshot adegan anime* dengan ${prefix}animescene\n_Pakai tangkapan layar utuh tanpa teks/watermark agar akurat._`)
      await sock.sendMessage(m.chat, { react: { text: '🕕', key: m.key } }).catch(() => {})
      const buf = await AJ.download(media)
      const { data } = await axios.post('https://api.trace.moe/search?anilistInfo&cutBorders', buf, { headers: { 'Content-Type': media.mime || 'image/jpeg' }, timeout: 40000, maxBodyLength: Infinity })
      const r = (data.result || []).find(x => !(x.anilist && x.anilist.isAdult))
      if (!r) { sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {}); return reply('Adegan tidak dikenali. Coba screenshot yang lebih jelas.') }
      const t = (r.anilist && r.anilist.title) || {}, sim = (r.similarity * 100).toFixed(1)
      const cap = [ST.B('ADEGAN DITEMUKAN'), LINE, `Judul    : ${t.english || t.romaji || r.filename}`, t.native ? `Judul JP : ${t.native}` : '', `Episode  : ${r.episode != null ? r.episode : '-'}`, `Menit    : ${mmss(r.from)} – ${mmss(r.to)}`, `Kemiripan: ${sim}%${r.similarity < 0.87 ? '  _(rendah, bisa jadi salah)_' : ''}`, '', `_Detail: ${prefix}anime ${t.romaji || t.english || ''}_`].filter(x => x !== '').join('\n')
      sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
      if (r.video) { try { return await sock.sendMessage(m.chat, { video: { url: r.video + (r.video.includes('?') ? '&' : '?') + 'size=m' }, caption: cap, gifPlayback: false }, { quoted: m }) } catch {} }
      return reply(cap)
    } catch (e) { console.log('[animeextra]', e.message); return reply('Gagal: ' + (e.response && e.response.status === 429 ? 'terlalu banyak permintaan, coba lagi sebentar' : e.message)) }
  },
}
