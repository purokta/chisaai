/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Penyimpan JSON kecil serbaguna (lib/database/<nama>.json), ditulis tertunda agar hemat disk.
//   const db = require('./jsondb')('level');  db.data (objek utama)  db.save()
const fs = require('fs'), path = require('path')
const cache = new Map()
module.exports = function jsondb(name) {
  if (cache.has(name)) return cache.get(name)
  const file = path.join(global.dionyData, name + '.json')
  let data = {}; try { data = JSON.parse(fs.readFileSync(file, 'utf8')) } catch {}
  let t = null
  const flush = () => { try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data)) } catch (e) { console.log(`[jsondb:${name}]`, e.message) } }
  const api = { data, save() { if (t) return; t = setTimeout(() => { t = null; flush() }, 2000); if (t.unref) t.unref() }, flush }
  process.on('exit', flush)
  cache.set(name, api); return api
}
