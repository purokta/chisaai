// Mengirim banner video (GIF) TANPA mengunggah ulang tiap menu.
// Pertama kali: dikirim biasa (diunggah ke server WhatsApp), lalu data medianya (link terenkripsi + kunci) disimpan.
// Menu berikutnya memakai ulang media yang sama: cepat, tetap berputar terus (gifPlayback). Kalau gagal/kedaluwarsa,
// otomatis diunggah ulang.
const fs = require('fs')
const crypto = require('crypto')
const db = require('./db')

const TTL = 5 * 24 * 3600 * 1000 // media WhatsApp bertahan beberapa minggu; pakai 5 hari supaya aman

// objek proto -> JSON (Uint8Array jadi base64, Long jadi angka)
function ser(v) {
  if (v == null) return v
  if (v instanceof Uint8Array) return { $b: Buffer.from(v).toString('base64') }
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber()
  if (Array.isArray(v)) return v.map(ser)
  if (typeof v === 'object') {
    const o = {}
    for (const [k, x] of Object.entries(v)) if (typeof x !== 'function') o[k] = ser(x)
    return o
  }
  return v
}
function des(v) {
  if (v == null) return v
  if (typeof v === 'object' && typeof v.$b === 'string') return Buffer.from(v.$b, 'base64')
  if (Array.isArray(v)) return v.map(des)
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, des(x)]))
  return v
}

const sigOf = file => {
  const st = fs.statSync(file)
  return crypto.createHash('md5').update(file + st.size + st.mtimeMs).digest('hex').slice(0, 12)
}

async function relay(ctx, vm, caption) {
  const { loadBaileys } = require('./baileys')
  const B = await loadBaileys()
  const content = { videoMessage: { ...vm, caption, gifPlayback: true } }
  const msg = B.generateWAMessageFromContent(ctx.jid, content, { userJid: ctx.sock.user?.id, quoted: ctx.m })
  await ctx.sock.relayMessage(ctx.jid, msg.message, { messageId: msg.key.id })
  ctx.sock.trackSent?.(msg.key, msg.message) // supaya bisa dikirim ulang bila penerima gagal membuka ("waiting for this message")
  return msg
}

// kirim banner + keterangan. Mengembalikan true bila terkirim.
async function send(ctx, file, caption) {
  const sig = sigOf(file)
  const c = db.get('bannerMedia', null)
  if (c && c.sig === sig && Date.now() - c.t < TTL && c.vm) {
    try {
      await relay(ctx, des(c.vm), caption)
      return true
    } catch (e) {
      console.log('[banner] pakai ulang media gagal, unggah ulang:', e?.message || e)
    }
  }
  const res = await ctx.send({ video: fs.readFileSync(file), mimetype: 'video/mp4', gifPlayback: true, caption })
  try {
    const vm = res?.message?.videoMessage
    if (vm) db.set('bannerMedia', { sig, t: Date.now(), vm: ser(vm) })
  } catch (e) {
    console.log('[banner] gagal menyimpan cache media:', e?.message || e)
  }
  return true
}

module.exports = { send, ser, des }
