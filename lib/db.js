// Penyimpanan pengaturan sederhana (mode public/private, auto-reply) di data/db.json
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'data', 'db.json')
let data = {}
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch {}

function save() {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
  } catch (e) {
    console.log('Gagal menyimpan db:', e.message)
  }
}

module.exports = {
  get: (key, fallback) => (key in data ? data[key] : fallback),
  set: (key, value) => {
    data[key] = value
    save()
  },
  all: () => data
}
