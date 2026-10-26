// "sharp" dimuat malas: plugin tetap bisa dimuat walau sharp belum terpasang (Termux).
// Hanya perintah gambar yang membutuhkannya yang akan menjawab dengan petunjuk pemasangan.
let real
function load() {
  if (real) return real
  try { real = require('sharp') } catch {
    const e = new Error('Fitur gambar ini butuh modul "sharp". Di Termux jalankan: pkg install libvips binutils -y && npm i sharp --legacy-peer-deps')
    e.userMessage = e.message
    throw e
  }
  return real
}
const shim = new Proxy(function () {}, {
  apply: (_t, _this, args) => load()(...args),
  get: (t, k) => (k === 'then' ? undefined : k === 'available' ? t.available : load()[k]),
})
shim.available = () => { try { load(); return true } catch { return false } }
module.exports = shim
