/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Peringatan anggota: 3x warn otomatis kick (jika bot admin)
const { targets, readWarns, saveWarns, tag } = require('../../lib/grouputil')
const MAX = 3

module.exports = {
  name: 'warn', alias: ['peringatan', 'unwarn', 'delwarn', 'resetwarn', 'listwarn', 'cekwarn'],
  category: 'group', cmds: ['warn', 'unwarn', 'listwarn'], menu: ['warn', 'unwarn', 'resetwarn', 'listwarn'],
  desc: 'Beri / cabut peringatan anggota (3x = kick otomatis)',
  group: true, admin: true,
  run: async ({ sock, m, reply, text, command, prefix, isBotAdmins, groupMetadata, botNumber }) => {
    const db = readWarns(), gid = m.chat
    db[gid] = db[gid] || {}
    if (['listwarn', 'cekwarn'].includes(command)) {
      const rows = Object.entries(db[gid]).filter(([, n]) => n > 0)
      if (!rows.length) return reply('Belum ada anggota yang diperingatkan.')
      return sock.sendMessage(m.chat, { text: '*DAFTAR PERINGATAN*\n\n' + rows.map(([j, n], i) => `${i + 1}. ${tag(j)} — ${n}/${MAX}`).join('\n'), mentions: rows.map(([j]) => j) }, { quoted: m })
    }
    const list = targets(m, text.replace(/^\d+\s/, ''))
    if (!list.length) return reply(`Tandai orangnya atau reply pesannya.\nContoh: ${prefix}${command} @user alasan`)
    const adminIds = groupMetadata.participants.filter(p => p.admin).map(p => p.id)
    const reason = text.replace(/@\d+/g, '').replace(/\b\d{8,15}\b/g, '').trim()
    for (const jid of list) {
      if (jid === botNumber || adminIds.includes(jid)) { await reply(`${tag(jid)} admin/bot tidak bisa diperingatkan.`); continue }
      if (['unwarn', 'delwarn'].includes(command)) {
        db[gid][jid] = Math.max(0, (db[gid][jid] || 0) - 1)
        await sock.sendMessage(m.chat, { text: `✅ Peringatan ${tag(jid)} dikurangi: ${db[gid][jid]}/${MAX}`, mentions: [jid] }, { quoted: m })
      } else if (command === 'resetwarn') {
        db[gid][jid] = 0
        await sock.sendMessage(m.chat, { text: `♻️ Peringatan ${tag(jid)} direset.`, mentions: [jid] }, { quoted: m })
      } else {
        db[gid][jid] = (db[gid][jid] || 0) + 1
        const n = db[gid][jid]
        if (n >= MAX && isBotAdmins) {
          db[gid][jid] = 0
          await sock.sendMessage(m.chat, { text: `🚫 ${tag(jid)} sudah ${MAX}x diperingatkan dan dikeluarkan dari grup.`, mentions: [jid] }, { quoted: m })
          await sock.groupParticipantsUpdate(m.chat, [jid], 'remove').catch(() => {})
        } else {
          await sock.sendMessage(m.chat, { text: `⚠️ ${tag(jid)} diperingatkan (${n}/${MAX})${reason ? `\nAlasan: ${reason}` : ''}${n >= MAX ? '\n(Bot bukan admin, tidak bisa kick otomatis)' : ''}`, mentions: [jid] }, { quoted: m })
        }
      }
    }
    saveWarns(db)
  },
}
