// Bantuan untuk perintah grup: metadata, cek admin, cari target (tag / reply / nomor)
const num = j => String(j || '').split('@')[0].split(':')[0].replace(/\D/g, '')

const ids = p => [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean).map(num)
const isAdminP = p => p.admin === 'admin' || p.admin === 'superadmin'

// metadata grup di-cache 20 detik supaya perintah grup & antilink tidak menunggu WhatsApp tiap kali
const cache = new Map()
async function metadata(sock, jid) {
  const c = cache.get(jid)
  if (c && Date.now() - c.t < 20000) return c.md
  const md = await sock.groupMetadata(jid)
  cache.set(jid, { t: Date.now(), md })
  if (cache.size > 100) cache.delete(cache.keys().next().value)
  return md
}
const invalidate = jid => cache.delete(jid)

async function info(ctx) {
  const md = await metadata(ctx.sock, ctx.jid)
  const parts = md.participants || []
  const me = new Set([num(ctx.sock.user?.id), num(ctx.sock.user?.lid)].filter(Boolean))
  const mine = new Set((ctx.senderIds || [ctx.sender]).map(num).filter(Boolean))
  const admins = parts.filter(isAdminP)
  return {
    md,
    parts,
    admins,
    isAdmin: ctx.isOwner || admins.some(p => ids(p).some(i => mine.has(i))),
    isBotAdmin: admins.some(p => ids(p).some(i => me.has(i)))
  }
}

// target: yang di-tag, atau pengirim pesan yang di-reply, atau nomor di teks
function targets(ctx) {
  const out = []
  for (const j of ctx.mentioned || []) out.push(j)
  if (!out.length && ctx.quotedSender) out.push(ctx.quotedSender)
  if (!out.length) {
    for (const a of ctx.args || []) {
      const n = num(a.replace(/^@/, ''))
      if (n.length >= 8) out.push((n.startsWith('0') ? '62' + n.slice(1) : n) + '@s.whatsapp.net')
    }
  }
  return [...new Set(out)]
}

module.exports = { invalidate, info, targets, num, ids, isAdminP }
