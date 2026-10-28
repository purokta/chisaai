// Pintu masuk bot di dalam aplikasi Android (nodejs-mobile, Node 18): pindah ke folder bot lalu jalankan index.js
process.chdir(__dirname)
// Node 18 belum punya crypto global (dipakai Baileys terbaru)
if (!globalThis.crypto) globalThis.crypto = require('crypto').webcrypto
require('./index.js')
