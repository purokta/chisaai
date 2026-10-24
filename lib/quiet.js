// Baileys (libsignal) mencetak dump sesi enkripsi yang panjang ke layar saat sesi diperbarui.
// Itu normal dan tidak berbahaya, jadi disembunyikan supaya log tetap bersih.
const NOISE = /^(Closing session|Decrypted message with closed session|Removing old closed session|Session already (closed|open)|Opening session|Migrating session)/

// Kegagalan dekripsi pesan lama / dari perangkat yang sesinya sudah tidak cocok. Tidak berbahaya, hanya berisik.
const DECRYPT = /(Bad MAC|Failed to decrypt message with any known session|No matching sessions found|Over 2000 messages into the future|Session error)/

const noisy = args =>
  args.some(a => (typeof a === 'string' && DECRYPT.test(a)) || (a instanceof Error && DECRYPT.test(a.message || '')))

for (const level of ['log', 'info', 'warn', 'debug', 'error']) {
  const original = console[level].bind(console)
  console[level] = (...args) => {
    if (typeof args[0] === 'string' && NOISE.test(args[0])) return
    if (noisy(args)) return
    original(...args)
  }
}
