// Downloader: #dl (otomatis kenali link), plus jalan pintas per platform
const dl = require('../lib/downloader')

const LABEL = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', web: 'Web' }
const BIG = 45 * 1024 * 1024 // di atas ini dikirim sebagai dokumen

async function handle(ctx, forced, audio = false) {
  const url = dl.extractUrl(ctx.query)
  if (!url) return ctx.reply(`Kirim link-nya, contoh:\n${ctx.prefix}${ctx.command} https://...`)

  // link yang tidak dikenali tetap dicoba lewat yt-dlp (X/Twitter, Pinterest, SoundCloud, Threads, dll.)
  const platform = dl.detect(url) || 'web'
  if (forced && platform !== forced) return ctx.reply(`Itu bukan link ${LABEL[forced]}. Pakai ${ctx.prefix}dl untuk semua platform.`)

  await ctx.react('⏳')
  const res = await dl.download(url, platform, audio)
  const caption = `${res.title ? res.title + '\n\n' : ''}✅ ${LABEL[platform]} • ${ctx.config.botName}`

  let first = true
  for (const f of res.files) {
    const cap = first ? caption : undefined
    first = false
    if (f.type === 'audio') {
      await ctx.send({ audio: f.buffer, mimetype: 'audio/mpeg' })
    } else if (f.type === 'image') {
      await ctx.send({ image: f.buffer, caption: cap })
    } else if (f.buffer.length > BIG) {
      await ctx.send({ document: f.buffer, mimetype: 'video/mp4', fileName: `${platform}.mp4`, caption: cap })
    } else {
      await ctx.send({ video: f.buffer, mimetype: 'video/mp4', caption: cap })
    }
  }
  await ctx.react('✅')
}

module.exports = [
  {
    name: 'dl',
    aliases: ['download', 'unduh'],
    category: 'Downloader',
    usage: '<link>',
    desc: 'TikTok, IG, YouTube, Facebook, dan link lain',
    run: ctx => handle(ctx, null)
  },
  {
    name: 'ytmp3',
    aliases: ['mp3'],
    category: 'Downloader',
    usage: '<link>',
    desc: 'Link YouTube/TikTok jadi audio',
    run: ctx => handle(ctx, null, true)
  },
  { name: 'tiktok', aliases: ['tt'], hidden: true, desc: 'TikTok', run: ctx => handle(ctx, 'tiktok') },
  { name: 'ig', aliases: ['instagram'], hidden: true, desc: 'Instagram', run: ctx => handle(ctx, 'instagram') },
  { name: 'yt', aliases: ['youtube', 'ytmp4'], hidden: true, desc: 'YouTube', run: ctx => handle(ctx, 'youtube') },
  { name: 'fb', aliases: ['facebook'], hidden: true, desc: 'Facebook', run: ctx => handle(ctx, 'facebook') }
]
