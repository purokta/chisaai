/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kit encoding & hash: URL encode/decode, HTML escape, Base32/Base58, SHA-256, MD5, CRC32, UUID v4.
const crypto = require('crypto'), { B } = require('../../lib/style')

const CMDS = ['urlencode', 'urldecode', 'htmlescape', 'base32enc', 'base58enc', 'hashsha256', 'hashmd5', 'crc32sum', 'uuidgen']

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function base32encode(buf) {
  let bits = 0, value = 0, out = ''
  for (const byte of buf) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { out += B32_ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5 } }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31]
  while (out.length % 8 !== 0) out += '='
  return out
}
const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
function base58encode(buf) {
  let n = 0n; for (const byte of buf) n = n * 256n + BigInt(byte)
  let out = ''; while (n > 0n) { out = B58_ALPHABET[Number(n % 58n)] + out; n /= 58n }
  for (const byte of buf) { if (byte === 0) out = '1' + out; else break }
  return out || '1'
}
function crc32(str) {
  let c, crc = 0xFFFFFFFF
  for (let i = 0; i < str.length; i++) { c = (crc ^ str.charCodeAt(i)) & 0xFF; for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0')
}

module.exports = {
  name: 'encodekit', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'Kit encoding & hash: URL encode/decode, HTML escape, Base32, Base58, SHA-256, MD5, CRC32, UUID',
  run: async ({ command, text, prefix, reply }) => {
    const t = String(text || '').trim()
    if (!t && command !== 'uuidgen') return reply(`${B(command.toUpperCase())}\nTulis teksnya.\nContoh: ${prefix}${command} contoh teks`)

    if (command === 'urlencode') return reply(`${B('URL ENCODE')}\n${encodeURIComponent(t)}`)
    if (command === 'urldecode') { try { return reply(`${B('URL DECODE')}\n${decodeURIComponent(t)}`) } catch { return reply('✕ Teks bukan URL-encoded yang valid.') } }
    if (command === 'htmlescape') return reply(`${B('HTML ESCAPE')}\n${t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}`)
    if (command === 'base32enc') return reply(`${B('BASE32')}\n${base32encode(Buffer.from(t, 'utf8'))}`)
    if (command === 'base58enc') return reply(`${B('BASE58')}\n${base58encode(Buffer.from(t, 'utf8'))}`)
    if (command === 'hashsha256') return reply(`${B('SHA-256')}\n${crypto.createHash('sha256').update(t).digest('hex')}`)
    if (command === 'hashmd5') return reply(`${B('MD5')}\n${crypto.createHash('md5').update(t).digest('hex')}\n_MD5 tidak aman untuk password — gunakan hanya untuk checksum._`)
    if (command === 'crc32sum') return reply(`${B('CRC32')}\n${crc32(t)}`)
    if (command === 'uuidgen') { const n = Math.min(Math.max(parseInt(t, 10) || 1, 1), 10); return reply(`${B('UUID V4')}\n${Array.from({ length: n }, () => crypto.randomUUID()).join('\n')}`) }
  },
}
