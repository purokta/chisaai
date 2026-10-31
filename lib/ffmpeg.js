// Helper untuk menjalankan program luar (ffmpeg, yt-dlp) dan file sementara
const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const TMP = path.join(__dirname, '..', 'tmp')
fs.mkdirSync(TMP, { recursive: true })

const tmpPath = ext => path.join(TMP, crypto.randomBytes(6).toString('hex') + '.' + ext)

async function run(cmd, args, opts = {}) {
  if (process.env.CHISA_ANDROID) {
    // 1) ffmpeg bawaan APK yang lolos uji -> langsung
    if (cmd === 'ffmpeg' && process.env.CHISA_FFMPEG_OK) return runLocal(cmd, args, opts)
    // 2) HP root: biner Termux lewat su (tanpa Termux dibuka)
    const R = require('./rootexec')
    if (await R.available(cmd)) return R.run(cmd, args, { ...opts, tmpDir: TMP })
    // 3) alat Termux (server lokal)
    if (cmd === 'ffmpeg' || cmd === 'ffprobe') {
      const B = require('./termuxbridge')
      if (await B.available(cmd)) return B.run(cmd, args, opts)
    }
  }
  return runLocal(cmd, args, opts)
}
function runLocal(cmd, args, { timeout = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout, maxBuffer: 1 << 25 }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = String(stderr || '')
        return reject(err)
      }
      resolve({ stdout, stderr })
    })
  })
}

function rm(...files) {
  for (const f of files) {
    try {
      fs.rmSync(f, { recursive: true, force: true })
    } catch {}
  }
}

// Bersihkan sisa file sementara yang lebih tua dari 1 jam
function cleanTmp() {
  try {
    const limit = Date.now() - 60 * 60 * 1000
    for (const f of fs.readdirSync(TMP)) {
      const p = path.join(TMP, f)
      if (fs.statSync(p).mtimeMs < limit) rm(p)
    }
  } catch {}
}

module.exports = { TMP, tmpPath, run, rm, cleanTmp }
