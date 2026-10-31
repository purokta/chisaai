const dl = require('../lib/downloader')
const http = require('../lib/http')

const { sendAudio } = require('../lib/audiosend')

module.exports = [
  {
    name: 'play',
    aliases: ['musik', 'lagu'],
    category: 'Musik',
    usage: '<judul lagu>',
    desc: 'Cari & kirim lagu dari YouTube (MP3)',
    async run(ctx) {
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}play judul lagu`)
      await ctx.react('🔎')
      const r = await dl.ytSearch(ctx.query, 4)
      if (!r.length) return ctx.reply('Lagu tidak ditemukan.')
      // coba hasil teratas; kalau gagal (diblokir/khusus login/terlalu panjang) lanjut ke hasil berikutnya
      const mins = d => { const p = String(d || '').split(':').map(Number); return p.some(isNaN) ? 0 : p.reduce((a, x) => a * 60 + x, 0) / 60 }
      const cand = r.filter(v => mins(v.duration) <= 20).concat(r.filter(v => mins(v.duration) > 20)).slice(0, 3)
      const errs = []
      let sent = false
      for (const v of cand) {
        try {
          await ctx.reply(`⏳ 🎵 *${v.title}*\n${v.channel || ''} • ${v.duration || ''}\n\nMengunduh...`)
          const res = await dl.download(v.url, 'youtube', true)
          const f = res.files.find(x => x.type === 'audio') || res.files[0]
          await ctx.send(`🎵 *${v.title}*\n${v.channel || ''} • ${v.duration || ''}`)
          await sendAudio(ctx, f.buffer, v.title)
          sent = true
          break
        } catch (e) { errs.push(String(e?.userMessage || e?.message || e).split('\n')[0].slice(0, 120)); console.log('[play] gagal:', v.url, errs[errs.length - 1]) }
      }
      if (!sent) return ctx.reply('❌ Lagu tidak bisa diunduh sekarang.\n' + errs.map(x => '• ' + x).join('\n') + '\n\nCoba judul lain atau kirim link: ' + ctx.prefix + 'ytmp3 <link>')
      await ctx.react('✅')
    }
  },
  {
    name: 'ytsearch',
    aliases: ['yts'],
    category: 'Musik',
    usage: '<kata>',
    desc: 'Cari video YouTube',
    async run(ctx) {
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}ytsearch lofi`)
      const r = await dl.ytSearch(ctx.query, 6)
      if (!r.length) return ctx.reply('Tidak ada hasil.')
      await ctx.reply(
        r.map((v, i) => `${i + 1}. *${v.title}*\n   ${v.channel || ''} • ${v.duration || ''}\n   ${v.url}`).join('\n\n') +
          `\n\nUnduh: ${ctx.prefix}dl <link>  •  MP3: ${ctx.prefix}ytmp3 <link>`
      )
    }
  },
  {
    name: 'lirik',
    aliases: ['lyrics'],
    category: 'Musik',
    usage: '<judul / artis>',
    desc: 'Cari lirik lagu',
    async run(ctx) {
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}lirik tulus pamit`)
      const r = await http.getJson('https://lrclib.net/api/search?q=' + encodeURIComponent(ctx.query))
      const s = (r || []).find(x => x.plainLyrics)
      if (!s) return ctx.reply('Lirik tidak ditemukan.')
      const text = s.plainLyrics.trim()
      await ctx.reply(`🎤 *${s.trackName}* — ${s.artistName}\n\n${text.length > 3500 ? text.slice(0, 3500) + '\n…' : text}`)
    }
  }
]
