/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// lib/roundvid.js — bantu kirim VIDEO BULAT (video note / PTV WhatsApp).
//   crop(buffer)  -> Buffer mp4 persegi 480x480 (center-crop, maks 60 dtk). Tanpa ffmpeg / gagal -> buffer asli.
//   send(sock, m, buffer) -> kirim sebagai ptv, quote pesan pemanggil; bila ptv gagal -> video biasa.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFile } = require('child_process')

let FFMPEG = 'ffmpeg'
try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path } catch {}

function crop(buf) {
  return new Promise((resolve) => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7)
    const inp = path.join(os.tmpdir(), `rv-in-${id}.mp4`), out = path.join(os.tmpdir(), `rv-out-${id}.mp4`)
    const clean = () => { fs.unlink(inp, () => {}); fs.unlink(out, () => {}) }
    try { fs.writeFileSync(inp, buf) } catch { return resolve(buf) }
    execFile(FFMPEG, ['-y', '-i', inp, '-t', '60', '-vf', 'crop=min(iw\\,ih):min(iw\\,ih),scale=480:480:flags=lanczos,setsar=1,fps=30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25', '-maxrate', '1500k', '-bufsize', '3000k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-movflags', '+faststart', out],
      { timeout: 90000, maxBuffer: 1 << 26 }, (err) => {
        let res = buf
        if (!err) { try { const b = fs.readFileSync(out); if (b.length) res = b } catch {} }
        clean(); resolve(res)
      })
  })
}

async function send(sock, m, buf) {
  try {
    return await sock.sendMessage(m.chat, { video: buf, ptv: true, mimetype: 'video/mp4' }, { quoted: m })
  } catch (e) {
    console.log('[roundvid] ptv gagal, kirim video biasa:', e.message)
    return sock.sendMessage(m.chat, { video: buf, mimetype: 'video/mp4' }, { quoted: m })
  }
}
module.exports = { crop, send }
