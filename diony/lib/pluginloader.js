/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Loader plugin Dionysus — baca semua file di ./plugins/**.js, hot-reload saat file diubah.
// Format plugin:
//   module.exports = {
//     name: 'ping', alias: ['p'], category: 'main', desc: 'Cek bot',
//     owner:false, premium:false, group:false, private:false, admin:false, botAdmin:false,
//     run: async (ctx) => { ctx.reply('pong') }
//   }
const fs = require('fs')
const path = require('path')
const DIR = path.join(__dirname, '..', 'plugins')
const cmds = new Map()   // nama/alias -> plugin
const files = new Map()  // path -> plugin

function walk(d) {
  let out = []
  for (const e of (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {   // urutan tetap di semua platform: jika dua plugin berbagi alias, pemenangnya selalu sama
    const p = path.join(d, e.name)
    if (e.isDirectory()) out = out.concat(walk(p))
    else if (e.name.endsWith('.js')) out.push(p)
  }
  return out
}
function unregister(file) {
  const old = files.get(file); if (!old) return
  for (const k of [old.name, ...(old.alias || [])]) if (cmds.get(String(k).toLowerCase()) === old) cmds.delete(String(k).toLowerCase())
  files.delete(file)
}
function load(file) {
  unregister(file)
  try {
    delete require.cache[require.resolve(file)]
    const p = require(file)
    if (!p || typeof p.run !== 'function' || !p.name) return false
    p.category = p.category || path.basename(path.dirname(file))
    for (const k of [p.name, ...(p.alias || [])]) cmds.set(String(k).toLowerCase(), p)
    files.set(file, p)
    return true
  } catch (e) { console.log('[plugin] gagal load', path.relative(DIR, file), '-', e.message); return false }
}
function loadAll() { cmds.clear(); files.clear(); let n = 0; for (const f of walk(DIR)) if (load(f)) n++; return n }

let timer = null
function watch() {
  try {
    fs.watch(DIR, { recursive: true }, (_, name) => {
      if (!name || !name.endsWith('.js')) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        const f = path.join(DIR, name)
        if (fs.existsSync(f)) { if (load(f)) console.log('[plugin] reload', name) } else unregister(f)
      }, 250)
    })
  } catch {}
}
const get = (c) => cmds.get(String(c || '').toLowerCase())
const list = () => [...new Set(files.values())]
const names = () => [...cmds.keys()]   // semua nama command + alias yang terdaftar
function byCategory() {
  const o = {}
  for (const p of list()) (o[p.category] = o[p.category] || []).push(p)
  for (const k of Object.keys(o)) o[k].sort((a, b) => a.name.localeCompare(b.name))
  return o
}
module.exports = { loadAll, watch, get, list, names, byCategory }
