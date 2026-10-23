// Baileys (libsignal) mencetak dump sesi enkripsi yang panjang ke layar saat sesi diperbarui.
// Itu normal dan tidak berbahaya, jadi disembunyikan supaya log tetap bersih.
const NOISE = /^(Closing session|Decrypted message with closed session|Removing old closed session|Session already (closed|open)|Opening session|Migrating session)/

for (const level of ['log', 'info', 'warn', 'debug']) {
  const original = console[level].bind(console)
  console[level] = (...args) => {
    if (typeof args[0] === 'string' && NOISE.test(args[0])) return
    original(...args)
  }
}
