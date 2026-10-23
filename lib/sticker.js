// Pembuat stiker: ffmpeg (konversi ke WebP 512x512) + penulis metadata EXIF (nama pack) tanpa library tambahan
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')
const { TMP, run, tmpPath, rm } = require('./ffmpeg')

const FIT =
  'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000'

// ---------- konversi ----------
async function imageToWebp(buffer) {
  const input = tmpPath('img')
  const output = tmpPath('webp')
  fs.writeFileSync(input, buffer)
  try {
    await run('ffmpeg', [
      '-y', '-i', input, '-vf', FIT,
      '-c:v', 'libwebp', '-quality', '75', '-compression_level', '6',
      '-frames:v', '1', output
    ])
    return fs.readFileSync(output)
  } finally {
    rm(input, output)
  }
}

async function videoToWebp(buffer) {
  const input = tmpPath('vid')
  const output = tmpPath('webp')
  fs.writeFileSync(input, buffer)
  try {
    // turunkan kualitas bertahap sampai ukurannya aman untuk stiker (< ~900 KB)
    const tries = [
      { fps: 15, q: 55 },
      { fps: 12, q: 40 },
      { fps: 10, q: 30 },
      { fps: 8, q: 20 }
    ]
    let out
    for (const t of tries) {
      await run('ffmpeg', [
        '-y', '-t', '8', '-i', input, '-vf', `fps=${t.fps},${FIT}`, '-an',
        '-c:v', 'libwebp', '-quality', String(t.q), '-compression_level', '4',
        '-loop', '0', output
      ])
      out = fs.readFileSync(output)
      if (out.length <= 900 * 1024) break
    }
    return out
  } finally {
    rm(input, output)
  }
}

// ---------- metadata EXIF (nama pack stiker) ----------
function chunk(fourcc, payload) {
  const head = Buffer.alloc(8)
  head.write(fourcc, 0, 'ascii')
  head.writeUInt32LE(payload.length, 4)
  return Buffer.concat([head, payload, Buffer.alloc(payload.length % 2)])
}

function buildExif({ pack, author, emojis = ['🤖'] }) {
  const json = Buffer.from(
    JSON.stringify({
      'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
      'sticker-pack-name': pack,
      'sticker-pack-publisher': author,
      emojis
    }),
    'utf8'
  )
  const head = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  head.writeUInt32LE(json.length, 14)
  return Buffer.concat([head, json])
}

function addExif(webp, meta = {}) {
  if (webp.length < 20 || webp.toString('ascii', 0, 4) !== 'RIFF' || webp.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('File bukan WebP yang valid')
  }
  const exif = buildExif({ pack: config.sticker.pack, author: config.sticker.author, ...meta })

  const chunks = []
  let off = 12
  while (off + 8 <= webp.length) {
    const id = webp.toString('ascii', off, off + 4)
    const size = webp.readUInt32LE(off + 4)
    chunks.push({ id, data: webp.subarray(off + 8, off + 8 + size) })
    off += 8 + size + (size % 2)
  }

  const body = chunks.filter(c => c.id !== 'EXIF')
  const vp8x = body.find(c => c.id === 'VP8X')
  if (vp8x) {
    const d = Buffer.from(vp8x.data)
    d[0] |= 0x08 // flag EXIF
    vp8x.data = d
  } else {
    const img = body.find(c => c.id === 'VP8 ' || c.id === 'VP8L')
    if (!img) throw new Error('Data gambar WebP tidak ditemukan')
    let w, h, flags = 0x08
    if (img.id === 'VP8 ') {
      w = img.data.readUInt16LE(6) & 0x3fff
      h = img.data.readUInt16LE(8) & 0x3fff
    } else {
      const b = img.data.readUInt32LE(1)
      w = (b & 0x3fff) + 1
      h = ((b >>> 14) & 0x3fff) + 1
      if ((b >>> 28) & 1) flags |= 0x10 // ada alpha
    }
    const d = Buffer.alloc(10)
    d[0] = flags
    d.writeUIntLE(w - 1, 4, 3)
    d.writeUIntLE(h - 1, 7, 3)
    body.unshift({ id: 'VP8X', data: d })
  }
  body.push({ id: 'EXIF', data: exif })

  const payload = Buffer.concat(body.map(c => chunk(c.id, c.data)))
  const riff = Buffer.alloc(12)
  riff.write('RIFF', 0, 'ascii')
  riff.writeUInt32LE(4 + payload.length, 4)
  riff.write('WEBP', 8, 'ascii')
  return Buffer.concat([riff, payload])
}

// kind: 'image' | 'video'
async function createSticker(buffer, kind, meta) {
  const webp = kind === 'video' ? await videoToWebp(buffer) : await imageToWebp(buffer)
  return addExif(webp, meta)
}

// kumpulan frame PNG (512x512) -> stiker animasi. fps = frame per detik
async function framesToSticker(frames, fps = 3, meta) {
  const dir = fs.mkdtempSync(path.join(TMP, 'fr-'))
  try {
    frames.forEach((b, i) => fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.png`), b))
    const out = path.join(dir, 'out.webp')
    await run('ffmpeg', [
      '-y', '-framerate', String(fps), '-i', path.join(dir, 'f%03d.png'),
      '-vf', 'format=rgba', '-c:v', 'libwebp', '-preset', 'text',
      '-quality', '70', '-compression_level', '6', '-loop', '0', out
    ])
    return addExif(fs.readFileSync(out), meta)
  } finally {
    rm(dir)
  }
}

// stiker -> gambar PNG (atau MP4 kalau stikernya animasi)
async function stickerToImage(buffer) {
  const input = tmpPath('webp')
  fs.writeFileSync(input, buffer)
  const animated = buffer.includes('ANIM')
  const output = tmpPath(animated ? 'mp4' : 'png')
  try {
    if (animated) {
      await run('ffmpeg', [
        '-y', '-i', input, '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', output
      ])
    } else {
      await run('ffmpeg', ['-y', '-i', input, '-frames:v', '1', output])
    }
    return { type: animated ? 'video' : 'image', buffer: fs.readFileSync(output) }
  } finally {
    rm(input, output)
  }
}

module.exports = { createSticker, addExif, stickerToImage, imageToWebp, framesToSticker }
