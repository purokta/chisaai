// Mencari thumbnail & musik menu: assets/custom/ (milikmu) dulu, lalu assets/ (bawaan)
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'assets')
const IMG = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const AUD = { mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg; codecs=opus', opus: 'audio/ogg; codecs=opus', wav: 'audio/wav' }

function find(base, exts) {
  for (const dir of [path.join(ROOT, 'custom'), ROOT]) {
    for (const ext of Object.keys(exts)) {
      const f = path.join(dir, `${base}.${ext}`)
      try {
        if (fs.statSync(f).size > 0) return { file: f, mime: exts[ext] }
      } catch {}
    }
  }
  return null
}

const thumbnail = () => find('thumbnail', IMG)
const music = () => find('music', AUD)

// ubah musik jadi voice note (OGG/Opus), hasilnya di-cache di tmp/ sampai file musik berubah
const { TMP, run } = require('./ffmpeg')
const crypto = require('crypto')
async function voiceNote(m) {
  const st = fs.statSync(m.file)
  const out = path.join(TMP, 'vn-' + crypto.createHash('md5').update(m.file + st.mtimeMs + st.size).digest('hex').slice(0, 10) + '.ogg')
  if (!fs.existsSync(out)) {
    await run('ffmpeg', ['-y', '-i', m.file, '-t', '180', '-vn', '-c:a', 'libopus', '-b:a', '48k', '-ac', '1', '-ar', '48000', out])
  }
  return fs.readFileSync(out)
}

// thumbnail kecil (JPEG 640px) untuk kartu menu; di-cache di tmp/
async function thumbJpeg(t) {
  const st = fs.statSync(t.file)
  const out = path.join(TMP, 'th2-' + crypto.createHash('md5').update(t.file + st.mtimeMs + st.size).digest('hex').slice(0, 10) + '.jpg')
  if (!fs.existsSync(out)) await run('ffmpeg', ['-y', '-i', t.file, '-vf', 'scale=480:-2', '-q:v', '7', '-frames:v', '1', out])
  return fs.readFileSync(out)
}

module.exports = { thumbnail, music, voiceNote, thumbJpeg, ROOT }
