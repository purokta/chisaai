// Backup folder session (login WhatsApp) ke Download. Disimpan LOKAL saja, tidak dikirim lewat WhatsApp.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFile } = require('child_process')
const config = require('../config')
const db = require('./db')

const ROOT = path.join(__dirname, '..')
const HOME = process.env.HOME || os.homedir()

function targetDir() {
  const dl = path.join(HOME, 'storage', 'downloads')
  return fs.existsSync(dl) ? path.join(dl, 'chisa-backup') : path.join(HOME, 'chisa-backup')
}

const stamp = () => {
  const d = new Date(Date.now() + 7 * 3600000) // WIB
  return d.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-')
}

function run() {
  return new Promise((resolve, reject) => {
    const items = ['session', 'data/db.json', 'data/chisa'].filter(f => fs.existsSync(path.join(ROOT, f)))
    if (!items.length) {
      const e = new Error('Folder session & database belum ada (bot belum login).')
      e.userMessage = e.message
      return reject(e)
    }
    const dir = targetDir()
    fs.mkdirSync(dir, { recursive: true })
    const out = path.join(dir, `chisa-session-${stamp()}.tar.gz`)
    execFile('tar', ['-czf', out, '-C', ROOT, ...items], { timeout: 120000 }, err => {
      if (err) {
        const e = new Error('Backup gagal: ' + (err.code === 'ENOENT' ? 'program tar belum terpasang (pkg install tar)' : err.message))
        e.userMessage = e.message
        return reject(e)
      }
      // simpan hanya N backup terbaru
      const keep = config.backup?.keep ?? 5
      try {
        const files = fs.readdirSync(dir).filter(f => /^chisa-session-.*\.tar\.gz$/.test(f)).sort().reverse()
        for (const f of files.slice(keep)) fs.rmSync(path.join(dir, f), { force: true })
      } catch {}
      db.set('lastBackup', Date.now())
      resolve({ file: out, size: fs.statSync(out).size })
    })
  })
}

let timer = null
function startAuto() {
  const hours = config.backup?.everyHours ?? 24
  if (!hours || config.backup?.auto === false || timer) return
  const every = hours * 3600000
  const tick = () => run().then(r => console.log('[backup] session disimpan:', r.file)).catch(e => console.log('[backup]', e.message))
  const since = Date.now() - Number(db.get('lastBackup', 0))
  setTimeout(() => { if (Date.now() - Number(db.get('lastBackup', 0)) >= every) tick() }, since >= every ? 60000 : 5000)
  timer = setInterval(tick, every)
}

module.exports = { run, startAuto, targetDir }
