/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .ttp <teks> — stiker teks berwarna (transparan)   .attp <teks> — stiker teks yang warnanya berganti-ganti
const fs = require('fs'), os = require('os'), path = require('path')
const { execFile } = require('child_process')
const L = require('../../lib/stickerlib')
const K = require('../../lib/kreasi')
let FFMPEG = 'ffmpeg'; try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path } catch {}
const run = (args) => new Promise((res, rej) => execFile(FFMPEG, args, { maxBuffer: 1 << 26 }, (e, _o, se) => e ? rej(new Error(String(se || e.message).split('\n').slice(-3).join(' '))) : res()))

async function animated(text) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'attp-'))
  try {
    const list = []
    for (let i = 0; i < K.WARNA.length; i++) {
      const f = path.join(dir, `f${i}.png`); fs.writeFileSync(f, await K.textSticker(text, K.WARNA[i])); list.push(`file '${f}'\nduration 0.15`)
    }
    fs.writeFileSync(path.join(dir, 'l.txt'), list.join('\n'))
    const out = path.join(dir, 'o.webp')
    await run(['-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'l.txt'), '-vf', 'fps=10,scale=512:512:flags=lanczos', '-vcodec', 'libwebp', '-lossless', '0', '-q:v', '55', '-loop', '0', '-an', '-fps_mode', 'passthrough', out])
    return fs.readFileSync(out)
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
}

module.exports = {
  name: 'ttp', alias: ['attp'], category: 'sticker', cmds: ['ttp', 'attp'],
  desc: 'Stiker teks berwarna (ttp) dan teks berganti warna (attp)',
  run: async ({ sock, m, text, command, prefix, reply }) => {
    const t = String(text || (m.quoted && m.quoted.text) || '').trim().slice(0, 120)
    if (!t) return reply(`🎨 *${command.toUpperCase()}*\n\n> Masukkan teks, atau reply sebuah pesan teks.\n\n*Contoh:* ${prefix}${command} Halo semua`)
    L.react(sock, m, '🕕')
    try {
      if (command === 'attp') await L.sendWebp(sock, m, await animated(t))
      else await L.sendImageAsSticker(sock, m, await K.textSticker(t))
      L.react(sock, m, '✅')
    } catch (e) { console.log(`[${command}]`, e.message); L.react(sock, m, '❌'); reply(`❌ *Gagal membuat stiker*\n\n> ${e.message}`) }
  },
}
