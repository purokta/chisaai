/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PESAN TAK TERLIHAT (steganografi)
//   .sembunyi <pesan> [| sandi]   (reply / kirim gambar) -> gambar yang tampak biasa tapi menyimpan pesan di dalam pikselnya
//   .ungkap [sandi]               (reply gambar/dokumen hasil .sembunyi) -> baca pesan tersembunyi
//   .bisik <rahasia> | <teks biasa>  -> teks yang tampak biasa saja, padahal membawa pesan rahasia (karakter lebar-nol)
//   .intip                         (reply teks hasil .bisik) -> baca rahasianya
// Gambar HARUS dikirim kembali sebagai DOKUMEN (bot sudah mengirimnya begitu) agar WhatsApp tidak mengompresnya.
const crypto = require('crypto')
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib')

const MAGIC = Buffer.from('DNY1')
const MAXSIDE = 1600

// ── enkripsi opsional: scrypt + AES-256-GCM ──
function seal(plain, pass) {
  if (!pass) return { flag: 0, data: plain }
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12), key = crypto.scryptSync(pass, salt, 32)
  const c = crypto.createCipheriv('aes-256-gcm', key, iv), enc = Buffer.concat([c.update(plain), c.final()])
  return { flag: 1, data: Buffer.concat([salt, iv, c.getAuthTag(), enc]) }
}
function unseal(data, flag, pass) {
  if (!flag) return data
  if (!pass) throw new Error('PASS')
  try {
    const salt = data.subarray(0, 16), iv = data.subarray(16, 28), tag = data.subarray(28, 44), enc = data.subarray(44)
    const d = crypto.createDecipheriv('aes-256-gcm', crypto.scryptSync(pass, salt, 32), iv); d.setAuthTag(tag)
    return Buffer.concat([d.update(enc), d.final()])
  } catch { throw new Error('WRONGPASS') }
}

// ── LSB: 1 bit per byte warna (R,G,B) ──
function embed(raw, payload) {
  const need = payload.length * 8; if (need > raw.length) return null
  const out = Buffer.from(raw)
  for (let i = 0; i < need; i++) out[i] = (out[i] & 0xFE) | ((payload[i >> 3] >> (7 - (i & 7))) & 1)
  return out
}
function readBytes(raw, from, n) {
  const out = Buffer.alloc(n)
  for (let i = 0; i < n * 8; i++) out[i >> 3] |= (raw[from * 8 + i] & 1) << (7 - (i & 7))
  return out
}
function extract(raw) {
  if (raw.length < 9 * 8) return null
  const head = readBytes(raw, 0, 9)
  if (!head.subarray(0, 4).equals(MAGIC)) return null
  const flag = head[4], len = head.readUInt32BE(5)
  if (len > (raw.length >> 3) - 9 || len > 200000) return null
  return { flag, data: readBytes(raw, 9, len) }
}

async function toRaw(buf) {
  const sharp = require('../../lib/sharp.js')
  let img = sharp(buf, { failOn: 'none' }).rotate()
  const meta = await img.metadata()
  if (Math.max(meta.width, meta.height) > MAXSIDE) img = img.resize({ width: MAXSIDE, height: MAXSIDE, fit: 'inside' })
  return img.flatten({ background: '#000' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
}

// ── teks lebar-nol: 1 bit per karakter (U+200B = 0, U+200C = 1) ──
const Z0 = '\u200B', Z1 = '\u200C'
function zwEncode(str) { const bytes = Buffer.concat([Buffer.from('DNY'), Buffer.from(str, 'utf8')]); let o = ''; for (const b of bytes) for (let i = 7; i >= 0; i--) o += (b >> i) & 1 ? Z1 : Z0; return o }
function zwDecode(text) {
  const bits = Array.from(String(text)).filter(c => c === Z0 || c === Z1).map(c => (c === Z1 ? 1 : 0)); if (bits.length < 32 || bits.length % 8) return null
  const bytes = Buffer.alloc(bits.length / 8); bits.forEach((b, i) => { bytes[i >> 3] |= b << (7 - (i & 7)) })
  return bytes.subarray(0, 3).toString() === 'DNY' ? bytes.subarray(3).toString('utf8') : null
}
const cover = (t, secret) => { const a = Array.from(t); return a[0] + secret + a.slice(1).join('') }

module.exports = {
  name: 'sembunyi', alias: ['ungkap', 'bisik', 'intip'], category: 'ajaib', noLimit: true, cmds: ['sembunyi', 'ungkap', 'bisik', 'intip'],
  desc: 'Sembunyikan pesan rahasia di dalam gambar (.sembunyi/.ungkap) atau teks tak terlihat (.bisik/.intip)',
  run: async ({ sock, m, text, command, prefix, reply }) => {
    // ── TEKS ──
    if (command === 'bisik') {
      const i = text.indexOf('|'); const secret = (i < 0 ? text : text.slice(0, i)).trim(), shown = (i < 0 ? 'Halo semuanya, apa kabar?' : text.slice(i + 1).trim()) || 'Halo semuanya, apa kabar?'
      if (!secret) return reply(`✦ ${B('BISIK')}\nTeks yang tampak biasa tapi menyimpan rahasia.\n\n${prefix}bisik <rahasia> | <teks yang terlihat>\nContoh: ${prefix}bisik kode brankas 4821 | Selamat pagi semua!\n\nPenerima membaca rahasianya dengan me-reply pesan itu: ${prefix}intip`)
      if (Buffer.byteLength(secret) > 300) return reply('✕ Rahasia maksimal 300 byte (sekitar 300 huruf).')
      await sock.sendMessage(m.chat, { text: cover(shown, zwEncode(secret)) })
      return reply(`✦ Terkirim. Pesan di atas tampak biasa saja, tapi membawa ${Buffer.byteLength(secret)} byte rahasia.\n_Balas pesan itu dengan ${prefix}intip untuk membacanya._`)
    }
    if (command === 'intip') {
      const src = (m.quoted && (m.quoted.text || m.quoted.caption)) || text || ''
      const s = zwDecode(src)
      return reply(s ? `✦ ${B('RAHASIA TERBACA')}\n\n${s}` : `Tidak ada pesan tersembunyi di teks itu.\n_Reply pesan hasil ${prefix}bisik. Catatan: salin-tempel lewat aplikasi lain kadang membuang karakter tak terlihat._`)
    }
    // ── GAMBAR ──
    const media = AJ.pickNode(m, command === 'sembunyi' ? ['image', 'document'] : ['image', 'document'])
    if (command === 'sembunyi') {
      const j = text.lastIndexOf('|'), msg = (j < 0 ? text : text.slice(0, j)).trim(), pass = j < 0 ? '' : text.slice(j + 1).trim()
      if (!media || (media.kind === 'document' && !/^image\//.test(media.mime))) return reply(`✦ ${B('SEMBUNYI')}\nKirim atau reply sebuah gambar dengan:\n${prefix}sembunyi <pesan>\n${prefix}sembunyi <pesan> | <sandi>   (terenkripsi AES-256)\n\nHasilnya gambar yang tampak sama persis, tapi pesannya terkunci di dalam pikselnya. Buka dengan ${prefix}ungkap.`)
      if (!msg) return reply('✕ Tulis pesan yang mau disembunyikan.')
      if (Buffer.byteLength(msg) > 5000) return reply('✕ Pesan terlalu panjang (maks 5000 byte).')
      try {
        const { data, info } = await toRaw(await AJ.download(media))
        const sealed = seal(Buffer.from(msg, 'utf8'), pass), head = Buffer.alloc(9); MAGIC.copy(head); head[4] = sealed.flag; head.writeUInt32BE(sealed.data.length, 5)
        const out = embed(data, Buffer.concat([head, sealed.data]))
        if (!out) return reply(`✕ Gambar terlalu kecil untuk pesan sepanjang itu (${info.width}×${info.height}). Pakai gambar lebih besar atau pesan lebih pendek.`)
        const png = await require('../../lib/sharp.js')(out, { raw: { width: info.width, height: info.height, channels: info.channels } }).png({ compressionLevel: 9 }).toBuffer()
        await sock.sendMessage(m.chat, { document: png, mimetype: 'image/png', fileName: `rahasia_${Date.now().toString(36)}.png`, caption: `✦ Pesan ${Buffer.byteLength(msg)} byte tersimpan${pass ? ' dan dikunci sandi' : ''} di dalam gambar ini.\nKirim ke temanmu *sebagai dokumen*, lalu reply dengan ${prefix}ungkap${pass ? ' <sandi>' : ''}.` }, { quoted: m })
      } catch (e) { console.log('[sembunyi]', e); return reply(`✕ Gagal memproses gambar.\n_${e.message}_`) }
      return
    }
    // ungkap
    if (!media) return reply(`✦ ${B('UNGKAP')}\nReply gambar hasil ${prefix}sembunyi (dikirim sebagai dokumen):\n${prefix}ungkap\n${prefix}ungkap <sandi>`)
    try {
      const { data } = await toRaw(await AJ.download(media)), found = extract(data)
      if (!found) return reply('Tidak ada pesan tersembunyi di gambar ini.\n_Kalau gambar sempat dikirim sebagai foto biasa, WhatsApp sudah mengompresnya dan pesan hilang. Kirim sebagai *dokumen*._')
      const plain = unseal(found.data, found.flag, text.trim())
      return reply(`✦ ${B('PESAN TERSEMBUNYI')}\n\n${plain.toString('utf8')}`)
    } catch (e) {
      if (e.message === 'PASS') return reply(`🔒 Pesan ini terkunci sandi.\nCoba: ${prefix}ungkap <sandi>`)
      if (e.message === 'WRONGPASS') return reply('✕ Sandi salah.')
      console.log('[ungkap]', e); return reply(`✕ Gagal membaca gambar.\n_${e.message}_`)
    }
  },
  _internals: { seal, unseal, embed, extract, zwEncode, zwDecode, cover, MAGIC },
}
