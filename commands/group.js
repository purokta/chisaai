// Perintah grup. Admin grup (atau owner) yang boleh memakai; bot harus jadi admin untuk kick/promote/dll.
const group = require('../lib/group')

async function need(ctx, { botAdmin = false } = {}) {
  const g = await group.info(ctx)
  if (!g.isAdmin) { await ctx.reply('⛔ Khusus admin grup.'); return null }
  if (botAdmin && !g.isBotAdmin) { await ctx.reply('⚠️ Jadikan bot admin grup dulu.'); return null }
  return g
}

const base = { category: 'Grup', groupOnly: true }

const toggle = (key, label) => async ctx => {
  const g = await need(ctx)
  if (!g) return
  const arg = (ctx.args[0] || '').toLowerCase()
  const all = ctx.db.get(key, {})
  if (['on', 'off'].includes(arg)) {
    all[ctx.jid] = arg === 'on'
    ctx.db.set(key, all)
  }
  await ctx.reply(`${label}: *${all[ctx.jid] ? 'ON' : 'OFF'}*\nUbah: ${ctx.prefix}${key} on / off`)
}

module.exports = [
  {
    ...base,
    name: 'tagall',
    aliases: ['everyone'],
    usage: '[pesan]',
    desc: 'Tag semua anggota',
    async run(ctx) {
      const g = await need(ctx)
      if (!g) return
      const ids = g.parts.map(p => p.id)
      const list = ids.map(i => '• @' + group.num(i)).join('\n')
      await ctx.send({ text: `📢 *${ctx.text || 'Panggilan untuk semua'}*\n\n${list}`, mentions: ids })
    }
  },
  {
    ...base,
    name: 'hidetag',
    aliases: ['h'],
    usage: '<pesan>',
    desc: 'Kirim pesan yang menandai semua (tanpa daftar nama)',
    async run(ctx) {
      const g = await need(ctx)
      if (!g) return
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}hidetag Rapat jam 8`)
      await ctx.sock.sendMessage(ctx.jid, { text: ctx.query, mentions: g.parts.map(p => p.id) })
    }
  },
  {
    ...base,
    name: 'kick',
    usage: '@orang',
    desc: 'Keluarkan anggota (tag / reply)',
    async run(ctx) {
      const g = await need(ctx, { botAdmin: true })
      if (!g) return
      const t = group.targets(ctx)
      if (!t.length) return ctx.reply(`Tag atau reply orangnya. Contoh: ${ctx.prefix}kick @orang`)
      await ctx.sock.groupParticipantsUpdate(ctx.jid, t, 'remove'); group.invalidate(ctx.jid)
      await ctx.react('✅')
    }
  },
  {
    ...base,
    name: 'promote',
    usage: '@orang',
    desc: 'Jadikan admin',
    async run(ctx) {
      const g = await need(ctx, { botAdmin: true })
      if (!g) return
      const t = group.targets(ctx)
      if (!t.length) return ctx.reply('Tag atau reply orangnya.')
      await ctx.sock.groupParticipantsUpdate(ctx.jid, t, 'promote'); group.invalidate(ctx.jid)
      await ctx.react('✅')
    }
  },
  {
    ...base,
    name: 'demote',
    usage: '@orang',
    desc: 'Cabut admin',
    async run(ctx) {
      const g = await need(ctx, { botAdmin: true })
      if (!g) return
      const t = group.targets(ctx)
      if (!t.length) return ctx.reply('Tag atau reply orangnya.')
      await ctx.sock.groupParticipantsUpdate(ctx.jid, t, 'demote'); group.invalidate(ctx.jid)
      await ctx.react('✅')
    }
  },
  {
    ...base,
    name: 'linkgrup',
    aliases: ['linkgc'],
    desc: 'Link undangan grup',
    async run(ctx) {
      const g = await need(ctx, { botAdmin: true })
      if (!g) return
      const code = await ctx.sock.groupInviteCode(ctx.jid)
      await ctx.reply(`🔗 https://chat.whatsapp.com/${code}`)
    }
  },
  {
    ...base,
    name: 'tutupgrup',
    aliases: ['closegc'],
    desc: 'Tutup grup (hanya admin yang bisa kirim)',
    async run(ctx) {
      const g = await need(ctx, { botAdmin: true })
      if (!g) return
      await ctx.sock.groupSettingUpdate(ctx.jid, 'announcement')
      await ctx.reply('🔒 Grup ditutup.')
    }
  },
  {
    ...base,
    name: 'bukagrup',
    aliases: ['opengc'],
    desc: 'Buka grup (semua bisa kirim)',
    async run(ctx) {
      const g = await need(ctx, { botAdmin: true })
      if (!g) return
      await ctx.sock.groupSettingUpdate(ctx.jid, 'not_announcement')
      await ctx.reply('🔓 Grup dibuka.')
    }
  },
  {
    ...base,
    name: 'admin',
    aliases: ['listadmin'],
    desc: 'Daftar admin grup',
    async run(ctx) {
      const g = await group.info(ctx)
      const ids = g.admins.map(p => p.id)
      await ctx.send({ text: '👑 *ADMIN GRUP*\n\n' + ids.map(i => '• @' + group.num(i)).join('\n'), mentions: ids })
    }
  },
  {
    ...base,
    name: 'infogrup',
    aliases: ['gcinfo'],
    desc: 'Info grup ini',
    async run(ctx) {
      const g = await group.info(ctx)
      const md = g.md
      await ctx.reply(
        `👥 *${md.subject}*\n\nAnggota : ${g.parts.length}\nAdmin   : ${g.admins.length}\n` +
          `Dibuat  : ${md.creation ? new Date(md.creation * 1000).toLocaleDateString('id-ID') : '-'}\n` +
          `Antilink: ${ctx.db.get('antilink', {})[ctx.jid] ? 'ON' : 'OFF'} • Welcome: ${ctx.db.get('welcome', {})[ctx.jid] ? 'ON' : 'OFF'}` +
          (md.desc ? `\n\n${String(md.desc).slice(0, 500)}` : '')
      )
    }
  },
  {
    ...base,
    name: 'hapus',
    aliases: ['del', 'delete'],
    desc: 'Hapus pesan (reply pesannya)',
    async run(ctx) {
      const info = require('../lib/message').getContext(ctx.m.message)
      if (!info?.stanzaId) return ctx.reply('Reply pesan yang mau dihapus.')
      const g = await need(ctx, { botAdmin: true })
      if (!g) return
      await ctx.sock.sendMessage(ctx.jid, {
        delete: { remoteJid: ctx.jid, fromMe: false, id: info.stanzaId, participant: info.participant }
      })
    }
  },
  { ...base, name: 'antilink', usage: 'on/off', desc: 'Hapus link grup WhatsApp dari non-admin', run: toggle('antilink', '🚫 Antilink') },
  { ...base, name: 'welcome', usage: 'on/off', desc: 'Sambutan anggota baru / pamit', run: toggle('welcome', '👋 Welcome') }
]
