// Mencari thumbnail & musik menu: assets/custom/ (milikmu) dulu, lalu assets/ (bawaan)
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'assets')
const IMG = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
// ogg/opus lebih dulu: sudah siap jadi voice note, tidak butuh ffmpeg di perangkat
const AUD = { ogg: 'audio/ogg; codecs=opus', opus: 'audio/ogg; codecs=opus', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav' }

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

const VID = { mp4: 'video/mp4' }
const thumbnail = () => find('thumbnail', IMG)
// banner menu bergerak (video pendek, tampil seperti GIF, maks 10 detik). Banner utama (bawaan) = banner1.mp4; slot 2-4 diisi sendiri (#setbanner <slot> <link YouTube>).
// Banner di assets/custom/ (milikmu) dipakai lebih dulu; kalau kosong, pakai bawaan di assets/.
// Tiap ada yang mengetik menu, banner berganti ke yang berikutnya.
function banners() {
  // 4 slot. Tiap slot: assets/custom/bannerN.(mp4|jpg|png|webp) kalau ada, kalau tidak assets/bannerN.mp4 bawaan.
  // (sama persis dengan yang dipakai di tab Banner aplikasi Android)
  const IMGX = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
  const ok = (f) => { try { return fs.statSync(f).size > 0 } catch { return false } }
  const out = []
  for (const n of ['banner1', 'banner2', 'banner3', 'banner4']) {
    let hit = null
    for (const [ext, mime] of [['mp4', 'video/mp4'], ...Object.entries(IMGX)]) {
      const f = path.join(ROOT, 'custom', n + '.' + ext)
      if (ok(f)) { hit = { file: f, mime }; break }
    }
    if (!hit && n === 'banner1') { const f = path.join(ROOT, n + '.mp4'); if (ok(f)) hit = { file: f, mime: 'video/mp4' } } // hanya banner utama yang bawaan
    if (hit) out.push(hit)
  }
  if (!out.length) { const f = path.join(ROOT, 'banner.mp4'); if (ok(f)) out.push({ file: f, mime: 'video/mp4' }) }
  return out
}
const banner = () => {
  const list = banners()
  if (!list.length) return null
  const db = require('./db')
  const i = Number(db.get('bannerIdx', 0)) || 0
  db.set('bannerIdx', (i + 1) % list.length)
  return list[i % list.length]
}
const music = () => find('music', AUD)

// ubah musik jadi voice note (OGG/Opus), hasilnya di-cache di tmp/ sampai file musik berubah
const { TMP, run } = require('./ffmpeg')
const crypto = require('crypto')
async function voiceNote(m) {
  if (/\.(ogg|opus)$/i.test(m.file)) return fs.readFileSync(m.file) // sudah OGG/Opus: kirim apa adanya
  const st = fs.statSync(m.file)
  const out = path.join(TMP, 'vn-' + crypto.createHash('md5').update(m.file + st.mtimeMs + st.size).digest('hex').slice(0, 10) + '.ogg')
  if (!fs.existsSync(out)) {
    const base = ['-y', '-i', m.file, '-t', '180', '-vn']
    const tail = ['-b:a', '48k', '-ac', '1', '-ar', '48000', out]
    try { await run('ffmpeg', [...base, '-c:a', 'libopus', ...tail]) } // build ffmpeg tanpa libopus -> pakai encoder opus bawaan
    catch { await run('ffmpeg', [...base, '-c:a', 'opus', '-strict', '-2', ...tail]) }
  }
  return fs.readFileSync(out)
}

// thumbnail kecil (JPEG 640px) untuk kartu menu; di-cache di tmp/
async function thumbJpeg(t) {
  const st = fs.statSync(t.file)
  const out = path.join(TMP, 'th2-' + crypto.createHash('md5').update(t.file + st.mtimeMs + st.size).digest('hex').slice(0, 10) + '.jpg')
  if (!fs.existsSync(out)) {
    try { await run('ffmpeg', ['-y', '-i', t.file, '-vf', 'scale=480:-2', '-q:v', '7', '-frames:v', '1', out]) }
    catch { if (/\.jpe?g$/i.test(t.file)) return fs.readFileSync(t.file); throw new Error('ffmpeg tidak tersedia') } // tanpa ffmpeg: pakai JPEG apa adanya
  }
  return fs.readFileSync(out)
}

module.exports = { banner, banners, thumbnail, music, voiceNote, thumbJpeg, ROOT }
