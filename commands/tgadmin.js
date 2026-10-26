// Fitur khusus Telegram: moderasi grup (pin, mute, ban, warn, aturan), info ID, dan broadcast.
// Perintah di file ini hanya muncul & berjalan di Telegram (platform: 'telegram').
const group = require('../lib/group')
const reminders = require('../lib/reminders')

const T = { platform: 'telegram' }
const adminCmd = { ...T, category: 'Grup', groupOnly: true }
const api = ctx => ctx.sock.tgApi
const chatId = ctx => ctx.jid.split('@')[0]
const uid = j => Number(group.num(j))

async function need(ctx, { botAdmin = true } = {}) {
  const g = await group.info(ctx)
  if (!g.isAdmin) { await ctx.reply('⛔ Khusus admin grup.'); return null }
  if (botAdmin && !g.isBotAdmin) { await ctx.reply('⚠️ Jadikan bot admin grup dulu.'); return null }
  return g
}
const target = async (ctx, usage) => {
  const t = group.targets(ctx)[0]
  if (!t) { await ctx.reply(`Reply pesan orangnya atau tag. Contoh: ${ctx.prefix}${usage}`); return null }
  return t
}
const ALL = on => ({ can_send_messages: on, can_send_audios: on, can_send_documents: on, can_send_photos: on, can_send_videos: on, can_send_video_notes: on, can_send_voice_notes: on, can_send_polls: on, can_send_other_messages: on, can_add_web_page_previews: on })
const tag = j => `<a href="tg://user?id=${group.num(j)}">pengguna</a>`

module.exports = [
  {
    ...adminCmd,
    name: 'pin',
    desc: 'Sematkan pesan (reply pesannya)',
    async run(ctx) {
      const id = require('../lib/message').getContext(ctx.m.message)?.stanzaId
      if (!id) return ctx.reply('Reply pesan yang mau disematkan.')
      if (!(await need(ctx))) return
      await api(ctx).call('pinChatMessage', { chat_id: chatId(ctx), message_id: Number(id), disable_notification: true })
      await ctx.react('✅')
    }
  },
  {
    ...adminCmd,
    name: 'unpin',
    desc: 'Lepas sematan (reply pesannya, atau semua)',
    async run(ctx) {
      if (!(await need(ctx))) return
      const id = require('../lib/message').getContext(ctx.m.message)?.stanzaId
      if (id) await api(ctx).call('unpinChatMessage', { chat_id: chatId(ctx), message_id: Number(id) })
      else await api(ctx).call('unpinAllChatMessages', { chat_id: chatId(ctx) })
      await ctx.react('✅')
    }
  },
  {
    ...adminCmd,
    name: 'mute',
    usage: '@orang [10m|2j|1h]',
    desc: 'Bisukan anggota (reply/tag, durasi opsional)',
    async run(ctx) {
      if (!(await need(ctx))) return
      const t = await target(ctx, 'mute 30m'); if (!t) return
      const dur = reminders.parseDuration(ctx.args.find(a => /^\d+\s*[a-z]+$/i.test(a)))
      await api(ctx).call('restrictChatMember', { chat_id: chatId(ctx), user_id: uid(t), permissions: ALL(false), until_date: dur ? Math.floor((Date.now() + dur) / 1000) : 0 })
      await ctx.send({ text: `🔇 ${tag(t).replace('pengguna', '@' + group.num(t))} dibisukan${dur ? ' selama ' + Math.round(dur / 60000) + ' menit' : ' (permanen)'}.`, mentions: [t] })
    }
  },
  {
    ...adminCmd,
    name: 'unmute',
    usage: '@orang',
    desc: 'Buka bisu anggota',
    async run(ctx) {
      if (!(await need(ctx))) return
      const t = await target(ctx, 'unmute'); if (!t) return
      await api(ctx).call('restrictChatMember', { chat_id: chatId(ctx), user_id: uid(t), permissions: ALL(true) })
      await ctx.react('✅')
    }
  },
  {
    ...adminCmd,
    name: 'bangrup',
    usage: '@orang',
    desc: 'Banned permanen (reply/tag)',
    async run(ctx) {
      if (!(await need(ctx))) return
      const t = await target(ctx, 'bangrup'); if (!t) return
      await api(ctx).call('banChatMember', { chat_id: chatId(ctx), user_id: uid(t) })
      await ctx.react('✅')
    }
  },
  {
    ...adminCmd,
    name: 'unbangrup',
    usage: '@orang / ID',
    desc: 'Buka banned',
    async run(ctx) {
      if (!(await need(ctx))) return
      const t = await target(ctx, 'unbangrup 123456789'); if (!t) return
      await api(ctx).call('unbanChatMember', { chat_id: chatId(ctx), user_id: uid(t), only_if_banned: true })
      await ctx.react('✅')
    }
  },
  {
    ...adminCmd,
    name: 'warn',
    usage: '@orang [alasan]',
    desc: 'Beri peringatan (3x = dikeluarkan)',
    async run(ctx) {
      if (!(await need(ctx))) return
      const t = await target(ctx, 'warn @orang spam'); if (!t) return
      const limit = ctx.config.telegram?.warnLimit || 3
      const all = ctx.db.get('warns', {})
      const k = ctx.jid + ':' + group.num(t)
      all[k] = (all[k] || 0) + 1
      const n = all[k]
      const reason = ctx.args.filter(a => !a.startsWith('@')).join(' ')
      if (n >= limit) {
        delete all[k]
        ctx.db.set('warns', all)
        await api(ctx).call('banChatMember', { chat_id: chatId(ctx), user_id: uid(t) })
        await api(ctx).call('unbanChatMember', { chat_id: chatId(ctx), user_id: uid(t), only_if_banned: true }).catch(() => {})
        return ctx.send({ text: `🚫 @${group.num(t)} sudah ${limit}x diperingatkan, dikeluarkan.`, mentions: [t] })
      }
      ctx.db.set('warns', all)
      await ctx.send({ text: `⚠️ @${group.num(t)} diperingatkan (${n}/${limit})${reason ? '\nAlasan: ' + reason : ''}`, mentions: [t] })
    }
  },
  {
    ...adminCmd,
    name: 'resetwarn',
    usage: '@orang',
    desc: 'Hapus peringatan anggota',
    async run(ctx) {
      if (!(await need(ctx, { botAdmin: false }))) return
      const t = await target(ctx, 'resetwarn'); if (!t) return
      const all = ctx.db.get('warns', {})
      delete all[ctx.jid + ':' + group.num(t)]
      ctx.db.set('warns', all)
      await ctx.react('✅')
    }
  },
  {
    ...adminCmd,
    name: 'warns',
    usage: '@orang',
    desc: 'Cek jumlah peringatan',
    async run(ctx) {
      const t = group.targets(ctx)[0] || ctx.sender
      const n = ctx.db.get('warns', {})[ctx.jid + ':' + group.num(t)] || 0
      await ctx.send({ text: `⚠️ @${group.num(t)}: ${n}/${ctx.config.telegram?.warnLimit || 3} peringatan`, mentions: [t] })
    }
  },
  {
    ...adminCmd,
    name: 'setrules',
    aliases: ['setaturan'],
    usage: '<teks aturan>',
    desc: 'Atur aturan grup (tampil di /rules & sambutan)',
    async run(ctx) {
      if (!(await need(ctx, { botAdmin: false }))) return
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}setrules 1. Sopan\n2. Dilarang spam`)
      const all = ctx.db.get('rules', {})
      all[ctx.jid] = ctx.query.slice(0, 1500)
      ctx.db.set('rules', all)
      await ctx.react('✅')
    }
  },
  {
    ...T,
    category: 'Grup',
    groupOnly: true,
    name: 'rules',
    aliases: ['aturan'],
    desc: 'Lihat aturan grup',
    async run(ctx) {
      const r = ctx.db.get('rules', {})[ctx.jid]
      await ctx.reply(r ? `📜 *Aturan grup*\n\n${r}` : `Belum ada aturan. Admin: ${ctx.prefix}setrules <teks>`)
    }
  },
  {
    ...T,
    category: 'Info',
    name: 'id',
    desc: 'ID Telegram kamu, chat, dan orang yang di-reply',
    async run(ctx) {
      const q = ctx.quotedSender ? `\nID yang di-reply: ${group.num(ctx.quotedSender)}` : ''
      await ctx.reply(`🆔 ID kamu: ${ctx.tgFrom}\n💬 ID chat: ${ctx.jid.split('@')[0]}${q}`)
    }
  },
  {
    ...T,
    category: 'Info',
    name: 'userinfo',
    aliases: ['whois'],
    usage: '@orang',
    desc: 'Info pengguna (reply/tag)',
    async run(ctx) {
      const t = group.targets(ctx)[0] || ctx.sender
      let status = '-'
      if (ctx.isGroup) {
        try {
          const r = await api(ctx).call('getChatMember', { chat_id: chatId(ctx), user_id: uid(t) })
          status = { creator: 'pemilik grup', administrator: 'admin', member: 'anggota', restricted: 'dibatasi', left: 'keluar', kicked: 'dibanned' }[r.status] || r.status
          const u = r.user
          return ctx.reply(`👤 *${[u.first_name, u.last_name].filter(Boolean).join(' ')}*\nID: ${u.id}${u.username ? '\nUsername: @' + u.username : ''}\nStatus: ${status}${u.is_bot ? '\n🤖 bot' : ''}`)
        } catch {}
      }
      await ctx.reply(`👤 ID: ${group.num(t)}\nStatus: ${status}`)
    }
  },
  {
    ...T,
    category: 'Owner',
    ownerOnly: true,
    name: 'broadcast',
    aliases: ['bc'],
    usage: '<pesan>',
    desc: 'Kirim pesan ke semua pengguna bot di Telegram',
    async run(ctx) {
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}broadcast Bot diperbarui, ketik /menu`)
      const users = ctx.db.get('tgUsers', [])
      if (!users.length) return ctx.reply('Belum ada pengguna tercatat.')
      await ctx.react('⏳')
      let ok = 0
      for (const id of users) {
        try { await ctx.sock.sendMessage(id + '@tg', { text: '📢 ' + ctx.query }); ok++ } catch {}
        await new Promise(r => setTimeout(r, 60))
      }
      await ctx.reply(`📢 Terkirim ke ${ok}/${users.length} pengguna.`)
    }
  }
]
