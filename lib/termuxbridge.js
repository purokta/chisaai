// Jembatan ke alat Termux (termux/chisa-tools.js) supaya aplikasi Android bisa memakai ffmpeg / ffprobe / yt-dlp.
// Dipakai otomatis oleh lib/ffmpeg.js dan lib/downloader.js saat bot berjalan di aplikasi dan alat Termux menyala.
const fs = require('fs')
const path = require('path')

const base = () => process.env.CHISA_TERMUX || (process.env.CHISA_ANDROID ? 'http://127.0.0.1:38918' : '')
const headers = () => ({ 'content-type': 'application/json', ...(process.env.CHISA_TOOLS_TOKEN ? { 'x-token': process.env.CHISA_TOOLS_TOKEN } : {}) })
let okAt = 0, ok = false, tools = {}

async function ping(force) {
  if (!base()) return false
  if (!force && Date.now() - okAt < 15000) return ok
  okAt = Date.now()
  try {
    const r = await fetch(base() + '/ping', { headers: headers(), signal: AbortSignal.timeout(1500) })
    const j = await r.json()
    ok = !!j.ok; tools = j.tools || {}
  } catch { ok = false; tools = {} }
  return ok
}
const available = async cmd => (await ping()) && (!cmd || tools[cmd] !== false)

async function exec(job, timeout = 300000) {
  const r = await fetch(base() + '/exec', { method: 'POST', headers: headers(), body: JSON.stringify(job), signal: AbortSignal.timeout(timeout + 15000) })
  const j = await r.json()
  if (j.error && !j.outputs) throw new Error('alat Termux: ' + j.error)
  return j
}

const isFile = p => { try { return fs.statSync(p).isFile() } catch { return false } }
const extOf = p => path.extname(p).replace('.', '')

/** jalankan ffmpeg/ffprobe lewat Termux. Berkas masukan (path yang ada) dikirim, berkas keluaran (path terakhir yang belum ada) diterima. */
async function run(cmd, args, { timeout = 120000 } = {}) {
  const inputs = [], outputs = []
  const out = args.map((a, i) => {
    if (typeof a !== 'string' || !path.isAbsolute(a)) return a
    if (isFile(a)) { const id = 'in' + inputs.length; inputs.push({ id, ext: extOf(a), b64: fs.readFileSync(a).toString('base64') }); return `{${id}}` }
    if (i === args.length - 1 && cmd === 'ffmpeg' && fs.existsSync(path.dirname(a))) { const id = 'out' + outputs.length; outputs.push({ id, ext: extOf(a), path: a }); return `{${id}}` }
    return a
  })
  if (args.some(a => typeof a === 'string' && /%0\\d/.test(a))) throw Object.assign(new Error('urutan gambar belum didukung lewat Termux'), { code: 'EUNSUPPORTED' })
  const j = await exec({ cmd, args: out, inputs, outputs: outputs.map(({ id, ext }) => ({ id, ext })), timeout })
  if (j.error === 'ENOENT') throw Object.assign(new Error(`spawn ${cmd} ENOENT`), { code: 'ENOENT', stderr: `${cmd} belum terpasang di Termux (pkg install ${cmd === 'ffprobe' ? 'ffmpeg' : cmd})` })
  for (const o of outputs) if (j.outputs?.[o.id]) fs.writeFileSync(o.path, Buffer.from(j.outputs[o.id], 'base64'))
  if (j.code !== 0) throw Object.assign(new Error(`Command failed: ${cmd} (Termux, kode ${j.code})`), { stderr: j.stderr || '', code: j.code })
  return { stdout: j.stdout || '', stderr: j.stderr || '' }
}

/** yt-dlp lewat Termux: semua berkas hasil unduhan ditulis ke `dir`. `args` tanpa -o. */
async function ytdlp(args, dir, { timeout = 240000 } = {}) {
  const j = await exec({ cmd: 'yt-dlp', args, collect: true, timeout }, timeout)
  if (j.error === 'ENOENT') throw Object.assign(new Error('spawn yt-dlp ENOENT'), { code: 'ENOENT', stderr: 'yt-dlp belum terpasang di Termux (pkg install yt-dlp)' })
  fs.mkdirSync(dir, { recursive: true })
  for (const [name, b64] of Object.entries(j.outputs || {})) fs.writeFileSync(path.join(dir, name.replace(/^dl-/, '')), Buffer.from(b64, 'base64'))
  if (j.code !== 0 && !Object.keys(j.outputs || {}).length) throw Object.assign(new Error('yt-dlp gagal (Termux): ' + String(j.stderr || '').trim().split('\n').slice(-1)[0].slice(0, 160)), { stderr: j.stderr, code: j.code })
  return { stdout: j.stdout, stderr: j.stderr }
}
module.exports = { available, ping, run, ytdlp, base }
