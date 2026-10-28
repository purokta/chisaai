/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pengaturan grup: buka/tutup, nama, deskripsi, link, revoke, info, daftar admin, hapus pesan, keluar
const { tag } = require('../../lib/grouputil')

module.exports = {
  name: 'group', alias: ['grup', 'gc', 'buka', 'tutup', 'open', 'close', 'setname', 'setnamegc', 'setdesc', 'setdescgc', 'linkgroup', 'revoke', 'resetlink', 'infogc', 'admins', 'leave', 'keluar', 'locked', 'unlocked'],
  category: 'group', menu: ['group', 'buka', 'tutup', 'setname', 'setdesc', 'linkgc', 'revoke', 'infogc', 'listadmin', 'del', 'leave', 'locked', 'unlocked'], cmds: ['group', 'setname', 'setdesc', 'revoke', 'infogc', 'leave', 'locked'],
  desc: 'Pengaturan grup (buka/tutup, nama, deskripsi, link, info, dll.)',
  group: true,
  run: async ({ sock, m, reply, text, args, command, prefix, isAdmins, isBotAdmins, isCreator, groupMetadata }) => {
    const need = (admin, bot) => {
      if (admin && !isAdmins && !isCreator) return reply(global.mess.admin), true
      if (bot && !isBotAdmins) return reply(global.mess.botAdmin), true
      return false
    }
    const c = command

    if (['infogc', 'infogrup'].includes(c)) {
      const g = groupMetadata, admins = g.participants.filter(p => p.admin)
      const owner = g.owner || (admins.find(p => p.admin === 'superadmin') || {}).id
      return sock.sendMessage(m.chat, { text: `*INFO GRUP*\n\n📛 Nama: ${g.subject}\n🆔 ID: ${g.id}\n👥 Member: ${g.participants.length}\n👑 Admin: ${admins.length}\n🔒 Kirim pesan: ${g.announce ? 'hanya admin' : 'semua'}\n⚙️ Edit info: ${g.restrict ? 'hanya admin' : 'semua'}\n📅 Dibuat: ${g.creation ? new Date(g.creation * 1000).toLocaleDateString('id-ID') : '-'}\n👤 Pembuat: ${owner ? tag(owner) : '-'}\n\n📝 Deskripsi:\n${g.desc || '-'}`, mentions: owner ? [owner] : [] }, { quoted: m })
    }
    if (['listadmin', 'admins'].includes(c)) {
      const admins = groupMetadata.participants.filter(p => p.admin)
      return sock.sendMessage(m.chat, { text: `*DAFTAR ADMIN* (${admins.length})\n\n` + admins.map((p, i) => `${i + 1}. ${tag(p.id)}${p.admin === 'superadmin' ? ' 👑' : ''}`).join('\n'), mentions: admins.map(p => p.id) }, { quoted: m })
    }

    if (['group', 'grup', 'gc', 'buka', 'tutup', 'open', 'close', 'locked', 'unlocked'].includes(c)) {
      if (need(true, true)) return
      let mode = c
      if (['group', 'grup', 'gc'].includes(c)) mode = (args[0] || '').toLowerCase()
      if (['buka', 'open'].includes(mode)) { await sock.groupSettingUpdate(m.chat, 'not_announcement'); return reply('🔓 Grup dibuka, semua member bisa kirim pesan.') }
      if (['tutup', 'close'].includes(mode)) { await sock.groupSettingUpdate(m.chat, 'announcement'); return reply('🔒 Grup ditutup, hanya admin yang bisa kirim pesan.') }
      if (mode === 'locked') { await sock.groupSettingUpdate(m.chat, 'locked'); return reply('🔒 Edit info grup dibatasi untuk admin.') }
      if (mode === 'unlocked') { await sock.groupSettingUpdate(m.chat, 'unlocked'); return reply('🔓 Semua member boleh edit info grup.') }
      return reply(`Pakai:\n${prefix}group buka | tutup\n${prefix}group locked | unlocked\n\nAtau langsung ${prefix}buka / ${prefix}tutup`)
    }

    if (['setname', 'setnamegc'].includes(c)) {
      if (need(true, true)) return
      if (!text) return reply(`Contoh: ${prefix}setname Nama Baru`)
      await sock.groupUpdateSubject(m.chat, text.slice(0, 100)); return reply('✅ Nama grup diubah.')
    }
    if (['setdesc', 'setdescgc'].includes(c)) {
      if (need(true, true)) return
      if (!text) return reply(`Contoh: ${prefix}setdesc Aturan grup...`)
      await sock.groupUpdateDescription(m.chat, text.slice(0, 2000)); return reply('✅ Deskripsi grup diubah.')
    }
    if (['linkgc', 'linkgroup', 'linkgrup'].includes(c)) {
      if (need(true, true)) return
      const code = await sock.groupInviteCode(m.chat)
      return reply(`🔗 *Link grup*\nhttps://chat.whatsapp.com/${code}`)
    }
    if (['revoke', 'resetlink'].includes(c)) {
      if (need(true, true)) return
      const code = await sock.groupRevokeInvite(m.chat)
      return reply(`✅ Link lama dicabut.\n🔗 Link baru:\nhttps://chat.whatsapp.com/${code}`)
    }
    if (['del', 'delete', 'hapus'].includes(c)) {
      if (need(true, false)) return
      if (!m.quoted || !m.quoted.key) return reply(`Reply pesan yang mau dihapus lalu ketik ${prefix}del`)
      if (!isBotAdmins && !m.quoted.key.fromMe) return reply(global.mess.botAdmin)
      return sock.sendMessage(m.chat, { delete: m.quoted.key })
    }
    if (['leave', 'keluar'].includes(c)) {
      if (!isCreator) return reply(global.mess.owner)
      if (require('../../lib/core/lock').isLockedGroup(m.chat)) return reply('Grup resmi Chisa AI dikunci, bot tidak bisa keluar dari sini.')
      await reply('👋 Bot keluar dari grup. Sampai jumpa!')
      return sock.groupLeave(m.chat)
    }
  },
}
