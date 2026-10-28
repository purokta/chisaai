/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Ambil media (gambar / video / audio) dari pesan sendiri atau pesan yang di-reply, lalu unduh jadi Buffer.
const { downloadContentFromMessage } = require('./baileys')
function kindOf(node, mtype) {
  if (!node || typeof node !== 'object') return null
  const mime = String(node.mimetype || '')
  if (mtype === 'imageMessage' || mime.startsWith('image/') && mime !== 'image/webp') return 'image'
  if (mtype === 'videoMessage' || mime.startsWith('video/')) return 'video'
  if (mtype === 'audioMessage' || mime.startsWith('audio/')) return 'audio'
  return null
}
// -> { kind, node, mimetype } | null   (reply didahulukan)
function pick(m) {
  for (const [node, mt] of [[m.quoted, m.quoted && m.quoted.mtype], [m.msg, m.mtype]]) {
    const k = kindOf(node, mt); if (k) return { kind: k, node, mimetype: node.mimetype }
  }
  return null
}
async function download(media) {
  const stream = await downloadContentFromMessage(media.node, media.kind)
  const chunks = []; for await (const c of stream) chunks.push(c)
  return Buffer.concat(chunks)
}
module.exports = { pick, download, kindOf }
