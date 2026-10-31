// Mode ROOT (Android yang sudah di-root): jalankan ffmpeg / ffprobe / yt-dlp milik Termux lewat `su`.
// Proses `su` tidak terkena filter seccomp/W^X aplikasi, jadi biner Termux jalan normal — Termux TIDAK perlu dibuka.
// Syarat: Termux terpasang + `pkg install ffmpeg yt-dlp`, dan aplikasi diberi izin root di Magisk/KernelSU.
const { execFile } = require('child_process')
const PREFIX = process.env.CHISA_TERMUX_PREFIX || '/data/data/com.termux/files/usr'
const HOME = PREFIX.replace(/\/usr$/, '/home')
const q = s => "'" + String(s).replace(/'/g, "'\\''") + "'"

const sh = (script, timeout) => new Promise(resolve => {
  execFile('su', ['-c', script], { timeout, maxBuffer: 1 << 25 }, (err, stdout, stderr) => resolve({ err, stdout: String(stdout || ''), stderr: String(stderr || '') }))
})

let rootState // undefined | Promise<bool>
const hasRoot = () => {
  if (!process.env.CHISA_ANDROID || process.env.CHISA_NOROOT) return Promise.resolve(false)
  if (!rootState) rootState = sh('id -u', 15000).then(r => !r.err && r.stdout.trim() === '0').catch(() => false)
  return rootState
}
const have = {}
async function available(cmd) {
  if (!(await hasRoot())) return false
  if (have[cmd] === undefined) { const r = await sh(`[ -x ${q(PREFIX + '/bin/' + cmd)} ] && echo y`, 8000); have[cmd] = r.stdout.trim() === 'y' }
  return have[cmd]
}

async function run(cmd, args, { timeout = 120000, tmpDir } = {}) {
  const env = `export PREFIX=${q(PREFIX)} HOME=${q(HOME)} TMPDIR=${q(PREFIX + '/tmp')} LD_LIBRARY_PATH=${q(PREFIX + '/lib')} PATH=${q(PREFIX + '/bin')}:$PATH SSL_CERT_FILE=${q(PREFIX + '/etc/tls/cert.pem')}; unset LD_PRELOAD;`
  const fix = tmpDir ? `; c=$?; chmod -R a+rwX ${q(tmpDir)} 2>/dev/null; exit $c` : ''
  const script = `${env} ${q(PREFIX + '/bin/' + cmd)} ${args.map(q).join(' ')}${fix}`
  const r = await sh(script, timeout)
  if (r.err) {
    const e = new Error(`Command failed: ${cmd} (root, kode ${r.err.code})`)
    e.code = r.err.code === 'ENOENT' ? 'ENOENT' : r.err.code; e.stderr = r.stderr; e.killed = r.err.killed
    throw e
  }
  return { stdout: r.stdout, stderr: r.stderr }
}
module.exports = { hasRoot, available, run }
