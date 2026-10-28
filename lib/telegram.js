// Adapter Telegram: membuat "sock" gaya Baileys supaya SEMUA perintah bot yang sudah ada jalan juga di Telegram.
//  Telegram update  ->  pesan gaya WhatsApp  ->  handler.handle()  ->  sock.sendMessage()  ->  Telegram Bot API
// Tanpa library tambahan (pakai fetch bawaan Node 18+). Pakai long polling, jadi tidak perlu domain/webhook.
const config = require('../config')
const db = require('./db')
const loader = require('./loader')
const group = require('./group')
const { log } = require('./log')

const isTg = jid => /@tg$/.test(String(jid || '')) || /^-\d+@g\.us$/.test(String(jid || ''))
const chatIdOf = jid => String(jid).split('@')[0]

// ---------- Telegram Bot API ----------
function makeApi(token) {
  const base = (config.telegram?.apiBase || 'https://api.telegram.org').replace(/\/$/, '')
  const toForm = params => {
    const fd = new FormData()
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue
      if (v && v.__file) fd.append(k, new Blob([v.buffer], { type: v.mime || 'application/octet-stream' }), v.name || 'file')
      else fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
    }
    return fd
  }
  async function call(method, params = {}, { timeout = 60000 } = {}) {
    const hasFile = Object.values(params).some(v => v && v.__file)
    const res = await globalThis.fetch(`${base}/bot${token}/${method}`, {
      method: 'POST',
      headers: hasFile ? undefined : { 'content-type': 'application/json' },
      body: hasFile ? toForm(params) : JSON.stringify(params),
      signal: AbortSignal.timeout(timeout)
    })
    const j = await res.json().catch(() => ({}))
    if (!j.ok) {
      const e = new Error(j.description || `Telegram error ${res.status}`)
      e.code = j.error_code
      e.retryAfter = j.parameters?.retry_after
      throw e
    }
    return j.result
  }
  async function fileBuffer(fileId) {
    const f = await call('getFile', { file_id: fileId })
    const res = await globalThis.fetch(`${base}/file/bot${token}/${f.file_path}`, { signal: AbortSignal.timeout(120000) })
    if (!res.ok) throw new Error('Gagal mengunduh file dari Telegram')
    return Buffer.from(await res.arrayBuffer())
  }
  const fileUrl = async fileId => `${base}/file/bot${token}/${(await call('getFile', { file_id: fileId })).file_path}`
  return { call, fileBuffer, fileUrl }
}

// ---------- format WhatsApp (*tebal* _miring_ ~coret~ ```kode```) -> HTML Telegram ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const names = new Map() // id -> nama (dari pesan yang pernah masuk) untuk mention
const byUsername = new Map()

function toHtml(text, mentions = []) {
  const keep = []
  let s = esc(text).replace(/```([\s\S]*?)```/g, (_, c) => {
    keep.push('<pre>' + c.replace(/^\n/, '') + '</pre>')
    return `\u0000${keep.length - 1}\u0000`
  })
  const B = '(^|[\\s(\\[{>])'
  const E = '(?=$|[\\s)\\]}.,!?:;<])'
  s = s
    .replace(new RegExp(B + '\\*(?!\\s)([^*\\n]+?)(?<!\\s)\\*' + E, 'g'), '$1<b>$2</b>')
    .replace(new RegExp(B + '_(?!\\s)([^_\\n]+?)(?<!\\s)_' + E, 'g'), '$1<i>$2</i>')
    .replace(new RegExp(B + '~(?!\\s)([^~\\n]+?)(?<!\\s)~' + E, 'g'), '$1<s>$2</s>')
  for (const j of mentions) {
    const id = String(j).split('@')[0].replace(/\D/g, '')
    if (!id) continue
    s = s.split('@' + id).join(`<a href="tg://user?id=${id}">${esc(names.get(id) || 'pengguna')}</a>`)
  }
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[Number(i)])
}

const chunk = (t, n = 4000) => {
  const out = []
  let s = String(t)
  while (s.length > n) {
    let cut = s.lastIndexOf('\n', n)
    if (cut < n * 0.5) cut = n
    out.push(s.slice(0, cut))
    s = s.slice(cut).replace(/^\n/, '')
  }
  out.push(s)
  return out
}

const REACT = { '⏳': '👀', '✅': '👍', '❌': '👎', '⌛': '👀' }
const markup = b => (b?.length ? { inline_keyboard: b.map(r => r.map(x => (x.url ? { text: x.text, url: x.url } : { text: x.text, callback_data: x.data }))) } : undefined)

// ---------- sock palsu ----------
function makeSock(api, me) {
  const toBuf = async x => {
    if (Buffer.isBuffer(x)) return x
    if (x?.url) {
      const r = await globalThis.fetch(x.url, { signal: AbortSignal.timeout(60000) })
      if (!r.ok) throw new Error('Gagal mengambil media dari link')
      return Buffer.from(await r.arrayBuffer())
    }
    throw new Error('Media tidak valid')
  }
  // kirim media: link langsung ke Telegram dulu (cepat); kalau ditolak, unduh sendiri lalu unggah
  const BANNER_IDS = new Map()
  // menu dihapus otomatis N detik setelah terakhir dipakai (pengaturan telegram.menuDeleteSec, 0 = tidak dihapus)
  const menuTimers = new Map()
  const trackMenu = (chat_id, id) => {
    const cfg = require('../config').telegram || {}
    const sec = cfg.autoDelete === false ? 0 : Number(cfg.menuDeleteSec ?? 300)
    if (!sec || !id) return
    const k = chat_id + ':' + id
    clearTimeout(menuTimers.get(k))
    const t = setTimeout(() => { menuTimers.delete(k); api.call('deleteMessage', { chat_id, message_id: Number(id) }).catch(() => {}) }, sec * 1000)
    t.unref?.()
    menuTimers.set(k, t)
  }
  async function sendMedia(method, field, src, params, meta = {}) {
    const isUrl = src && !Buffer.isBuffer(src) && src.url
    if (isUrl && !/\/file\/bot/.test(src.url)) {
      try {
        return await api.call(method, { ...params, [field]: src.url }, { timeout: 120000 })
      } catch {}
    }
    const buffer = await toBuf(src)
    try {
      return await api.call(method, { ...params, [field]: { __file: true, buffer, mime: meta.mime, name: meta.name } }, { timeout: 180000 })
    } catch (e) {
      if (e.code === 413 || /too large|entity too large/i.test(e.message)) throw Object.assign(e, { userMessage: 'File terlalu besar untuk Telegram (maks 50 MB untuk bot).' })
      throw e
    }
  }

  const sock = {
    user: { id: `${me.id}@tg`, name: me.first_name },
    me,
    owns: isTg,
    tgApi: api,

    async sendMessage(jid, content = {}, opts = {}) {
      const res = await sock.sendInner(jid, content, opts)
      if (content.tgMenu || content.tgBanner) trackMenu(chatIdOf(jid), content.edit ? content.edit.id : res?.key?.id)
      return res
    },

    async sendInner(jid, content = {}, opts = {}) {
      const chat_id = chatIdOf(jid)
      const qid = opts.quoted?.key?.id
      const base = { chat_id }
      if (qid && /^\d+$/.test(String(qid))) base.reply_parameters = { message_id: Number(qid), allow_sending_without_reply: true }
      const rm = markup(content.tgButtons)
      const mentions = content.mentions || []
      const wrap = r => ({ key: { remoteJid: jid, id: String(r?.message_id ?? ''), fromMe: true }, message: {} })

      if (content.react) {
        const id = Number(content.react.key?.id)
        if (!id) return
        const e = content.react.text
        await api.call('setMessageReaction', { chat_id, message_id: id, reaction: e ? [{ type: 'emoji', emoji: REACT[e] || e }] : [] })
        return
      }
      if (content.delete) {
        await api.call('deleteMessage', { chat_id, message_id: Number(content.delete.id) })
        return
      }
      if (content.poll) {
        const r = await api.call('sendPoll', { ...base, question: content.poll.name.slice(0, 300), options: content.poll.values.slice(0, 10).map(t => String(t).slice(0, 100)), is_anonymous: false })
        return wrap(r)
      }

      // banner GIF menu: file_id disimpan setelah unggah pertama, jadi berikutnya cepat; bisa ganti banner di pesan yang sama
      if (content.tgBanner) {
        const { key, buffer, caption: bc } = content.tgBanner
        const capHtml = toHtml(String(bc || '').slice(0, 1000), mentions)
        const fid = BANNER_IDS.get(key)
        if (content.edit && fid) {
          try {
            const r = await api.call('editMessageMedia', { chat_id, message_id: Number(content.edit.id), media: { type: 'animation', media: fid, caption: capHtml, parse_mode: 'HTML' }, reply_markup: rm || { inline_keyboard: [] } })
            return wrap(r)
          } catch (e) {
            if (/not modified/i.test(e.message)) return
            console.log('[telegram] ganti banner gagal, kirim baru:', e.message)
          }
        }
        const cp2 = { ...base, caption: capHtml, parse_mode: 'HTML', ...(rm ? { reply_markup: rm } : {}) }
        let r
        if (fid) {
          try { r = await api.call('sendAnimation', { ...cp2, animation: fid }) } catch { BANNER_IDS.delete(key) }
        }
        if (!r) {
          r = await sendMedia('sendAnimation', 'animation', buffer, cp2, { name: 'banner.mp4', mime: 'video/mp4' })
          const id = r?.animation?.file_id || r?.document?.file_id
          if (id) BANNER_IDS.set(key, id)
        }
        return wrap(r)
      }

      // ubah pesan yang sudah ada (dipakai tombol menu)
      if (content.edit) {
        const message_id = Number(content.edit.id)
        const textHtml = toHtml(content.text ?? content.caption ?? '', mentions)
        const send = (method, extra) => api.call(method, { chat_id, message_id, parse_mode: 'HTML', reply_markup: rm || { inline_keyboard: [] }, ...extra })
        try {
          const r = content.edit.photo ? await send('editMessageCaption', { caption: textHtml }) : await send('editMessageText', { text: textHtml, link_preview_options: { is_disabled: true } })
          return wrap(r)
        } catch (e) {
          if (/not modified/i.test(e.message)) return
          throw e
        }
      }

      // teks
      if (content.text !== undefined && !content.image && !content.video && !content.audio && !content.sticker && !content.document) {
        const ad = content.contextInfo?.externalAdReply
        const raw = String(content.text)
        // kartu menu gaya WhatsApp -> foto + keterangan
        if (ad?.thumbnail && Buffer.isBuffer(ad.thumbnail) && raw.length <= 900) {
          const cap = [ad.title, ad.body].filter(Boolean).join('\n') + '\n\n' + raw
          const r = await sendMedia('sendPhoto', 'photo', ad.thumbnail, { ...base, caption: toHtml(cap.slice(0, 1000), mentions), parse_mode: 'HTML', reply_markup: rm }, { name: 'menu.jpg', mime: 'image/jpeg' })
          return wrap(r)
        }
        let last
        const parts = chunk(raw)
        for (let i = 0; i < parts.length; i++) {
          const p = { ...base, link_preview_options: { is_disabled: true }, ...(i === parts.length - 1 && rm ? { reply_markup: rm } : {}) }
          if (i > 0) delete p.reply_parameters
          try {
            last = await api.call('sendMessage', { ...p, text: toHtml(parts[i], mentions), parse_mode: 'HTML' })
          } catch (e) {
            if (!/parse entities/i.test(e.message)) throw e
            last = await api.call('sendMessage', { ...p, text: parts[i] })
          }
        }
        return wrap(last)
      }

      const caption = content.caption ? toHtml(content.caption.slice(0, 1024), mentions) : undefined
      const cp = { ...base, ...(caption ? { caption, parse_mode: 'HTML' } : {}), ...(rm ? { reply_markup: rm } : {}) }

      if (content.image) {
        try {
          return wrap(await sendMedia('sendPhoto', 'photo', content.image, cp, { name: 'foto.jpg', mime: 'image/jpeg' }))
        } catch (e) {
          // foto terlalu besar / rasio aneh: kirim sebagai file
          return wrap(await sendMedia('sendDocument', 'document', content.image, cp, { name: 'gambar.jpg', mime: 'image/jpeg' }))
        }
      }
      if (content.video) {
        if (content.gifPlayback) return wrap(await sendMedia('sendAnimation', 'animation', content.video, cp, { name: 'anim.mp4', mime: 'video/mp4' }))
        try {
          return wrap(await sendMedia('sendVideo', 'video', content.video, { ...cp, supports_streaming: true }, { name: 'video.mp4', mime: 'video/mp4' }))
        } catch (e) {
          return wrap(await sendMedia('sendDocument', 'document', content.video, cp, { name: 'video.mp4', mime: 'video/mp4' }))
        }
      }
      if (content.audio) {
        const mime = content.mimetype || ''
        if (content.ptt && /ogg|opus/i.test(mime)) {
          try {
            return wrap(await sendMedia('sendVoice', 'voice', content.audio, cp, { name: 'vn.ogg', mime: 'audio/ogg' }))
          } catch {}
        }
        const ext = /mpeg|mp3/.test(mime) ? 'mp3' : /mp4|m4a/.test(mime) ? 'm4a' : /ogg|opus/.test(mime) ? 'ogg' : 'mp3'
        return wrap(await sendMedia('sendAudio', 'audio', content.audio, cp, { name: 'audio.' + ext, mime: mime || 'audio/mpeg' }))
      }
      if (content.sticker) {
        const webm = Buffer.isBuffer(content.sticker) && content.sticker[0] === 0x1a && content.sticker[1] === 0x45 && content.sticker[2] === 0xdf
        const meta = webm ? { name: 'sticker.webm', mime: 'video/webm' } : { name: 'sticker.webp', mime: 'image/webp' }
        try {
          return wrap(await sendMedia('sendSticker', 'sticker', content.sticker, { ...base }, meta))
        } catch (e) {
          // format ditolak Telegram: kirim sebagai file supaya tetap bisa dibuka
          return wrap(await sendMedia('sendDocument', 'document', content.sticker, { ...base }, meta))
        }
      }
      if (content.document) return wrap(await sendMedia('sendDocument', 'document', content.document, cp, { name: content.fileName || 'file', mime: content.mimetype }))

      throw Object.assign(new Error('Jenis pesan ini belum didukung di Telegram'), { userMessage: 'Fitur ini belum didukung di Telegram 🙏' })
    },

    async sendPresenceUpdate(p, jid) {
      if (p === 'composing' || p === 'recording') await api.call('sendChatAction', { chat_id: chatIdOf(jid), action: p === 'recording' ? 'record_voice' : 'typing' }, { timeout: 8000 })
    },

    // ---- grup ----
    async groupMetadata(jid) {
      const chat_id = chatIdOf(jid)
      const [chat, admins] = await Promise.all([api.call('getChat', { chat_id }), api.call('getChatAdministrators', { chat_id })])
      const participants = admins.map(a => ({ id: `${a.user.id}@tg`, admin: a.status === 'creator' ? 'superadmin' : 'admin' }))
      return { id: jid, subject: chat.title || '', desc: chat.description || '', participants, owner: participants.find(p => p.admin === 'superadmin')?.id }
    },
    async groupParticipantsUpdate(jid, ids, action) {
      const chat_id = chatIdOf(jid)
      const out = []
      for (const j of ids) {
        const user_id = Number(String(j).split('@')[0].replace(/\D/g, ''))
        if (action === 'remove') {
          await api.call('banChatMember', { chat_id, user_id })
          await api.call('unbanChatMember', { chat_id, user_id, only_if_banned: true }).catch(() => {})
        } else if (action === 'promote' || action === 'demote') {
          const on = action === 'promote'
          await api.call('promoteChatMember', { chat_id, user_id, can_manage_chat: on, can_delete_messages: on, can_restrict_members: on, can_invite_users: on, can_pin_messages: on })
        } else throw Object.assign(new Error('unsupported'), { userMessage: 'Telegram tidak bisa menambah anggota lewat bot. Bagikan link undangan saja.' })
        out.push({ status: '200', jid: j })
      }
      return out
    },
    async groupSettingUpdate(jid, setting) {
      const open = setting !== 'announcement'
      await api.call('setChatPermissions', {
        chat_id: chatIdOf(jid),
        permissions: { can_send_messages: open, can_send_audios: open, can_send_documents: open, can_send_photos: open, can_send_videos: open, can_send_video_notes: open, can_send_voice_notes: open, can_send_polls: open, can_send_other_messages: open, can_add_web_page_previews: open }
      })
    },
    async groupInviteCode(jid) {
      return api.call('exportChatInviteLink', { chat_id: chatIdOf(jid) })
    },
    async profilePictureUrl(jid) {
      const user_id = Number(String(jid).split('@')[0].replace(/\D/g, ''))
      const r = await api.call('getUserProfilePhotos', { user_id, limit: 1 })
      const sizes = r.photos?.[0]
      if (!sizes) throw new Error('tidak ada foto')
      return api.fileUrl(sizes[sizes.length - 1].file_id)
    }
  }
  return sock
}

// ---------- update Telegram -> pesan gaya WhatsApp ----------
function nameOf(u) {
  return [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.username || ''
}
function learn(u) {
  if (!u?.id) return
  names.set(String(u.id), nameOf(u))
  if (u.username) byUsername.set(u.username.toLowerCase(), String(u.id))
}

function mediaNode(msg, ctxInfo) {
  const caption = msg.caption || ''
  const withCtx = n => ({ ...n, caption, contextInfo: ctxInfo })
  if (msg.photo?.length) return { imageMessage: withCtx({ mimetype: 'image/jpeg', _tg: { file_id: msg.photo[msg.photo.length - 1].file_id } }) }
  if (msg.video) return { videoMessage: withCtx({ mimetype: msg.video.mime_type || 'video/mp4', _tg: { file_id: msg.video.file_id } }) }
  if (msg.animation) return { videoMessage: withCtx({ mimetype: 'video/mp4', gifPlayback: true, _tg: { file_id: msg.animation.file_id } }) }
  if (msg.video_note) return { videoMessage: withCtx({ mimetype: 'video/mp4', _tg: { file_id: msg.video_note.file_id } }) }
  if (msg.sticker) return { stickerMessage: { mimetype: 'image/webp', isAnimated: !!(msg.sticker.is_animated || msg.sticker.is_video), contextInfo: ctxInfo, _tg: { file_id: msg.sticker.file_id } } }
  if (msg.voice) return { audioMessage: { mimetype: msg.voice.mime_type || 'audio/ogg', ptt: true, contextInfo: ctxInfo, _tg: { file_id: msg.voice.file_id } } }
  if (msg.audio) return { audioMessage: { mimetype: msg.audio.mime_type || 'audio/mpeg', contextInfo: ctxInfo, _tg: { file_id: msg.audio.file_id } } }
  if (msg.document) {
    if (/^image\//.test(msg.document.mime_type || '')) return { imageMessage: withCtx({ mimetype: msg.document.mime_type, _tg: { file_id: msg.document.file_id } }) }
    return { documentMessage: withCtx({ mimetype: msg.document.mime_type, fileName: msg.document.file_name, _tg: { file_id: msg.document.file_id } }) }
  }
  return null
}

function convert(msg, botName, depth = 0) {
  learn(msg.from)
  let text = msg.text || msg.caption || ''
  // "/menu@NamaBot arg" -> "/menu arg"
  if (botName) text = text.replace(new RegExp('^(/\\w+)@' + botName + '\\b', 'i'), '$1')

  const mentioned = []
  for (const e of [...(msg.entities || []), ...(msg.caption_entities || [])]) {
    if (e.type === 'text_mention' && e.user) mentioned.push(`${e.user.id}@tg`)
    else if (e.type === 'mention') {
      const u = (msg.text || msg.caption || '').substr(e.offset + 1, e.length - 1).toLowerCase()
      const id = byUsername.get(u)
      if (id) mentioned.push(`${id}@tg`)
    }
  }
  const ctxInfo = {}
  if (mentioned.length) ctxInfo.mentionedJid = mentioned
  const rp = msg.reply_to_message
  if (rp && depth === 0) {
    learn(rp.from)
    ctxInfo.stanzaId = String(rp.message_id)
    ctxInfo.participant = `${rp.from?.id}@tg`
    ctxInfo.quotedMessage = convert(rp, botName, 1)
  }
  const media = mediaNode(msg, ctxInfo)
  if (media) {
    // teks perintah di keterangan media: dibaca lewat caption
    const k = Object.keys(media)[0]
    if (text && media[k].caption !== undefined) media[k].caption = text
    return media
  }
  if (Object.keys(ctxInfo).length) return { extendedTextMessage: { text, contextInfo: ctxInfo } }
  return { conversation: text }
}

function build(msg, botName, extra = {}) {
  const chat = msg.chat
  const isGroup = chat.type !== 'private'
  const jid = isGroup ? `${chat.id}@g.us` : `${chat.id}@tg`
  const from = extra.from || msg.from
  learn(from)
  const sender = `${from.id}@tg`
  return {
    key: { remoteJid: jid, id: extra.id || String(msg.message_id), fromMe: false, ...(isGroup ? { participant: sender } : {}) },
    message: extra.message || convert(msg, botName),
    messageTimestamp: extra.ts || msg.date,
    pushName: nameOf(from),
    tg: true,
    tgFrom: String(from.id),
    ...(extra.tgCb ? { tgCb: extra.tgCb } : {})
  }
}

// ---------- jalankan ----------
let started = null
async function start({ handler, env }) {
  const tcfg = config.telegram || {}
  if (!tcfg.token) return null
  if (started) return started
  const api = makeApi(tcfg.token)
  let me
  try {
    me = await api.call('getMe', {}, { timeout: 20000 })
  } catch (e) {
    log.err('Telegram: token tidak valid / tidak ada internet (' + e.message + ')')
    return null
  }
  const sock = makeSock(api, me)
  const tgEnv = { ...env, download: async node => api.fileBuffer(node?._tg?.file_id) }
  started = { sock, me, api }
  log.ok(`Telegram terhubung • @${me.username}`)
  if (!(tcfg.ownerIds || []).length) log.warn('Telegram: owner belum diisi. Kirim /myid ke bot lalu isi telegram.ownerIds di settings.js')

  await api.call('deleteWebhook', { drop_pending_updates: false }).catch(() => {})
  // daftar perintah (muncul sebagai menu "/" di Telegram)
  const pushCommands = () => {
    const cmds = loader
      .list()
      .filter(c => !c.hidden && !c.ownerOnly && (!c.platform || c.platform === 'telegram') && /^[a-z0-9_]{1,32}$/.test(c.name))
      .slice(0, 100)
      .map(c => ({ command: c.name, description: String(c.desc || c.name).slice(0, 80) }))
    cmds.unshift({ command: 'menu', description: 'Tampilkan menu' })
    // owner: menu "/" pribadinya juga memuat perintah khusus owner (push, update, restart, dst)
    const OWNER_CMDS = ['push', 'update', 'restart', 'stop', 'backup', 'ban', 'unban', 'setlimit', 'limit', 'changelog']
    const ownerCmds = [...cmds]
    for (const n of OWNER_CMDS) {
      const c = loader.find(n)
      if (c && (!c.platform || c.platform === 'telegram') && !ownerCmds.some(x => x.command === n)) ownerCmds.push({ command: n, description: String(c.desc || n).slice(0, 80) })
    }
    for (const id of tcfg.ownerIds || []) {
      api.call('setMyCommands', { commands: ownerCmds.slice(0, 100), scope: { type: 'chat', chat_id: Number(id) } }).catch(() => {})
    }
    return api.call('setMyCommands', { commands: cmds }).catch(() => {})
  }
  pushCommands()

  const run = (m, e) => handler.handle(sock, m, e || tgEnv).catch(err => log.err('[telegram] ' + (err?.message || err)))

  async function onWelcome(msg) {
    const jid = `${msg.chat.id}@g.us`
    group.invalidate(jid)
    if (!db.get('welcome', {})[jid]) return
    const joined = (msg.new_chat_members || []).filter(u => !u.is_bot)
    const left = msg.left_chat_member && !msg.left_chat_member.is_bot ? [msg.left_chat_member] : []
    for (const u of [...joined, ...left]) learn(u)
    const tag = us => us.map(u => '@' + u.id).join(' ')
    const rules = db.get('rules', {})[jid] ? '\n📜 Aturan: ketik /rules' : ''
    if (joined.length) await sock.sendMessage(jid, { text: `👋 Selamat datang ${tag(joined)} di *${msg.chat.title || 'grup'}*!\nBaca deskripsi grup ya.${rules}`, mentions: joined.map(u => `${u.id}@tg`) })
    else if (left.length) await sock.sendMessage(jid, { text: `👋 Sampai jumpa ${tag(left)}.`, mentions: left.map(u => `${u.id}@tg`) })
  }

  function onUpdate(u) {
    if (u.message) {
      const msg = u.message
      if (!msg.from || msg.from.is_bot) return
      if (msg.new_chat_members || msg.left_chat_member) return void onWelcome(msg).catch(() => {})
      if (msg.chat.type === 'channel') return
      if (msg.chat.type === 'private') {
        const us = db.get('tgUsers', [])
        const id = String(msg.chat.id)
        if (!us.includes(id)) { us.push(id); db.set('tgUsers', us.slice(-5000)) }
      }
      return void run(build(msg, me.username))
    }
    if (u.callback_query) {
      const cq = u.callback_query
      api.call('answerCallbackQuery', { callback_query_id: cq.id }, { timeout: 10000 }).catch(() => {})
      if (!cq.message || !cq.data) return
      const msg = cq.message
      const m = build(msg, me.username, {
        from: cq.from,
        id: 'cb' + cq.id,
        ts: Math.floor(Date.now() / 1000),
        message: { conversation: String(cq.data) },
        tgCb: { messageId: String(msg.message_id), photo: !!(msg.photo || msg.animation || msg.video) }
      })
      // pesan teks biasa (bukan menu, bukan media) yang tombolnya dipencet: dihapus setelah diproses
      const cfg = require('../config').telegram || {}
      const textOnly = !(msg.photo || msg.animation || msg.video || msg.document || msg.audio || msg.voice || msg.sticker || msg.video_note)
      if (cfg.autoDelete !== false && textOnly && !String(cq.data).startsWith('#menu')) {
        const del = () => api.call('deleteMessage', { chat_id: msg.chat.id, message_id: msg.message_id }).catch(() => {})
        const t = setTimeout(del, 1500); t.unref?.()
      }
      return void run(m)
    }
  }

  // long polling
  let offset = 0
  let stopped = false
  const loop = async () => {
    let wait = 1000
    while (!stopped) {
      try {
        const ups = await api.call('getUpdates', { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] }, { timeout: 40000 })
        wait = 1000
        for (const u of ups) {
          offset = u.update_id + 1
          try { onUpdate(u) } catch (e) { log.err('[telegram] ' + e.message) }
        }
      } catch (e) {
        if (e.code === 409) log.warn('Telegram: ada bot lain yang memakai token ini (tutup yang lain)')
        else if (e.code === 401) { log.err('Telegram: token dicabut / salah'); return }
        else if (!/abort|timeout/i.test(e.message)) log.warn('Telegram: ' + e.message)
        await new Promise(r => setTimeout(r, e.retryAfter ? e.retryAfter * 1000 : wait))
        wait = Math.min(wait * 2, 30000)
      }
    }
  }
  loop()
  started.stop = () => { stopped = true }
  return started
}

module.exports = { start, isTg, toHtml, convert, build, makeSock, makeApi }
