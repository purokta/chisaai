// jenis audio dari isi berkas (API/ytdl bisa memberi m4a/webm walau diminta mp3)
function audioKind(b) {
  if (b.length > 12 && b.slice(4, 8).toString() === 'ftyp') return { mime: 'audio/mp4', ext: 'm4a' }
  if (b.slice(0, 4).toString() === 'OggS') return { mime: 'audio/ogg; codecs=opus', ext: 'ogg' }
  if (b.slice(0, 3).toString() === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { mime: 'audio/mpeg', ext: 'mp3' }
  if (b[0] === 0x1a && b[1] === 0x45) return { mime: 'audio/webm', ext: 'webm' }
  return { mime: 'audio/mpeg', ext: 'mp3' }
}
// kirim audio dengan mimetype yang benar; webm dikonversi ke m4a bila ffmpeg tersedia
async function sendAudio(ctx, buf, title) {
  let k = audioKind(buf)
  if (k.ext === 'webm') {
    try {
      const { tmpPath, run, rm } = require('../lib/ffmpeg')
      const i = tmpPath('webm'), o = tmpPath('m4a')
      require('fs').writeFileSync(i, buf)
      try { await run('ffmpeg', ['-y', '-i', i, '-vn', '-c:a', 'aac', '-b:a', '128k', o], { timeout: 120000 }); buf = require('fs').readFileSync(o); k = { mime: 'audio/mp4', ext: 'm4a' } } finally { rm(i, o) }
    } catch {}
  }
  return ctx.send({ audio: buf, mimetype: k.mime, fileName: (title || 'audio') + '.' + k.ext })
}

module.exports = { audioKind, sendAudio }
