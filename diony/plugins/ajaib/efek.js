/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .efek <nama> — ubah foto jadi sketsa pensil, pixel art, glitch, neon, kartun, lukisan, ASCII, dll (kirim/reply foto)
//   efek: sketsa, pixel, glitch, neon, kartun, lukisan, noir, vintage, negatif, cermin, ascii
//   Setiap efek juga bisa dipanggil langsung: .sketsa  .glitch  .ascii  ...
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib')
const MAX = 1280

const EFEK = {
  sketsa: 'sketsa pensil (foto → gambar tangan)', pixel: 'pixel art ala game retro', glitch: 'rusak digital + geser warna RGB', neon: 'garis neon bercahaya di latar gelap',
  kartun: 'warna datar + garis tegas ala komik', lukisan: 'lukisan cat minyak', noir: 'hitam putih sinematik', vintage: 'sepia foto tua + vignet', negatif: 'warna dibalik', cermin: 'simetri cermin kiri-kanan', ascii: 'seni teks ASCII (dikirim sebagai teks)',
}

async function load(sharp, buf) {
  const img = sharp(buf, { failOn: 'none' }).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true }).removeAlpha()
  return img.toBuffer({ resolveWithObject: true })
}
const jpg = (img) => img.jpeg({ quality: 90 }).toBuffer()
const rgb = (sharp, raw, info) => sharp(raw, { raw: { width: info.width, height: info.height, channels: info.channels } })

const FX = {
  async sketsa(sharp, buf) {
    const g = await sharp(buf).greyscale().toColourspace('srgb').png().toBuffer()
    const inv = await sharp(g).negate().blur(9).png().toBuffer()
    return jpg(sharp(g).composite([{ input: inv, blend: 'colour-dodge' }]).normalise().linear(1.06, -6))
  },
  async pixel(sharp, buf, info) {
    const block = Math.max(6, Math.round(Math.max(info.width, info.height) / 72)), w = Math.max(8, Math.round(info.width / block)), h = Math.max(8, Math.round(info.height / block))
    const small = await sharp(buf).resize(w, h, { kernel: 'cubic' }).modulate({ saturation: 1.25 }).raw().toBuffer({ resolveWithObject: true })
    const q = Buffer.from(small.data); for (let i = 0; i < q.length; i++) q[i] = Math.min(255, Math.round(q[i] / 36) * 36)   // palet terbatas
    return jpg(rgb(sharp, q, small.info).resize(w * block, h * block, { kernel: 'nearest' }))
  },
  async glitch(sharp, buf, info) {
    const { data, info: i } = await sharp(buf).raw().toBuffer({ resolveWithObject: true }), W = i.width, H = i.height, out = Buffer.from(data), sh = Math.max(4, Math.round(W / 55))
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 3; out[o] = data[(y * W + Math.max(0, x - sh)) * 3]; out[o + 2] = data[(y * W + Math.min(W - 1, x + sh)) * 3 + 2] }
    for (let b = 0; b < 9; b++) {   // pita horizontal bergeser
      const y0 = Math.floor(Math.random() * H), hh = Math.floor(H * (0.01 + Math.random() * 0.05)), off = Math.round((Math.random() - 0.5) * W * 0.25)
      for (let y = y0; y < Math.min(H, y0 + hh); y++) { const row = Buffer.from(out.subarray(y * W * 3, (y + 1) * W * 3)); for (let x = 0; x < W; x++) { const sx = (((x - off) % W) + W) % W; out[(y * W + x) * 3] = row[sx * 3]; out[(y * W + x) * 3 + 1] = row[sx * 3 + 1]; out[(y * W + x) * 3 + 2] = row[sx * 3 + 2] } }
    }
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W * 3; x++) out[y * W * 3 + x] = out[y * W * 3 + x] * 0.78   // garis pindai
    return jpg(rgb(sharp, out, i))
  },
  async neon(sharp, buf, info) {
    const edges = await sharp(buf).greyscale().blur(0.8).convolve({ width: 3, height: 3, kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] }).linear(3.2, 0).toColourspace('srgb').recomb([[0.1, 0, 0], [0, 1, 0], [0, 0.85, 0]]).blur(0.6).png().toBuffer()
    const glow = await sharp(edges).blur(7).linear(1.7, 0).png().toBuffer()
    const dark = await sharp(buf).modulate({ brightness: 0.22, saturation: 1.8 }).blur(2).png().toBuffer()
    return jpg(sharp(dark).composite([{ input: glow, blend: 'screen' }, { input: edges, blend: 'screen' }]))
  },
  async kartun(sharp, buf, info) {
    const sm = await sharp(buf).median(5).modulate({ saturation: 1.45, brightness: 1.03 }).raw().toBuffer({ resolveWithObject: true })
    const q = Buffer.from(sm.data); for (let i = 0; i < q.length; i++) q[i] = Math.min(255, Math.round(q[i] / 51) * 51)
    const flat = await rgb(sharp, q, sm.info).png().toBuffer()
    const ed = await sharp(buf).greyscale().median(3).convolve({ width: 3, height: 3, kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] }).raw().toBuffer({ resolveWithObject: true })
    const lm = Buffer.alloc(ed.data.length); for (let i = 0; i < lm.length; i++) lm[i] = ed.data[i] >= 28 ? 0 : 255   // garis = hitam, sisanya putih
    const lines = await sharp(lm, { raw: { width: ed.info.width, height: ed.info.height, channels: 1 } }).toColourspace('srgb').png().toBuffer()
    return jpg(sharp(flat).composite([{ input: lines, blend: 'multiply' }]))
  },
  async lukisan(sharp, buf) { return jpg(sharp(buf).median(7).modulate({ saturation: 1.4, brightness: 1.04 }).blur(0.7).sharpen({ sigma: 1.2 })) },
  async noir(sharp, buf) { return jpg(sharp(buf).greyscale().linear(1.35, -38).gamma(1.15)) },
  async vintage(sharp, buf, info) {
    const vig = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}"><defs><radialGradient id="v" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.65"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`)
    return jpg(sharp(buf).modulate({ saturation: 0.8 }).recomb([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]]).linear(0.95, 8).composite([{ input: vig }]))
  },
  async negatif(sharp, buf) { return jpg(sharp(buf).negate({ alpha: false })) },
  async cermin(sharp, buf, info) {
    const half = Math.floor(info.width / 2), left = await sharp(buf).extract({ left: 0, top: 0, width: half, height: info.height }).png().toBuffer(), flip = await sharp(left).flop().png().toBuffer()
    return jpg(sharp(left).extend({ right: half, background: '#000' }).composite([{ input: flip, left: half, top: 0 }]))
  },
}
// ASCII: gelap = karakter padat. Kolom dibatasi supaya muat satu baris layar HP.
async function ascii(sharp, buf, info) {
  const cols = 38, rows = Math.max(8, Math.min(40, Math.round(cols * (info.height / info.width) * 0.5)))
  const { data } = await sharp(buf).greyscale().normalise().resize(cols, rows, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true }), ramp = '@%#*+=-:. '
  let out = ''; for (let y = 0; y < rows; y++) { let line = ''; for (let x = 0; x < cols; x++) line += ramp[Math.min(ramp.length - 1, Math.floor(data[y * cols + x] / 256 * ramp.length))]; out += line.replace(/\s+$/, '') + '\n' }
  return out
}

module.exports = {
  name: 'efek', alias: Object.keys(EFEK), category: 'ajaib', noLimit: true, cmds: ['efek', ...Object.keys(EFEK)],
  desc: 'Efek foto: sketsa, pixel, glitch, neon, kartun, lukisan, noir, vintage, negatif, cermin, ASCII (kirim/reply foto)',
  run: async ({ sock, m, args, command, prefix, reply }) => {
    const name = command === 'efek' ? (args[0] || '').toLowerCase() : command
    if (!EFEK[name]) return reply(`✦ ${B('EFEK FOTO')}\nKirim / reply foto dengan:\n${prefix}efek <nama>   atau langsung ${prefix}<nama>\n\n${Object.entries(EFEK).map(([k, v]) => `◇ ${k} : ${v}`).join('\n')}\n\n_Contoh: ${prefix}sketsa_`)
    const media = AJ.pickNode(m, ['image', 'sticker'])
    if (!media) return reply(`Kirim atau reply sebuah *foto* dengan ${prefix}${name}`)
    if (Number(media.node.fileLength) > 15 * 1024 * 1024) return reply('✕ Ukuran foto maksimal 15 MB.')
    sock.sendMessage(m.chat, { react: { text: '🕕', key: m.key } }).catch(() => {})
    try {
      const sharp = require('../../lib/sharp.js'), { data, info } = await load(sharp, await AJ.download(media))
      if (name === 'ascii') {
        const art = await ascii(sharp, data, info)
        return sock.sendMessage(m.chat, { text: '```\n' + art + '```' }, { quoted: m })
      }
      const out = await FX[name](sharp, data, info)
      await sock.sendMessage(m.chat, { image: out, caption: `✦ Efek *${name}*: ${EFEK[name]}` }, { quoted: m })
      sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
    } catch (e) { console.log('[efek]', name, e); sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {}); return reply(`✕ Gagal memproses foto.\n_${e.message}_`) }
  },
  _internals: { FX, EFEK, ascii, load },
}
