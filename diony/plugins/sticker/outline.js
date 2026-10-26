/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .outline [warna] — beri garis tepi ke stiker/gambar (balas stiker atau kirim gambar). Hasil: stiker dengan garis tepi tebal ala stiker cetak.
const sharp = require('../../lib/sharp.js')
const L = require('../../lib/stickerlib'), K2 = require('../../lib/kreasi2')

module.exports = {
  name: 'outline', alias: ['garistepi', 'bordersticker', 'stikertepi'], category: 'sticker', cmds: ['outline'],
  desc: 'Beri garis tepi berwarna pada stiker atau gambar (default putih)',
  run: async ({ sock, m, args, prefix, reply }) => {
    const media = L.pickMedia(m)
    if (!media || !['sticker', 'image'].includes(media.kind)) return reply(`🖼️ *OUTLINE STIKER*\n\n> Reply stiker/gambar dengan ${prefix}outline [warna]\n> Warna bawaan putih.\n\n*Contoh:* ${prefix}outline kuning`)
    const color = K2.parseColor(args[0]) || '#ffffff'
    L.react(sock, m, '🕕')
    try {
      const buf = await L.download(media)
      if (!buf || !buf.length) throw new Error('Gagal mengunduh media')
      const S = 512, T = 14
      const inner = await sharp(buf, { animated: false }).resize(S - T * 2 - 8, S - T * 2 - 8, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).ensureAlpha().png().toBuffer()
      const pad = await sharp({ create: { width: S, height: S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: inner, gravity: 'centre' }]).png().toBuffer()
      // siluet = alfa → diperlebar (blur + ambang) → diisi warna → lukisan asli di atasnya
      // tiap langkah dipisah (toBuffer) karena sharp mengurutkan operasinya sendiri dalam satu pipeline
      const a0 = await sharp(pad).extractChannel(3).toColourspace('b-w').png().toBuffer()
      const a1 = await sharp(a0).blur(T * 0.7).png().toBuffer()
      const a2 = await sharp(a1).threshold(10).png().toBuffer()
      const alpha = await sharp(a2).blur(1.2).extractChannel(0).raw().toBuffer({ resolveWithObject: true }).then(r => sharp(r.data, { raw: { width: S, height: S, channels: 1 } }))
      const solid = await sharp({ create: { width: S, height: S, channels: 3, background: color } }).joinChannel(await alpha.png().toBuffer()).png().toBuffer()
      const out = await sharp(solid).composite([{ input: pad }]).png().toBuffer()
      await L.sendImageAsSticker(sock, m, out)
      L.react(sock, m, '✅')
    } catch (e) { console.log('[outline]', e.message); L.react(sock, m, '❌'); reply(`❌ *Gagal*\n\n> ${e.message}`) }
  },
}
