// Otak bot: membaca pesan masuk -> cek owner / VIP / mode -> jalankan perintah atau auto-reply AI
const config = require('../config')
const db = require('./db')
const loader = require('./loader')
const M = require('./message')
const ai = require('./ai')
const { vipNumbers } = require('./access')
const guard = require('./guard')
const limits = require('./limits')
const plug = require('./chisaplug')

const PREFIX_RE = new RegExp(
  '^([' + config.prefixes.map(p => '\\' + p).join('') + '])([a-zA-Z0-9_]+)(?:\\s+([\\s\\S]*))?$'
)
// Prefix universal (WhatsApp): semua tanda baca ASCII (dan • ) boleh jadi prefix, mis. . , ; : - + = ~ @ ^ * _ ( ) < > | dst
const UNI_RE = /^([!-\/:-@\[-`{-~\u2022])([a-zA-Z0-9_]+)(?:\s+([\s\S]*))?$/
const BARE_RE = /^(owner|menu)(?:\s+(\S+))?$/i // "owner" dan "menu [kategori]" boleh diketik tanpa prefix

const numOf = jid => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '')
const baseJid = jid => String(jid || '').replace(/:\d+@/, '@')

function tsOf(m) {
  const t = m.messageTimestamp
  if (t == null) return Date.now() / 1000
  if (typeof t === 'number') return t
  if (typeof t.toNumber === 'function') return t.toNumber()
  return Number(t.low ?? t) || Date.now() / 1000
}

// semua JID yang mungkin milik pengirim (WhatsApp kadang memakai nomor, kadang LID)
function candidates(m, isGroup) {
  return [
    m.key.participant, m.participant, m.key.participantPn, m.key.participantAlt,
    m.key.remoteJidAlt, m.key.senderPn, isGroup ? null : m.key.remoteJid
  ].filter(Boolean)
}
const matchSet = (m, isGroup, set) => candidates(m, isGroup).some(j => set.has(numOf(j)))

const tgIds = k => new Set((config.telegram?.[k] || []).map(String))

function isOwnerMsg(m, isGroup) {
  if (m.tg) return tgIds('ownerIds').has(String(m.tgFrom)) // Telegram: dikenali lewat ID Telegram
  if (m.key.fromMe) return true // diketik dari nomor bot itu sendiri = owner
  const owners = new Set([config.owner.number, ...config.ownerLids.map(numOf)].filter(Boolean))
  return matchSet(m, isGroup, owners)
}

const isVipMsg = (m, isGroup) => (m.tg ? tgIds('vipIds').has(String(m.tgFrom)) : matchSet(m, isGroup, vipNumbers()))

function addressedToBot(sock, info, text) {
  const mine = new Set([numOf(sock.user?.id), numOf(sock.user?.lid)].filter(Boolean))
  if ((info?.mentionedJid || []).some(j => mine.has(numOf(j)))) return true
  if (info?.quotedMessage && info.participant && mine.has(numOf(info.participant))) return true
  const w = config.autoReply.wakeWord
  return !!w && new RegExp('^' + w + '\\b', 'i').test(text)
}

function friendly(e) {
  if (e?.userMessage) return e.userMessage
  if ((e?.code === 'ENOENT' || e?.code === 'EACCES') && process.env.CHISA_ANDROID) return `Fitur ini butuh program "${e.path || e.syscall || 'luar'}" yang tidak tersedia di aplikasi Android.`
  if (e?.code === 'ENOENT' && e.path) return `Program "${e.path}" belum terpasang. Jalankan: pkg install ${e.path}`
  if (/fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|aborted|timeout/i.test(String(e?.message)) || e?.cause?.code)
    return 'Koneksi ke server gagal. Cek internet / coba lagi sebentar.'
  if (e?.code === 'MODULE_NOT_FOUND') return 'Modul belum terpasang. Jalankan: npm install --legacy-peer-deps'
  return String(e?.message || e).split('\n')[0].slice(0, 200)
}

const cooldown = new Map()

async function handle(sock, m, env) {
  if (!m?.message || !m.key?.remoteJid) return
  const jid = m.key.remoteJid
  if (jid === 'status@broadcast' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) return
  if (env.sentIds.has(m.key.id)) return // pesan yang dikirim bot sendiri
  if (/^BAE5/.test(m.key.id || '')) return // pesan dari bot Baileys lain (cegah saling balas)
  if (Date.now() / 1000 - tsOf(m) > 90) return // abaikan pesan lama (antrian saat bot baru nyala)
  try { require('./dashboard').count('msgs') } catch {}

  const content = M.unwrap(m.message)
  if (!content || content.protocolMessage || content.reactionMessage) return

  const isGroup = jid.endsWith('@g.us')
  const fromMe = !!m.key.fromMe
  const sender = fromMe ? baseJid(sock.user?.id) : m.key.participant || jid
  const isOwner = isOwnerMsg(m, isGroup)
  const isVip = !isOwner && isVipMsg(m, isGroup)

  // pengguna yang diblokir owner: diabaikan total
  if (!isOwner && limits.isBanned([sender, ...candidates(m, isGroup)].map(numOf))) return

  // MODE SELF (private): hanya owner dan VIP yang dilayani
  if (!isOwner && !isVip && db.get('mode', 'public') === 'private') return

  const text = M.getText(m.message).trim()
  const info = M.getContext(m.message)
  const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m })

  const ctx = {
    sock, m, jid, sender, senderIds: [sender, ...candidates(m, isGroup)], isGroup, isOwner, isVip, fromMe, config, db, ai,
    pushName: m.pushName || '',
    platform: m.tg ? 'telegram' : 'whatsapp',
    tgCb: m.tgCb || null,
    tgFrom: m.tgFrom || null,
    commands: loader.list(),
    text: '', prefix: config.displayPrefix || config.prefixes[0], command: '', args: [], query: '',
    quotedSender: info?.participant ? baseJid(info.participant) : null,
    mentioned: (info?.mentionedJid || []).map(baseJid),
    chatKey: isGroup ? jid + ':' + sender : jid,
    reply,
    send: (content, opts = {}) => sock.sendMessage(jid, content, { quoted: m, ...opts }),
    react: async emoji => {
      try { await sock.sendMessage(jid, { react: { text: emoji, key: m.key } }) } catch {}
    },
    presence: async (p = 'composing') => {
      try { await sock.sendPresenceUpdate(p, jid) } catch {}
    },
    mediaTarget: () => M.getMediaTarget(m.message),
    download: env.download,
    reload: env.reload
  }

  ctx.text = text
  // antilink grup + jawaban game (sebelum perintah)
  if (!fromMe && (await guard.onMessage(ctx).catch(() => false))) return
  ctx.text = ''

  // ---- cari perintah ----
  let cmd = null
  let argText = ''
  const universal = !m.tg
  const mt = text.match(universal ? UNI_RE : PREFIX_RE)
  if (mt) {
    ctx.prefix = mt[1]
    ctx.command = mt[2].toLowerCase()
    argText = (mt[3] || '').trim()
    cmd = loader.find(ctx.command)
    // fitur tambahan ikut aktif (perintah sistem/owner Chisa tetap menang)
    if (!m.tg) {
      try { cmd = plug.resolve(ctx.command, cmd) } catch (e) { console.log('[chisa]', e?.message || e) }
    }
    if (!cmd) {
      // bukan perintah yang dikenal: beri petunjuk di chat pribadi, selain itu abaikan / anggap obrolan biasa
      // prefix di luar daftar standar (WhatsApp): nama tak dikenal dianggap obrolan biasa, bukan perintah
      if (/^[a-z]{2,}$/i.test(ctx.command) && config.prefixes.includes(mt[1])) {
        if (!isGroup && !fromMe) {
          let hint = ''
          await reply(`Perintah *${ctx.prefix}${ctx.command}* tidak ada. Ketik *${ctx.prefix}menu* untuk lihat daftar.${hint}`)
        }
        return
      }
    }
  } else if (BARE_RE.test(text)) {
    const bm = text.match(BARE_RE)
    ctx.command = bm[1].toLowerCase()
    argText = bm[2] || ''
    cmd = loader.find(ctx.command)
    // "menu <kata>" tanpa prefix hanya dianggap perintah kalau kata itu nama kategori (cegah salah tangkap di obrolan)
    if (argText && ctx.command === 'menu') {
      const a = argText.toLowerCase()
      const cats = new Set(['semua', 'download', ...loader.list().map(c => String(c.category || '').toLowerCase()), ...(plug.isBooted() ? plug.categories().map(c => c.id) : [])])
      if (!cats.has(a)) cmd = null
    }
  }

  if (cmd) {
    ctx.text = argText
    ctx.args = argText ? argText.split(/\s+/) : []
    ctx.query = argText || M.getQuotedText(m.message)
    if (cmd.platform && cmd.platform !== ctx.platform) return reply(`Perintah ini hanya tersedia di ${cmd.platform === 'telegram' ? 'Telegram' : 'WhatsApp'}.`)
    if (cmd.ownerOnly && !isOwner) return reply('⛔ Perintah ini khusus owner.')
    if (cmd.groupOnly && !isGroup) return reply('Perintah ini hanya bisa dipakai di grup.')
    const lim = limits.check(ctx, cmd)
    if (lim?.silent) return
    if (lim?.text) return reply(lim.text)
    const t0 = Date.now()
    try {
      await cmd.run(ctx)
      require('./log').log.cmd(ctx.command, ctx.pushName || String(sender).split('@')[0], Date.now() - t0, isGroup)
    } catch (e) {
      require('./log').log.err(`${ctx.command}: ${e?.message || e}`)
      await ctx.react('❌')
      await reply('❌ ' + friendly(e))
    }
    return
  }

  // ---- jawaban game / penjaga grup (hook pesan biasa) ----
  if (!fromMe && text && !m.tg && plug.isBooted()) {
    ctx.text = text
    if (await plug.onPlain(ctx).catch(() => false)) return
    ctx.text = ''
  }

  // ---- auto-reply ngobrol ----
  if (fromMe || !text) return
  if (!db.get('autoReply', config.autoReply.enabled)) return
  if (isGroup && config.autoReply.groupNeedsMention && !addressedToBot(sock, info, text)) return

  const now = Date.now()
  if (now - (cooldown.get(sender) || 0) < config.autoReply.cooldownMs) return
  cooldown.set(sender, now)

  await ctx.presence('composing')
  try {
    await reply(await ai.chat(ctx.chatKey, text.slice(0, 1500)))
  } catch (e) {
    console.log('[ai] gagal:', e?.message || e)
    if (!isGroup) await reply('😵 Lagi gangguan, coba lagi sebentar ya.')
  }
  await ctx.presence('paused')
}

module.exports = { handle, isOwnerMsg, isVipMsg, vipNumbers, friendly }
