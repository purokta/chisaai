/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Profil ringan per pengguna: kota & tanggal lahir
const fs = require('fs'), path = require('path')
const FILE = path.join(global.chisaData, 'profile.json')
let db = {}; try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch {}
let t = null; const save = () => { if (t) return; t = setTimeout(() => { t = null; try { fs.writeFileSync(FILE, JSON.stringify(db)) } catch {} }, 1500) }
process.on('exit', () => { try { fs.writeFileSync(FILE, JSON.stringify(db)) } catch {} })
module.exports = { get: (j) => db[j] || {}, set: (j, k, v) => { (db[j] = db[j] || {})[k] = v; save() }, del: (j, k) => { if (db[j]) delete db[j][k]; save() } }
