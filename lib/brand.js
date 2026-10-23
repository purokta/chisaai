// Watermark CHISA-AI. Dipakai di menu, #status, dan log awal.
// Teks dicek dengan hash; kalau file ini diubah, teks asli otomatis dipulihkan.
const crypto = require('crypto')

const ORIGINAL = '@sipurse'
const ENCODED = 'QHNpcHVyc2U='
const SUM = 'e8764d0b6a47956412343f1625e6d06912d053d02db2f746151ad06583a64248'

const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex')

function mark() {
  try {
    const v = Buffer.from(ENCODED, 'base64').toString()
    if (sha(v) === SUM) return v
  } catch {}
  return ORIGINAL
}

module.exports = { mark }
