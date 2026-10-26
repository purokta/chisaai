/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Tag semua anggota / admin, hidetag
const { tag } = require('../../lib/grouputil')

module.exports = {
  name: 'tagall', alias: ['everyone', 'semua', 'tagadmin', 'hidetag', 'h', 'totag'],
  category: 'group', cmds: ['tagall', 'tagadmin', 'hidetag'],
  desc: 'Tag semua anggota / admin, atau hidetag (tag tanpa terlihat)',
  group: true, admin: true,
  run: async ({ sock, m, reply, text, command, groupMetadata, pushname }) => {
    const parts = groupMetadata.participants
    const quotedText = (m.quoted && (m.quoted.text || m.quoted.caption)) || ''
    if (['hidetag', 'h', 'totag'].includes(command)) {
      const msg = text || quotedText
      if (!msg) return reply('Tulis pesannya atau reply pesan.\nContoh: .hidetag Rapat jam 8 ya')
      return sock.sendMessage(m.chat, { text: msg, mentions: parts.map(p => p.id) })
    }
    const adminOnly = command === 'tagadmin'
    const list = parts.filter(p => !adminOnly || p.admin).map(p => p.id)
    const head = `${adminOnly ? '👑 *TAG ADMIN*' : '📢 *TAG SEMUA*'}  (${list.length})\n👤 Oleh: ${pushname}\n💬 ${text || quotedText || 'Tidak ada pesan'}\n\n`
    await sock.sendMessage(m.chat, { text: head + list.map(j => '• ' + tag(j)).join('\n'), mentions: list }, { quoted: m })
  },
}
