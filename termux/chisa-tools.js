#!/usr/bin/env node
// CHISA-AI — alat Termux untuk aplikasi Android.
// Aplikasi tidak bisa menjalankan ffmpeg / yt-dlp sendiri (diblokir Android), tapi Termux bisa. Skrip ini membuka server lokal
// 127.0.0.1:38918 yang menjalankan ffmpeg / ffprobe / yt-dlp milik Termux atas permintaan bot di dalam aplikasi.
//
// Pasang sekali di Termux:   pkg install nodejs ffmpeg yt-dlp
// Jalankan:                  node ~/chisa-ai/termux/chisa-tools.js        (biarkan Termux terbuka / aktifkan wake-lock)
// Opsional:                  CHISA_TOOLS_TOKEN=rahasia node ...   (isi token yang sama di aplikasi bila dipakai)
const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const cp = require('child_process')

const PORT = Number(process.env.CHISA_TOOLS_PORT || 38918)
const TOKEN = process.env.CHISA_TOOLS_TOKEN || ''
const MAX_BODY = 300 * 1024 * 1024
const ALLOW = new Set(['ffmpeg', 'ffprobe', 'yt-dlp'])
// opsi yt-dlp yang bisa menjalankan program lain / membaca berkas / mengubah lokasi simpan: ditolak
const YT_DENY = /^(--exec|--exec-before-download|--config-locations?|--load-info-json|--cookies|--cookies-from-browser|--batch-file|-a|--plugin-dirs|--use-postprocessor|--ffmpeg-location|-o|--output|-P|--paths|--netrc|--netrc-location|--write-.*|--download-archive|--print-to-file|--alias|--no-config)$/
const BAD_REF = /^(\/|~|file:|concat:|subfile:|data:|pipe:|tcp:|udp:|rtmp|ftp:|\.\.)|\.\.\//

const have = c => { try { return cp.spawnSync('sh', ['-c', `command -v ${c}`]).status === 0 } catch { return false } }
const tail = s => String(s || '').slice(-6000)

function validate(cmd, args) {
  if (!ALLOW.has(cmd)) throw new Error('perintah tidak diizinkan: ' + cmd)
  if (!Array.isArray(args) || args.length > 200) throw new Error('argumen tidak valid')
  for (const a of args) {
    if (typeof a !== 'string' || a.length > 2000) throw new Error('argumen tidak valid')
    if (cmd === 'yt-dlp') {
      if (YT_DENY.test(a)) throw new Error('opsi ditolak: ' + a)
      continue
    }
    if (BAD_REF.test(a) || /:\/\//.test(a)) throw new Error('argumen ditolak: ' + a.slice(0, 40))
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let n = 0
    req.on('data', c => { n += c.length; if (n > MAX_BODY) { reject(new Error('terlalu besar')); req.destroy() } else chunks.push(c) })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function exec(job) {
  const { cmd, args, inputs = [], outputs = [], collect = false, timeout = 240000 } = job
  validate(cmd, args)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-'))
  try {
    const map = {}
    for (const i of inputs) { const p = path.join(dir, i.id + (i.ext ? '.' + String(i.ext).replace(/\W/g, '') : '')); fs.writeFileSync(p, Buffer.from(i.b64, 'base64')); map[i.id] = p }
    for (const o of outputs) map[o.id] = path.join(dir, o.id + (o.ext ? '.' + String(o.ext).replace(/\W/g, '') : ''))
    const real = args.map(a => a.replace(/\{(\w+)\}/g, (m, k) => map[k] || m))
    if (cmd === 'yt-dlp' && collect) real.unshift('-o', path.join(dir, 'dl-%(id)s.%(ext)s'))
    const r = await new Promise(resolve => {
      cp.execFile(cmd, real, { cwd: dir, timeout: Math.min(Number(timeout) || 240000, 600000), maxBuffer: 1 << 25 }, (err, stdout, stderr) => {
        resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, signal: err && err.signal || null, error: err && err.code === 'ENOENT' ? 'ENOENT' : null, stdout: tail(stdout), stderr: tail(stderr) })
      })
    })
    const out = {}
    for (const o of outputs) if (fs.existsSync(map[o.id])) out[o.id] = fs.readFileSync(map[o.id]).toString('base64')
    if (collect) for (const f of fs.readdirSync(dir)) if (/^dl-/.test(f) && !/\.(part|ytdl)$/.test(f)) out[f] = fs.readFileSync(path.join(dir, f)).toString('base64')
    return { ...r, outputs: out }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

const server = http.createServer(async (req, res) => {
  const send = (code, obj) => { const b = Buffer.from(JSON.stringify(obj)); res.writeHead(code, { 'content-type': 'application/json', 'content-length': b.length }); res.end(b) }
  try {
    if (TOKEN && req.headers['x-token'] !== TOKEN) return send(401, { error: 'token salah' })
    if (req.method === 'GET' && req.url === '/ping') return send(200, { ok: true, version: 1, tools: { ffmpeg: have('ffmpeg'), ffprobe: have('ffprobe'), 'yt-dlp': have('yt-dlp') } })
    if (req.method === 'POST' && req.url === '/exec') return send(200, await exec(JSON.parse((await readBody(req)).toString('utf8'))))
    send(404, { error: 'tidak ada' })
  } catch (e) { send(400, { error: String(e && e.message || e) }) }
})
server.on('error', e => { console.log(e.code === 'EADDRINUSE' ? `Alat Termux sudah berjalan di port ${PORT}.` : 'Gagal: ' + e.message); process.exit(e.code === 'EADDRINUSE' ? 0 : 1) })
server.listen(PORT, '127.0.0.1', () => {
  console.log(`CHISA-AI alat Termux aktif di 127.0.0.1:${PORT}`)
  console.log(`ffmpeg: ${have('ffmpeg') ? 'ada' : 'BELUM (pkg install ffmpeg)'} • yt-dlp: ${have('yt-dlp') ? 'ada' : 'BELUM (pkg install yt-dlp)'}`)
  console.log('Biarkan jendela ini jalan. Hentikan dengan Ctrl+C.')
})
