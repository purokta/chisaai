// Helper membaca isi pesan WhatsApp
const WRAPPERS = ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension', 'documentWithCaptionMessage']

function unwrap(msg) {
  let cur = msg
  for (let i = 0; i < 6 && cur; i++) {
    const k = WRAPPERS.find(w => cur[w])
    if (!k) break
    cur = cur[k].message
  }
  return cur
}

// pilihan dari tombol/list interaktif (native flow) -> id yang kita kirim, mis. "#menu grup"
function nativeReplyId(c) {
  const p = c.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
  if (!p) return ''
  try {
    return String(JSON.parse(p).id || '')
  } catch {
    return ''
  }
}

function getText(msg) {
  const c = unwrap(msg)
  if (!c) return ''
  return (
    c.conversation ||
    c.extendedTextMessage?.text ||
    c.imageMessage?.caption ||
    c.videoMessage?.caption ||
    c.documentMessage?.caption ||
    c.buttonsResponseMessage?.selectedButtonId ||
    c.listResponseMessage?.singleSelectReply?.selectedRowId ||
    c.templateButtonReplyMessage?.selectedId ||
    nativeReplyId(c) ||
    ''
  )
}

function getContext(msg) {
  const c = unwrap(msg)
  if (!c) return null
  const key = Object.keys(c).find(k => c[k] && typeof c[k] === 'object' && c[k].contextInfo)
  return key ? c[key].contextInfo : null
}

const MEDIA = { imageMessage: 'image', videoMessage: 'video', stickerMessage: 'sticker', audioMessage: 'audio' }

function findMedia(content) {
  if (!content) return null
  for (const [key, type] of Object.entries(MEDIA)) {
    if (content[key]) return { type, node: content[key] }
  }
  return null
}

// Media di pesan ini, atau di pesan yang di-reply
function getMediaTarget(msg) {
  const own = findMedia(unwrap(msg))
  if (own) return { ...own, quoted: false }
  const q = getContext(msg)?.quotedMessage
  const inQuoted = findMedia(unwrap(q))
  return inQuoted ? { ...inQuoted, quoted: true } : null
}

function getQuotedText(msg) {
  const q = getContext(msg)?.quotedMessage
  return q ? getText(q) : ''
}

module.exports = { unwrap, getText, getContext, getMediaTarget, getQuotedText }
