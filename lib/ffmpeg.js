// Helper untuk menjalankan program luar (ffmpeg, yt-dlp) dan file sementara
const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const TMP = path.join(__dirname, '..', 'tmp')
fs.mkdirSync(TMP, { recursive: true })

const tmpPath = ext => path.join(TMP, crypto.randomBytes(6).toString('hex') + '.' + ext)

function run(cmd, args, { timeout = 120000 } = {}) {
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
