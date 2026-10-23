// Image enhancer: perbesar 2x, kurangi noise, pertajam, sedikit warna. Jalan di HP (ffmpeg), tanpa API.
const fs = require('fs')
const { run, tmpPath, rm } = require('../lib/ffmpeg')

async function enhance(buffer, maxSide) {
  const input = tmpPath('img')
  const output = tmpPath('jpg')
  fs.writeFileSync(input, buffer)
  // sisi terpanjang x2 (maks maxSide), tidak pernah memperkecil gambar
  const grow = d => `max(${d},min(${maxSide},${d}*2))`
  const vf =
    `scale=w='if(gte(iw,ih),${grow('iw')},-2)':h='if(gte(iw,ih),-2,${grow('ih')})':flags=lanczos,` +
    'hqdn3d=2:1.5:3:3,unsharp=5:5:0.9:5:5:0.0,eq=contrast=1.05:saturation=1.12'
  try {
    await run('ffmpeg', ['-y', '-i', input, '-vf', vf, '-frames:v', '1', '-q:v', '2', output])
    return fs.readFileSync(output)
  } finally {
    rm(input, output)
  }
}

module.exports = {
  name: 'hd',
  aliases: ['enhance', 'remini', 'upscale', 'jernih'],
  category: 'AI',
  usage: '(kirim/reply gambar)',
  desc: 'Perjelas & perbesar gambar',
  async run(ctx) {
    const t = ctx.mediaTarget()
    if (!t || t.type !== 'image') {
      return ctx.reply(`Kirim atau reply sebuah *gambar* dengan ${ctx.prefix}hd\n(tambah "doc" untuk dikirim sebagai file: ${ctx.prefix}hd doc)`)
    }
    await ctx.react('⏳')
    const src = await ctx.download(t.node, 'image')
    const out = await enhance(src, ctx.config.enhance.maxSide)
    const caption = '✨ Gambar diperbesar, dikurangi noise, dan dipertajam.'
    if ((ctx.args[0] || '').toLowerCase() === 'doc') {
      await ctx.send({ document: out, mimetype: 'image/jpeg', fileName: 'hasil-hd.jpg', caption })
    } else {
      await ctx.send({ image: out, caption })
    }
    await ctx.react('✅')
  },
  _enhance: enhance
}
