// Menggambar teks jadi gambar 512x512 (hitam-putih) dengan Jimp (font bawaan Jimp)
const SIZE = 512
const PAD = 28
const BOX = SIZE - PAD * 2

// hanya karakter yang didukung font bawaan (huruf latin, angka, tanda baca)
const clean = t => String(t || '').replace(/[^\x20-\x7E -ÿ\n]/g, '').trim()

// pilih ukuran huruf terbesar yang masih muat untuk seluruh teks
async function pickFont(Jimp, text, dark = false) {
  const color = dark ? 'WHITE' : 'BLACK'
  const longest = text.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), '')
  let font
  for (const size of [128, 64, 32, 16]) {
    font = await Jimp.loadFont(Jimp[`FONT_SANS_${size}_${color}`])
    if (Jimp.measureText(font, longest) <= BOX && Jimp.measureTextHeight(font, text, BOX) <= BOX) break
  }
  return font
}

// align: 'center' (tengah) atau 'left' (kiri-atas, seperti mengetik)
async function render(Jimp, font, text, { dark = false, align = 'center' } = {}) {
  const img = new Jimp(SIZE, SIZE, dark ? 0x000000ff : 0xffffffff)
  const left = align === 'left'
  img.print(
    font, PAD, PAD,
    {
      text,
      alignmentX: left ? Jimp.HORIZONTAL_ALIGN_LEFT : Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: left ? Jimp.VERTICAL_ALIGN_TOP : Jimp.VERTICAL_ALIGN_MIDDLE
    },
    BOX, BOX
  )
  return img.getBufferAsync(Jimp.MIME_PNG)
}

module.exports = { clean, pickFont, render }
