// Mencegah DUA bot berjalan bersamaan dengan folder session yang sama.
// Dua proses yang memakai login yang sama saling merusak kunci enkripsi (Bad MAC, "Waiting for this message" di HP).
// Penyebab umum: bot lama masih hidup di tmux/background atau terhenti karena Ctrl+Z.
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', '.chisa.lock')

function alive(pid) {
  try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' }
}

function acquire() {
  try {
    const old = Number(fs.readFileSync(FILE, 'utf8').trim())
    if (old && old !== process.pid && alive(old)) {
      console.error(
        `\n⛔ Bot sudah berjalan di proses lain (PID ${old}).\n` +
        '   Dua bot dengan login yang sama membuat pesan "Waiting for this message".\n' +
        '   Hentikan yang lama dulu:  bash stop.sh   (atau: pkill -f "node index.js")\n' +
        '   Kalau yakin tidak ada bot lain:  rm .chisa.lock\n'
      )
      return false
    }
  } catch {}
  try { fs.writeFileSync(FILE, String(process.pid)) } catch {}
  const release = () => { try { if (Number(fs.readFileSync(FILE, 'utf8')) === process.pid) fs.unlinkSync(FILE) } catch {} }
  process.on('exit', release)
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { release(); process.exit(0) })
  return true
}

module.exports = { acquire }
