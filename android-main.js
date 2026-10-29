// Pintu masuk bot di dalam aplikasi Android (nodejs-mobile, Node 18): pindah ke folder bot lalu jalankan index.js.
// Semua error dicatat langsung ke berkas log (stderr di nodejs-mobile bisa tidak tampil).
const fs = require('fs')
const path = require('path')
const LOG = path.join(__dirname, '..', 'bot.log')
const w = (s) => { try { fs.appendFileSync(LOG, s + '\n') } catch {} }
w(`[js] android-main mulai — node ${process.version} ${process.arch}`)
process.on('uncaughtException', (e) => { w('[js] uncaughtException: ' + (e && e.stack || e)); process.exitCode = 1 })
process.on('unhandledRejection', (e) => { w('[js] unhandledRejection: ' + (e && e.stack || e)) })
process.on('exit', (c) => w('[js] proses keluar kode=' + c))
try {
  // /tmp tidak bisa ditulis di Android (EACCES saat unggah media) -> pakai folder cache aplikasi
  const os = require('os')
  const T = process.env.CHISA_TMP || path.join(__dirname, '..', 'cache')
  fs.mkdirSync(T, { recursive: true })
  process.env.TMPDIR = process.env.TMP = process.env.TEMP = T
  os.tmpdir = () => T
  w(`[js] folder sementara: ${T}`)
  // Node di Android tanpa ICU penuh: regex \p{...} ditolak -> tulis ulang saat dimuat
  const intlPatched = require('./lib/intl-compat').install() // Node Android tidak punya Intl sama sekali
  const patched = require('./lib/re-compat').install()
  w(`[js] icu=${process.versions.icu || 'tidak ada'} intl=${typeof Intl} regex-\\p ${patched ? 'ditambal' : 'didukung'} Intl ${intlPatched ? 'ditambal' : 'asli'}`)
  try { w('[js] zona waktu: ' + (Intl.DateTimeFormat().resolvedOptions().timeZone || '?') + ' | ' + new Date().toString()) } catch {}
  process.chdir(__dirname)
  // Node 18 belum punya crypto global (dipakai Baileys terbaru)
  if (!globalThis.crypto) globalThis.crypto = require('crypto').webcrypto
  w('[js] memuat index.js…')
  require('./index.js')
  w('[js] index.js dimuat')
} catch (e) {
  w('[js] GAGAL memuat bot: ' + (e && e.stack || e))
  process.exit(1)
}
