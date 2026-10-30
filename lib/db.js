// Penyimpanan pengaturan sederhana (mode public/private, auto-reply, dll) di data/db.json
// Tulis ke disk ditunda & digabung (tidak memblokir bot tiap perubahan), dan dijamin tersimpan saat proses berhenti.
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'data', 'db.json')
let data = {}
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch {}

let timer = null
function flush() {
  clearTimeout(timer); timer = null
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const tmp = file + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data))
    fs.renameSync(tmp, file)
  } catch (e) {
    console.log('Gagal menyimpan db:', e.message)
  }
}
function save() {
  if (timer) return
  timer = setTimeout(flush, 400)
}
process.on('exit', () => { if (timer) flush() })

module.exports = {
  get: (key, fallback) => (key in data ? data[key] : fallback),
  set: (key, value) => {
    data[key] = value
    save()
  },
  all: () => data,
  flush
}
