// Baileys (libsignal) mencetak dump sesi enkripsi + stack trace panjang ke layar saat sesi diperbarui
// ("Closing session", "Bad MAC", "Failed to decrypt ..."). Itu normal dan tidak berbahaya, jadi disembunyikan
// supaya log tetap bersih. Disaring di dua tingkat: console.* dan tulisan langsung ke stdout/stderr.
const NOISE = /(Closing (open )?session|Decrypted message with closed session|Removing old closed session|Session already (closed|open)|Opening session|Migrating session|SessionEntry \{|incoming prekey bundle)/

// Kegagalan dekripsi pesan lama / dari perangkat yang sesinya sudah tidak cocok. Tidak berbahaya, hanya berisik.
const DECRYPT = /(Bad MAC|Failed to decrypt message with any known session|No matching sessions found|Over 2000 messages into the future|Session error|SessionCipher\.|_asyncQueueExecutor|verifyMAC)/

const isNoise = s => typeof s === 'string' && (NOISE.test(s) || DECRYPT.test(s))
const argNoise = args =>
  args.some(a => isNoise(a) || (a instanceof Error && isNoise(`${a.message}\n${a.stack || ''}`)) || (a && typeof a === 'object' && a.constructor?.name === 'SessionEntry'))

for (const level of ['log', 'info', 'warn', 'debug', 'error']) {
  const original = console[level].bind(console)
  console[level] = (...args) => {
    if (argNoise(args)) return
    original(...args)
  }
}

module.exports = { isNoise, argNoise }

// jaring kedua: tulisan langsung ke stdout/stderr (mis. dari library yang tidak lewat console)
let dumping = false
for (const stream of [process.stdout, process.stderr]) {
  const write = stream.write.bind(stream)
  stream.write = (chunk, ...rest) => {
    const s = typeof chunk === 'string' ? chunk : Buffer.isBuffer(chunk) ? chunk.toString('utf8') : ''
    if (s) {
      if (isNoise(s)) {
        // dump objek multi-baris yang terpotong antar-tulisan: sembunyikan sampai penutup "}" di awal baris
        dumping = /\{\s*$/.test(s.trimEnd().split('\n')[0] || '') && !/^\}/m.test(s)
        const cb = rest.find(r => typeof r === 'function')
        if (cb) cb()
        return true
      }
      if (dumping) {
        if (/^\}/m.test(s)) dumping = false
        const cb = rest.find(r => typeof r === 'function')
        if (cb) cb()
        return true
      }
    }
    return write(chunk, ...rest)
  }
}
