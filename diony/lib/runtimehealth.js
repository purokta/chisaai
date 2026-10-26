/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Runtime telemetry lokal: hanya agregat event, tanpa menyimpan isi pesan atau nomor pengguna.
const os = require('os')
const startedAt = Date.now()
const counts = Object.create(null)
const errors = []
function hit(name, n = 1) {
  const key = String(name || 'unknown').slice(0, 48)
  counts[key] = (counts[key] || 0) + Math.max(1, Number(n) || 1)
}
function error(area, err) {
  errors.unshift({ at: Date.now(), area: String(area || 'unknown').slice(0, 48), message: String(err?.message || err || 'unknown').slice(0, 180) })
  if (errors.length > 30) errors.length = 30
  hit('errors')
}
function snapshot() {
  const m = process.memoryUsage()
  return {
    uptimeMs: Date.now() - startedAt,
    processUptime: process.uptime(),
    node: process.version,
    platform: `${os.platform()} ${os.arch()}`,
    memory: { rss: m.rss, heapUsed: m.heapUsed, heapTotal: m.heapTotal, external: m.external },
    counts: { ...counts }, errors: errors.slice(0, 10),
  }
}
const fmtBytes = (n) => { if (!Number.isFinite(n)) return '?'; const u = ['B','KB','MB','GB']; let i=0, x=n; while (x>=1024 && i<u.length-1) { x/=1024; i++ } return `${x.toFixed(i ? 1 : 0)} ${u[i]}` }
const fmtDuration = (ms) => { let s=Math.floor(Math.max(0,ms)/1000); const d=Math.floor(s/86400); s%=86400; const h=Math.floor(s/3600); s%=3600; const m=Math.floor(s/60); s%=60; return [d?`${d}h`:null,h?`${h}j`:null,m?`${m}m`:null,`${s}dtk`].filter(Boolean).join(' ') }
module.exports = { hit, error, snapshot, fmtBytes, fmtDuration }
