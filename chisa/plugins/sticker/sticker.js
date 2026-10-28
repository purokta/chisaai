/*
 * CHISA-AI | © Pix
 * .s tetap kompatibel; efek premium: --gold --neon --anime --meme --glow, --ai [gaya]
 */
const L = require('../../lib/stickerlib')

function parseOptions(args) {
  const o = { crop: false, resize: null, circle: false, rounded: false, packname: null, author: null, style: null, ai: false }
  for (let i = 0; i < args.length; i++) {
    const a = String(args[i]).toLowerCase()
    if (a === '--crop' || a === '-c') o.crop = true
    else if (a === '--resize' || a === '-r') { if (args[i + 1] && /^\d+x\d+$/i.test(args[i + 1])) o.resize = args[++i] }
    else if (a === '--circle') o.circle = true
    else if (a === '--rounded') o.rounded = true
    else if (['--gold', '--neon', '--anime', '--meme', '--glow'].includes(a)) o.style = a.slice(2)
    else if (a === '--ai') { o.ai = true; if (args[i + 1] && !String(args[i + 1]).startsWith('-')) o.style = String(args[++i]).toLowerCase() }
    else if (!a.startsWith('-') && !o.packname) o.packname = args[i]
    else if (!a.startsWith('-') && o.packname && !o.author) o.author = args[i]
  }
  return o
}

module.exports = {
  name: 'stickergif', menu: ['sticker'], alias: ['stickergif'], category: 'sticker',
  desc: 'Buat stiker gambar/video; efek premium: --gold, --neon, --anime, --meme, --glow, --ai',
  run: async ({ sock, m, args, prefix, reply, isCreator, isPremium }) => {
    const media = L.pickMedia(m)
    if (!media || media.kind === 'sticker') {
      return reply(`🖼️ *CHISA AI STICKER STUDIO*\n\nKirim/reply gambar atau video dengan:\n${prefix}s\n\n*Efek standar*\n> --crop : potong kotak\n> --resize WxH : ubah ukuran\n> --circle : bentuk lingkaran (gambar)\n> --rounded : sudut melengkung (gambar)\n\n*Premium Studio* 💎\n> --gold : bingkai emas\n> --neon : neon cyber\n> --anime : warna anime\n> --meme : tajam untuk meme\n> --glow : glow ungu/biru\n> --ai anime : proses lewat API AI (perlu konfigurasi)\n\n*Contoh:*\n> ${prefix}s --gold\n> ${prefix}s --neon\n> ${prefix}s --ai anime\n> ${prefix}s --crop NamaPack Author\n\nEfek premium hanya untuk owner/premium. Stiker standar tetap gratis.`)
    }
    const o = parseOptions(args)
    if ((o.style || o.ai) && !isCreator && !isPremium) return reply('💎 *PREMIUM STICKER*\nEfek khusus owner/premium. Stiker standar tetap bisa dipakai dengan command `.s` tanpa efek premium.')
    if (o.style && !L.PREMIUM_STYLES.has(o.style)) return reply('Gaya tidak dikenal. Pilih: gold, neon, anime, meme, glow.')
    L.react(sock, m, '🕕')
    try {
      let buf = await L.download(media)
      if (!buf || !buf.length) { L.react(sock, m, '❌'); return reply('❌ Gagal mengunduh media.') }
      const isVideo = media.kind === 'video'
      if (isVideo) {
        const d = await L.videoDuration(buf)
        if (d && d > 10) { L.react(sock, m, '❌'); return reply(`❌ Video terlalu panjang.\n\n> Durasi: ${d.toFixed(1)} detik\n> Maksimal: 10 detik`) }
        if (o.style || o.ai) return reply('Efek Premium Studio saat ini untuk gambar. Video tetap bisa dibuat dengan `.s` standar.')
      }
      if (o.ai) buf = await L.applyAiStyle(buf, o.style || 'anime')
      else if (o.style) buf = await L.applyPremiumStyle(buf, o.style)
      const meta = {}; if (o.packname) meta.packname = o.packname; if (o.author) meta.author = o.author
      const fx = { crop: o.crop, resize: o.resize, circle: o.circle && !isVideo, rounded: o.rounded && !isVideo }
      await (isVideo ? L.sendVideoAsSticker : L.sendImageAsSticker)(sock, m, buf, meta, fx)
      L.react(sock, m, '✅')
    } catch (e) {
      console.log('[s]', e.message); L.react(sock, m, '❌'); reply(`❌ Gagal membuat stiker.\n_${e.message}_`)
    }
  },
}
