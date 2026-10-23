// Memuat semua perintah dari folder commands/ (satu file = satu atau beberapa perintah)
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'commands')
let list = []
const map = new Map()

function register(cmd, file) {
  if (!cmd || typeof cmd.name !== 'string' || typeof cmd.run !== 'function') {
    console.log(`[loader] ${file}: perintah dilewati (butuh "name" dan fungsi "run")`)
    return
  }
  const names = [cmd.name, ...(cmd.aliases || [])].map(n => n.toLowerCase())
  for (const n of names) {
    if (map.has(n)) console.log(`[loader] ${file}: nama "${n}" bentrok dengan perintah lain, ditimpa`)
    map.set(n, cmd)
  }
  list.push(cmd)
}

function load() {
  list = []
  map.clear()
  for (const file of fs.readdirSync(DIR).sort()) {
    if (!file.endsWith('.js') || file.startsWith('_')) continue
    const full = path.join(DIR, file)
    try {
      delete require.cache[require.resolve(full)]
      for (const cmd of [].concat(require(full))) register(cmd, file)
    } catch (e) {
      console.log(`[loader] Gagal memuat ${file}: ${e.message}`)
    }
  }
  return list.length
}

module.exports = {
  load,
  find: name => map.get(String(name).toLowerCase()),
  list: () => list
}
