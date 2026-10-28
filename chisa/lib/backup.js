/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
/*
  ✦ CHISA AI VAULT — sistem cadangan & pemulihan ingatan bot
  ─────────────────────────────────────────────────────────────
  Masalah yang diselesaikan: panel di-restart / listrik mati / proses di-kill saat bot sedang
  menulis data → file JSON setengah jadi → saat bot hidup lagi data dibaca "kosong" → ingatan hilang.

  1. Tulis ATOMIK     : semua penulisan ke lib/database/*.json lewat file sementara + rename,
                        jadi file tidak pernah setengah tertulis (tanpa mengubah modul lain).
  2. Self-heal boot   : sebelum modul lain memuat data, file rusak / kosong / hilang dipulihkan
                        otomatis dari cadangan terakhir yang valid.
  3. Snapshot berkala : zip bertanda waktu di folder  backup/snapshots/  (rotasi otomatis),
                        + salinan mentah terakhir di  backup/latest/  (bisa disalin manual).
  4. Flush saat mati  : SIGTERM / SIGINT / SIGHUP (tombol restart/stop panel) → semua data
                        ditulis dulu, snapshot terakhir dibuat, baru proses keluar.
  5. Cadangan sesi    : sesi WhatsApp disalin ke backup/session/ (hanya dipulihkan otomatis kalau
                        creds.json RUSAK — bukan kalau kamu sengaja menghapus folder untuk pairing ulang).
  6. Restore aman     : sebelum restore, kondisi sekarang dicadangkan dulu (-prerestore).
  CLI (konsol panel):  node lib/backup.js list | snapshot | verify | restore <no|id> | restore-session
  Hanya modul bawaan Node.
*/
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')

const ROOT = path.join(__dirname, '..')
const DBDIR = global.chisaData
const BKDIR = path.join(ROOT, 'backup')
const SNAPDIR = path.join(BKDIR, 'snapshots')
const MIRROR = path.join(BKDIR, 'latest')
const SESSDIR_BK = path.join(BKDIR, 'session')
const QUARANTINE = path.join(BKDIR, 'quarantine')
const PENDING = path.join(BKDIR, 'restore.pending')
const STATEFILE = path.join(BKDIR, 'state.json')

const CFG = Object.assign({
  enabled: true,
  every: 30 * 60e3,        // interval snapshot otomatis (hanya dibuat bila ada data yang berubah)
  keep: 6,                 // jumlah snapshot terbaru yang selalu disimpan (hemat storage)
  keepDays: 2,             // + snapshot terbaru dari tiap hari selama N hari terakhir
  maxMB: 40,               // batas total ukuran folder snapshots
  session: true,           // ikut cadangkan sesi WhatsApp (lokal saja, tidak pernah dikirim lewat chat)
  sessionKeep: 1,
  sessionMaxMB: 15,
  onShutdown: true,        // flush + snapshot saat panel stop / restart
}, global.backup || {})

// ───────────── util ─────────────
const tzName = () => (global.settingsDefault && global.settingsDefault.timezone) || 'Asia/Jakarta'
function stamp(d = new Date()) {
  try { return d.toLocaleString('sv-SE', { timeZone: tzName() }).replace(/\D/g, '').replace(/^(\d{8})(\d{6}).*/, '$1-$2') }
  catch { return d.toISOString().replace(/\D/g, '').replace(/^(\d{8})(\d{6}).*/, '$1-$2') }
}
const mkdir = (d) => { try { fs.mkdirSync(d, { recursive: true, mode: 0o700 }) } catch {} }
const sha = (buf) => crypto.createHash('sha1').update(buf).digest('hex')
const log = (...a) => console.log('\x1b[38;5;178m[VAULT]\x1b[0m', ...a)

// penulis atomik: tulis ke file sementara di folder yang sama, lalu rename (atomik di OS yang sama)
const realWrite = fs.writeFileSync.bind(fs)
function atomicWrite(file, data, mode = 0o600) {
  const tmp = `${file}.${process.pid}.tmp`
  try { realWrite(tmp, data, { mode }); fs.renameSync(tmp, file) }
  catch (e) { try { fs.unlinkSync(tmp) } catch {} throw e }
}
function parseOk(buf) { try { if (!buf || !buf.length) return false; JSON.parse(buf.toString('utf8')); return true } catch { return false } }
const fileOk = (f) => { try { return parseOk(fs.readFileSync(f)) } catch { return false } }
const dbFiles = () => { try { return fs.readdirSync(DBDIR).filter((f) => f.endsWith('.json')) } catch { return [] } }
// file yang sengaja TIDAK dicadangkan (bisa dibuat ulang / berisi log)
const SKIP = new Set(['shield.json', 'integrity.json'])

// ───────────── ZIP minimal (tanpa dependensi): baca & tulis ─────────────
const CRCT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRCT[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0 }
function zipBuild(files) {
  const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
  const locals = [], centrals = []; let off = 0, n = 0
  for (const [name, data] of Object.entries(files)) {
    const nb = Buffer.from(name, 'utf8'), comp = zlib.deflateRawSync(data, { level: 6 }), crc = crc32(data)
    const lh = Buffer.alloc(30)
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8); lh.writeUInt16LE(tm, 10); lh.writeUInt16LE(dt, 12)
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nb.length, 26)
    const ch = Buffer.alloc(46)
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(tm, 12); ch.writeUInt16LE(dt, 14)
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt32LE(off, 42)
    locals.push(lh, nb, comp); centrals.push(ch, nb); off += 30 + nb.length + comp.length; n++
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(n, 8); end.writeUInt16LE(n, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16)
  return Buffer.concat([...locals, cd, end])
}
// baca zip → { nama: Buffer }, melempar error kalau rusak (CRC diperiksa)
function zipRead(buf) {
  let e = -1; for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break }
  if (e < 0) throw new Error('bukan file zip / rusak')
  const count = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16); const out = {}
  for (let k = 0; k < count; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('direktori zip rusak')
    const method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16), cs = buf.readUInt32LE(p + 20), us = buf.readUInt32LE(p + 24)
    const nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), lo = buf.readUInt32LE(p + 42)
    const name = buf.slice(p + 46, p + 46 + nl).toString('utf8'); p += 46 + nl + xl + cl
    const ln = buf.readUInt16LE(lo + 26), lx = buf.readUInt16LE(lo + 28), ds = lo + 30 + ln + lx
    const raw = buf.slice(ds, ds + cs), data = method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : null
    if (!data) throw new Error('metode kompresi tak didukung')
    if (data.length !== us || crc32(data) !== crc) throw new Error('CRC tidak cocok: ' + name)
    out[name] = data
  }
  return out
}

// ───────────── state ─────────────
let ST = { running: false, bootAt: 0, lastSnap: 0, lastSnapFile: '', lastHash: '', lastSessHash: '', cleanExit: true, snapCount: 0, healed: [], quarantined: [], restoredFrom: '', unclean: false, errors: 0 }
function loadState() { try { ST = Object.assign(ST, JSON.parse(fs.readFileSync(STATEFILE, 'utf8'))) } catch {} }
function saveState() { try { mkdir(BKDIR); atomicWrite(STATEFILE, JSON.stringify(ST)) } catch {} }

// ───────────── pasang penulis atomik untuk lib/database/*.json ─────────────
let hardened = false
function hardenWrites() {
  if (hardened) return; hardened = true
  const dbPrefix = DBDIR + path.sep
  fs.writeFileSync = function (file, data, opt) {
    if (typeof file === 'string' && file.endsWith('.json')) {
      const abs = path.resolve(file)
      if (abs.startsWith(dbPrefix)) {
        const tmp = `${abs}.${process.pid}.tmp`
        try { realWrite(tmp, data, opt); fs.renameSync(tmp, abs); return } catch (e) { try { fs.unlinkSync(tmp) } catch {} throw e }
      }
    }
    return realWrite.apply(fs, arguments)
  }
}

// ───────────── daftar snapshot ─────────────
function list() {
  let fl = []; try { fl = fs.readdirSync(SNAPDIR).filter((f) => /^chisa-\d{8}-\d{6}-[a-z]+\.zip$/.test(f)) } catch {}
  return fl.sort().reverse().map((file, i) => {
    const id = file.slice(9, -4), full = path.join(SNAPDIR, file); let size = 0; try { size = fs.statSync(full).size } catch {}
    const m = id.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-(\w+)$/)
    return { no: i + 1, id, file, full, size, reason: m ? m[7] : '?', label: m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}` : id }
  })
}
function resolve(ref) {
  const L = list(); if (!L.length) return null
  const r = String(ref || '1').trim()
  if (/^\d{1,3}$/.test(r)) return L[Number(r) - 1] || null
  return L.find((x) => x.id === r) || L.find((x) => x.id.startsWith(r)) || null
}

// ───────────── karantina file rusak (bukti, tidak dihapus) ─────────────
function quarantine(file, why) {
  try {
    mkdir(QUARANTINE)
    const dest = path.join(QUARANTINE, `${stamp()}-${path.basename(file)}`)
    fs.copyFileSync(file, dest); ST.quarantined.push(path.basename(file) + ' (' + why + ')'); ST.quarantined = ST.quarantined.slice(-20)
    const q = fs.readdirSync(QUARANTINE).sort(); for (const f of q.slice(0, Math.max(0, q.length - 40))) { try { fs.unlinkSync(path.join(QUARANTINE, f)) } catch {} }
  } catch {}
}

// ───────────── snapshot ─────────────
function sessionDir() { return path.resolve(ROOT, global.sessionName || 'session') }
function credsOk(dir) { try { const j = JSON.parse(fs.readFileSync(path.join(dir, 'creds.json'), 'utf8')); return !!(j && j.noiseKey && j.signedIdentityKey) } catch { return false } }

function snapshot(reason = 'auto', opt = {}) {
  if (!CFG.enabled) return { ok: false, skipped: 'nonaktif' }
  mkdir(BKDIR); mkdir(SNAPDIR); mkdir(MIRROR)
  const files = {}, bad = []
  for (const f of dbFiles()) {
    if (SKIP.has(f)) continue
    let buf; try { buf = fs.readFileSync(path.join(DBDIR, f)) } catch { continue }
    if (parseOk(buf)) files['database/' + f] = buf
    else { bad.push(f); quarantine(path.join(DBDIR, f), 'rusak saat snapshot') }   // file rusak TIDAK menimpa cadangan sehat
  }
  const names = Object.keys(files).sort()
  const hash = sha(Buffer.concat(names.map((n) => Buffer.concat([Buffer.from(n), files[n]]))))
  if (!['manual', 'prerestore'].includes(reason) && hash === ST.lastHash && !bad.length) { ST.lastCheck = Date.now(); return { ok: true, skipped: 'tidak ada perubahan' } }
  const total = names.reduce((a, n) => a + files[n].length, 0)
  const meta = { app: 'chisa-ai', versi: '4.3', waktu: new Date().toISOString(), alasan: reason, file: names.length, byte: total, hash, rusak: bad }
  const zipFiles = Object.assign({ 'meta.json': Buffer.from(JSON.stringify(meta, null, 2)) }, files)
  const name = `chisa-${stamp()}-${reason.replace(/[^a-z]/g, '') || 'auto'}.zip`
  const full = path.join(SNAPDIR, name)
  try { atomicWrite(full, zipBuild(zipFiles)) } catch (e) { ST.errors++; log('gagal menulis snapshot:', e.message); return { ok: false, error: e.message } }
  // salinan mentah terakhir (mudah disalin manual lewat file manager panel)
  for (const n of names) { try { atomicWrite(path.join(MIRROR, n.slice(9)), files[n]) } catch {} }
  try { const keep = new Set(names.map((n) => n.slice(9))); for (const f of fs.readdirSync(MIRROR)) if (!keep.has(f) && f.endsWith('.json') && !fs.existsSync(path.join(DBDIR, f))) fs.unlinkSync(path.join(MIRROR, f)) } catch {}
  ST.lastSnap = Date.now(); ST.lastSnapFile = name; ST.lastHash = hash; ST.snapCount++; ST.lastBytes = fs.statSync(full).size
  rotate()
  if (CFG.session && !opt.noSession) snapshotSession()
  saveState()
  return { ok: true, file: name, files: names.length, bytes: total, zipBytes: ST.lastBytes, bad }
}

function snapshotSession() {
  try {
    const dir = sessionDir(); if (!credsOk(dir)) return
    mkdir(SESSDIR_BK)
    const files = {}; let total = 0
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f); let st; try { st = fs.statSync(p) } catch { continue }
      if (!st.isFile() || !/^[\w.\-@+]+$/.test(f)) continue
      total += st.size; if (total > CFG.sessionMaxMB * 1048576) { return }
      files['session/' + f] = fs.readFileSync(p)
    }
    const names = Object.keys(files).sort()
    const h = sha(Buffer.concat(names.map((n) => Buffer.concat([Buffer.from(n), files[n]]))))
    if (h === ST.lastSessHash) return
    atomicWrite(path.join(SESSDIR_BK, `session-${stamp()}.zip`), zipBuild(files)); ST.lastSessHash = h
    atomicWrite(path.join(SESSDIR_BK, 'creds.json'), files['session/creds.json'])
    const all = fs.readdirSync(SESSDIR_BK).filter((f) => /^session-.*\.zip$/.test(f)).sort()
    for (const f of all.slice(0, Math.max(0, all.length - CFG.sessionKeep))) { try { fs.unlinkSync(path.join(SESSDIR_BK, f)) } catch {} }
  } catch (e) { ST.errors++ }
}

function rotate() {
  try {
    const L = list(), keep = new Set(L.slice(0, CFG.keep).map((x) => x.file)), days = new Set()
    for (const x of L) { const d = x.id.slice(0, 8); if (!days.has(d)) { days.add(d); if (days.size <= CFG.keepDays) keep.add(x.file) } }
    let pm = 0; for (const x of L) if (/^(manual|prerestore)$/.test(x.reason) && pm++ < 10) keep.add(x.file)
    for (const x of L) if (!keep.has(x.file)) { try { fs.unlinkSync(x.full) } catch {} }
    // batas ukuran total: hapus yang paling lama (selain 3 terbaru) kalau melebihi
    let rest = list(), size = rest.reduce((a, x) => a + x.size, 0)
    while (size > CFG.maxMB * 1048576 && rest.length > 3) { const o = rest.pop(); try { fs.unlinkSync(o.full); size -= o.size } catch { break } }
  } catch {}
}

// ───────────── baca isi snapshot ─────────────
function readSnapshot(ref) {
  const s = typeof ref === 'object' ? ref : resolve(ref); if (!s) throw new Error('snapshot tidak ditemukan')
  const z = zipRead(fs.readFileSync(s.full)), db = {}
  for (const [n, b] of Object.entries(z)) if (/^database\/[\w.\-]+\.json$/.test(n)) { if (!parseOk(b)) throw new Error('isi rusak: ' + n); db[n.slice(9)] = b }
  return { snap: s, db, meta: z['meta.json'] ? JSON.parse(z['meta.json'].toString()) : {} }
}
function applyDb(db) { let n = 0; mkdir(DBDIR); for (const [f, b] of Object.entries(db)) { atomicWrite(path.join(DBDIR, f), b); n++ } return n }

// ───────────── restore (dijalankan saat boot supaya memori bot tidak menimpa) ─────────────
function stageRestore(ref) {
  const s = resolve(ref); if (!s) return { ok: false, msg: 'Snapshot tidak ditemukan. Lihat daftar: .backup list' }
  try { readSnapshot(s) } catch (e) { return { ok: false, msg: 'Snapshot rusak: ' + e.message } }
  snapshot('prerestore', { noSession: true })
  mkdir(BKDIR); atomicWrite(PENDING, JSON.stringify({ id: s.id, at: Date.now() }))
  return { ok: true, snap: s }
}
function applyPending() {
  let p; try { p = JSON.parse(fs.readFileSync(PENDING, 'utf8')) } catch { return null }
  try { fs.unlinkSync(PENDING) } catch {}
  try { const r = readSnapshot(p.id); const n = applyDb(r.db); ST.restoredFrom = p.id; log(`restore dari ${p.id}: ${n} file dipulihkan`); return { id: p.id, n } }
  catch (e) { log('restore tertunda gagal:', e.message); return { id: p.id, error: e.message } }
}
function restoreNow(ref) { const r = readSnapshot(ref); snapshot('prerestore', { noSession: true }); const n = applyDb(r.db); ST.restoredFrom = r.snap.id; saveState(); return { id: r.snap.id, n } }

// ───────────── self-heal (dipanggil sebelum modul lain memuat data) ─────────────
function heal() {
  mkdir(DBDIR); mkdir(BKDIR); mkdir(SNAPDIR); mkdir(MIRROR)
  const healed = []
  try { for (const f of fs.readdirSync(DBDIR)) if (f.endsWith('.tmp')) { try { fs.unlinkSync(path.join(DBDIR, f)) } catch {} } } catch {}
  // 1) restore yang diminta lewat .backup restore
  const pend = applyPending(); if (pend && !pend.error) healed.push(`restore ${pend.id} (${pend.n} file)`)
  // 2) pulihkan dari salinan mentah terakhir bila ada file hilang / rusak / kosong
  let mir = []; try { mir = fs.readdirSync(MIRROR).filter((f) => f.endsWith('.json')) } catch {}
  for (const f of mir) {
    const dest = path.join(DBDIR, f), src = path.join(MIRROR, f)
    if (!fileOk(src)) continue
    let need = ''
    if (!fs.existsSync(dest)) need = 'hilang'
    else if (!fileOk(dest)) { need = 'rusak'; quarantine(dest, 'rusak saat boot') }
    if (need) { try { atomicWrite(dest, fs.readFileSync(src)); healed.push(`${f} (${need})`) } catch {} }
  }
  // 3) mirror kosong tapi ada snapshot zip (mis. folder latest terhapus) → ambil dari snapshot terbaru yang sehat
  if (!mir.length) {
    for (const s of list().slice(0, 5)) {
      try { const r = readSnapshot(s); for (const [f, b] of Object.entries(r.db)) { const dest = path.join(DBDIR, f); if (!fs.existsSync(dest) || !fileOk(dest)) { atomicWrite(dest, b); healed.push(`${f} (dari ${s.id})`) } } break } catch {}
    }
  }
  // 4) sesi WhatsApp: pulihkan HANYA bila creds.json ada tapi rusak
  try {
    const sd = sessionDir(), cf = path.join(sd, 'creds.json')
    if (CFG.session && fs.existsSync(cf) && !credsOk(sd)) {
      const zs = fs.existsSync(SESSDIR_BK) ? fs.readdirSync(SESSDIR_BK).filter((f) => /^session-.*\.zip$/.test(f)).sort().reverse() : []
      for (const zf of zs) {
        try {
          const z = zipRead(fs.readFileSync(path.join(SESSDIR_BK, zf)))
          if (!z['session/creds.json'] || !parseOk(z['session/creds.json'])) continue
          quarantine(cf, 'creds rusak')
          for (const [n, b] of Object.entries(z)) if (/^session\/[\w.\-@+]+$/.test(n)) atomicWrite(path.join(sd, n.slice(8)), b)
          healed.push(`sesi WhatsApp (dari ${zf})`); break
        } catch {}
      }
    }
  } catch {}
  ST.healed = healed
  return healed
}

// ───────────── verifikasi ─────────────
function verify() {
  const out = { db: [], badDb: [], mirror: 0, mirrorBad: [], snaps: [], badSnaps: [], session: credsOk(sessionDir()), sessionBackups: 0 }
  for (const f of dbFiles()) { if (SKIP.has(f)) continue; (fileOk(path.join(DBDIR, f)) ? out.db : out.badDb).push(f) }
  try { for (const f of fs.readdirSync(MIRROR)) if (f.endsWith('.json')) { if (fileOk(path.join(MIRROR, f))) out.mirror++; else out.mirrorBad.push(f) } } catch {}
  for (const s of list().slice(0, 5)) { try { const r = readSnapshot(s); out.snaps.push({ id: s.id, files: Object.keys(r.db).length }) } catch (e) { out.badSnaps.push({ id: s.id, err: e.message }) } }
  try { out.sessionBackups = fs.readdirSync(SESSDIR_BK).filter((f) => /^session-.*\.zip$/.test(f)).length } catch {}
  out.ok = !out.badDb.length && !out.badSnaps.length && !out.mirrorBad.length
  return out
}

function status() {
  const L = list(), v = (() => { try { return { db: dbFiles().filter((f) => !SKIP.has(f)).length } } catch { return { db: 0 } } })()
  return {
    enabled: CFG.enabled, every: CFG.every, keep: CFG.keep, count: L.length, newest: L[0] || null,
    totalBytes: L.reduce((a, x) => a + x.size, 0), lastSnap: ST.lastSnap, nextIn: ST.lastCheckStart ? Math.max(0, CFG.every - (Date.now() - ST.lastCheckStart)) : CFG.every,
    healed: ST.healed || [], quarantined: ST.quarantined || [], unclean: !!ST.unclean, restoredFrom: ST.restoredFrom, errors: ST.errors, dbFiles: v.db,
    session: CFG.session, sessionBackups: (() => { try { return fs.readdirSync(SESSDIR_BK).filter((f) => /^session-.*\.zip$/.test(f)).length } catch { return 0 } })(),
    dir: 'backup/', bootAt: ST.bootAt,
  }
}

// ───────────── siklus hidup ─────────────
let booted = false, timer = null, shuttingDown = false
function boot() {
  if (booted) return status(); booted = true
  mkdir(BKDIR); loadState()
  ST.unclean = ST.running === true && ST.cleanExit === false   // proses sebelumnya tidak sempat keluar rapi
  hardenWrites()
  let healed = []; try { healed = heal() } catch (e) { log('self-heal error:', e.message) }
  ST.running = true; ST.cleanExit = false; ST.bootAt = Date.now(); saveState()
  if (healed.length) log(`\x1b[33mpulih otomatis ${healed.length} item:\x1b[0m ${healed.join(', ')}`)
  if (ST.unclean) log('proses sebelumnya berhenti mendadak (restart panel / crash) — data diperiksa & aman')
  process.on('exit', () => { if (!ST.running) return; ST.running = false; ST.cleanExit = true; saveState() })   // keluar normal = rapi
  installShutdown()
  return status()
}
function installShutdown() {
  if (!CFG.onShutdown) return
  const bye = (sig) => {
    if (shuttingDown) return; shuttingDown = true
    log(`${sig} diterima — menyimpan semua data sebelum berhenti…`)
    try { process.emit('exit', 0) } catch {}                  // semua modul menulis memori ke disk (handler 'exit' mereka)
    try { snapshot('shutdown', { noSession: true }) } catch {}
    ST.running = false; ST.cleanExit = true; saveState()
    process.exit(0)
  }
  for (const s of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(s, () => bye(s))
}
function start(sock) {
  if (!CFG.enabled || timer) return
  ST.lastCheckStart = Date.now()
  setTimeout(() => { try { snapshot('boot') } catch {} }, 20000).unref()      // cadangan awal setelah bot stabil
  timer = setInterval(() => { ST.lastCheckStart = Date.now(); try { snapshot('auto') } catch (e) { ST.errors++ } }, CFG.every); timer.unref()
}
// laporan untuk owner sesudah tersambung (hanya bila ada kejadian penting)
function bootReport() {
  const lines = []
  if (ST.unclean) lines.push('⚠ Bot sebelumnya mati mendadak (restart panel / crash). Data sudah diperiksa.')
  if (ST.healed && ST.healed.length) lines.push('✦ Dipulihkan otomatis: ' + ST.healed.slice(0, 6).join(', ') + (ST.healed.length > 6 ? ` +${ST.healed.length - 6}` : ''))
  return lines.length ? lines.join('\n') : ''
}

module.exports = { boot, start, snapshot, list, resolve, readSnapshot, stageRestore, restoreNow, verify, status, bootReport, zipBuild, zipRead, CFG, dirs: { BKDIR, SNAPDIR, MIRROR, QUARANTINE } }

// ───────────── CLI (konsol panel) ─────────────
if (require.main === module) {
  require('../config'); const a = process.argv.slice(2), c = (a[0] || 'help').toLowerCase()
  loadState()
  const fmt = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(1) + ' KB'
  if (c === 'list') { const L = list(); console.log(L.length ? L.map((x) => `${String(x.no).padStart(2)}. ${x.label}  ${x.reason.padEnd(10)} ${fmt(x.size)}  [${x.id}]`).join('\n') : 'Belum ada snapshot.') }
  else if (c === 'snapshot') { hardenWrites(); console.log(snapshot('manual')) }
  else if (c === 'verify') { console.log(JSON.stringify(verify(), null, 2)) }
  else if (c === 'restore') { try { console.log(restoreNow(a[1] || '1')); console.log('Selesai. Jalankan ulang bot.') } catch (e) { console.log('Gagal:', e.message) } }
  else if (c === 'restore-session') {
    const zs = fs.existsSync(SESSDIR_BK) ? fs.readdirSync(SESSDIR_BK).filter((f) => /^session-.*\.zip$/.test(f)).sort().reverse() : []
    if (!zs.length) console.log('Tidak ada cadangan sesi.')
    else { const z = zipRead(fs.readFileSync(path.join(SESSDIR_BK, zs[0]))); const sd = sessionDir(); mkdir(sd); let n = 0; for (const [k, b] of Object.entries(z)) if (/^session\/[\w.\-@+]+$/.test(k)) { atomicWrite(path.join(sd, k.slice(8)), b); n++ } console.log(`Sesi dipulihkan dari ${zs[0]} (${n} file).`) }
  }
  else console.log('Pakai: node lib/backup.js list | snapshot | verify | restore <no|id> | restore-session')
}
