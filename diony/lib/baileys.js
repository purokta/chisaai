// Adapter Baileys untuk Mode Diony: memakai Baileys milik Chisa (@whiskeysockets/baileys 6.x, CommonJS).
const lib = require('@whiskeysockets/baileys')
const makeWASocket = lib.makeWASocket || lib.default

function fallbackJidDecode(jid) {
  if (typeof jid !== 'string') return undefined
  const at = jid.lastIndexOf('@')
  if (at < 1 || at === jid.length - 1) return undefined
  const userServer = jid.slice(0, at), server = jid.slice(at + 1)
  const colon = userServer.indexOf(':')
  const user = colon >= 0 ? userServer.slice(0, colon) : userServer
  const deviceText = colon >= 0 ? userServer.slice(colon + 1) : ''
  const device = deviceText && /^\d+$/.test(deviceText) ? Number(deviceText) : undefined
  return { user, server, ...(device !== undefined ? { device } : {}) }
}

module.exports = { ...lib, default: makeWASocket, makeWASocket, jidDecode: lib.jidDecode || fallbackJidDecode }
