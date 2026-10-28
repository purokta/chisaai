/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Konverter media cepat (reply media-nya):
//   .toimg    stiker -> gambar (stiker animasi -> video)
//   .tomp3    video / audio -> mp3
//   .tovn     video / audio -> pesan suara (voice note)
const sharp = (() => { try { return require('sharp') } catch { return null } })()
const B = require('../../lib/baileys'), MP = require('../../lib/mediapick'), CV = require('../../lib/converter'), ST = require('../../lib/style')

async function grab(node, kind) {
  const stream = await B.downloadContentFromMessage(node, kind), chunks = []
  let n = 0
  for await (const c of stream) { n += c.length; if (n > 40 * 1048576) throw new Error('file terlalu besar (maks 40 MB)'); chunks.push(c) }
  return Buffer.concat(chunks)
}
const extOf = (mime, d = 'bin') => { const e = String(mime || '').split('/')[1]; return (e ? e.split(';')[0].replace('mpeg', 'mp3').replace('x-', '') : d) || d }
const stickerOf = (m) => { for (const n of [m.quoted, m.msg]) if (n && /webp/.test(String(n.mimetype || '')) && (n.isAnimated !== undefined || n.fileSha256)) return n; return null }

module.exports = {
  name: 'tovideo', alias: ['tovideo', 'toaudio', 'tovoice', 'topng'], category: 'tools', cmds: [], noLimit: false,
  desc: 'Ubah media: stiker ke gambar, video/audio ke mp3, video/audio ke pesan suara',
  run: async ({ sock, m, reply, command, prefix }) => {
    try {
      if (['toimg', 'topng', 'tovideo'].includes(command)) {
        const st = stickerOf(m)
        if (!st) return reply(`Reply sebuah stiker dengan ${prefix}toimg.`)
        const buf = await grab(st, 'sticker')
        if (!st.isAnimated) {
          if (!sharp) return reply('Modul sharp belum terpasang (jalankan: npm install).')
          return sock.sendMessage(m.chat, { image: await sharp(buf).png().toBuffer(), caption: ST.B('STIKER KE GAMBAR') }, { quoted: m })
        }
        if (!sharp) return reply('Modul sharp belum terpasang (jalankan: npm install).')
        const gif = await sharp(buf, { animated: true }).gif().toBuffer()
        const mp4 = await CV.ffmpeg(gif, ['-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'], 'gif', 'mp4')
        return sock.sendMessage(m.chat, { video: mp4, gifPlayback: true, caption: ST.B('STIKER KE VIDEO') }, { quoted: m })
      }
      const media = MP.pick(m)
      if (!media || !['audio', 'video'].includes(media.kind)) return reply(`Reply video atau audio dengan ${prefix}${command}.`)
      const src = await grab(media.node, media.kind), ext = extOf(media.mimetype, media.kind === 'video' ? 'mp4' : 'mp3')
      if (command === 'tovn' || command === 'tovoice') return sock.sendMessage(m.chat, { audio: await CV.toPTT(src, ext), mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
      return sock.sendMessage(m.chat, { audio: await CV.toAudio(src, ext), mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
    } catch (e) { console.log('[ubah]', e && e.message || e); reply('Gagal mengubah media: ' + (e && e.message || 'ffmpeg gagal (kode ' + e + ')')) }
  },
}
