// Banner YouTube untuk aplikasi Android: aplikasi menulis permintaan (data/ytbanner-req.json), bot mengunduh videonya
// (360p, dengan suara) ke assets/custom/ytbanner.mp4 lalu menulis status ke data/ytbanner-status.json. Aplikasi memutarnya sendiri.
// Tidak butuh ffmpeg dan tidak kena batasan "embed dinonaktifkan" YouTube.
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const REQ = path.join(ROOT, 'data', 'ytbanner-req.json')
const STATUS = path.join(ROOT, 'data', 'ytbanner-status.json')
const OUT = path.join(ROOT, 'assets', 'custom', 'ytbanner.mp4')
let busy = false, timer = null

const status = o => { try { fs.mkdirSync(path.dirname(STATUS), { recursive: true }); fs.writeFileSync(STATUS, JSON.stringify({ ...o, ts: Date.now() })) } catch {} }

async function tick() {
  if (busy || !fs.existsSync(REQ)) return
  busy = true
  let req = {}
  try { req = JSON.parse(fs.readFileSync(REQ, 'utf8')) } catch {}
  try { fs.rmSync(REQ, { force: true }) } catch {}
  const dir = path.join(require('os').tmpdir(), 'ytb-' + Date.now())
  try {
    if (!/^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(String(req.link || ''))) throw new Error('link YouTube tidak valid')
    status({ state: 'busy', msg: 'Mengunduh video…' })
    fs.mkdirSync(dir, { recursive: true })
    const J = require('./jsdl')
    const r = await J.youtubeAny(req.link, 'video', dir, { maxHeight: 360, quality: '360p', maxMB: 40, maxDurationMin: 20 })
    fs.mkdirSync(path.dirname(OUT), { recursive: true })
    fs.copyFileSync(r.file, OUT + '.tmp'); fs.renameSync(OUT + '.tmp', OUT)
    status({ state: 'ok', msg: 'Siap: ' + String(r.title || '').slice(0, 60), size: fs.statSync(OUT).size })
  } catch (e) {
    status({ state: 'error', msg: String(e?.userMessage || e?.message || e).split('\n').join(' ').slice(0, 220) })
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
    busy = false
  }
}

function start() { if (!timer) { timer = setInterval(() => tick().catch(() => {}), 2500); timer.unref?.() } }
module.exports = { start, tick }
