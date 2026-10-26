/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Target .swgc (status grup) per owner — lib/database/swgc.json
//   mode: 'ini'   = hanya grup tempat perintah dipakai (bawaan)
//         'pilih' = grup-grup yang dipilih lewat tombol (ids)
//         'semua' = semua grup tempat bot berada
const DB = require('./jsondb')('swgc')
const MODES = ['ini', 'pilih', 'semua']
function get(user) {
  const c = DB.data[user] || {}
  return { mode: MODES.includes(c.mode) ? c.mode : 'ini', ids: Array.isArray(c.ids) ? c.ids.slice() : [] }
}
function put(user, cfg) { DB.data[user] = { mode: cfg.mode, ids: cfg.ids }; DB.save() }
function setMode(user, mode) { if (!MODES.includes(mode)) return false; const c = get(user); c.mode = mode; put(user, c); return true }
// tambah / hapus satu grup dari pilihan; otomatis pindah ke mode 'pilih'. -> true bila ditambahkan, false bila dihapus
function toggle(user, id) {
  const c = get(user), i = c.ids.indexOf(id)
  if (i >= 0) c.ids.splice(i, 1); else c.ids.push(id)
  c.mode = 'pilih'; put(user, c); return i < 0
}
function clear(user) { const c = get(user); c.ids = []; put(user, c) }
module.exports = { get, setMode, toggle, clear, MODES }
