// Membuat stiker bawaan Chisa dari gambar karakter (assets/custom/thumbnail.* atau assets/thumbnail.*) + tulisan
const assets = require('./assets')
const { imageToWebp } = require('./sticker')

const LINES = [
  ['Halo~', '👋'], ['Makasih!', '🙏'], ['Siap!', '🫡'], ['Hmph...', '😤'],
  ['Ohayou', '🌅'], ['Oyasumi', '🌙'], ['Maaf ya', '🥺'], ['Semangat!', '💪']
]

async function baseImage(Jimp) {
  const t = assets.thumbnail()
  if (!t) throw Object.assign(new Error('thumbnail tidak ada'), { userMessage: 'Gambar karakter (assets/thumbnail.jpg) tidak ditemukan.' })
  const img = await Jimp.read(t.file)
  const w = img.bitmap.width
  const h = img.bitmap.height
  const side = Math.min(w, Math.round(h * 0.72))
  const x = Math.max(0, Math.min(w - side, Math.round(w * 0.43 - side / 2)))
  const y = Math.round(h * 0.04)
  return img.crop(x, y, side, Math.min(side, h - y)).resize(512, 512)
}

// sudut membulat (transparan di luar)
function rounded(img, r = 56) {
  const n = img.bitmap.width
  img.scan(0, 0, n, n, function (x, y, idx) {
    const cx = x < r ? r : x >= n - r ? n - r - 1 : x
    const cy = y < r ? r : y >= n - r ? n - r - 1 : y
    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) this.bitmap.data[idx + 3] = 0
  })
  return img
}

async function caption(Jimp, img, text) {
  let size = 64
  let fW, fB
  for (const s of [64, 32]) {
    size = s
    fW = await Jimp.loadFont(Jimp[`FONT_SANS_${s}_WHITE`])
    if (Jimp.measureText(fW, text) <= 460) break
  }
  fB = await Jimp.loadFont(Jimp[`FONT_SANS_${size}_BLACK`])
  const opt = { text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM }
  for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, 2], [-2, 2], [2, -2]]) img.print(fB, 16 + dx, dy, opt, 480, 512 - 18)
  img.print(fW, 16, 0, opt, 480, 512 - 18)
  return img
}

// -> [{ webp: Buffer, emoji }]  (WebP polos 512x512, siap dipakai sticker set Telegram)
async function starter(count = LINES.length) {
  const Jimp = require('jimp')
  const out = []
  for (const [text, emoji] of LINES.slice(0, count)) {
    const img = rounded(await caption(Jimp, await baseImage(Jimp), text))
    out.push({ webp: await imageToWebp(await img.getBufferAsync(Jimp.MIME_PNG)), emoji })
  }
  return out
}

module.exports = { starter, LINES }
