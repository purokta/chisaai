/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kelola anggota: kick, add, promote, demote
const { targets, tag, clean } = require('../../lib/grouputil')

module.exports = {
  name: 'remove', alias: ['remove', 'tendang', 'add', 'tambah', 'jadiadmin', 'turunadmin'],
  category: 'group', cmds: ['add'],
  desc: 'Kick / tambah / promote / demote anggota (mention, reply, atau nomor)',
  group: true, admin: true, botAdmin: true,
  run: async ({ sock, m, reply, text, command, prefix, isCreator, groupMetadata, botNumber }) => {
    const act = ['kick', 'remove', 'tendang'].includes(command) ? 'kick' : ['add', 'tambah'].includes(command) ? 'add' : ['promote', 'jadiadmin'].includes(command) ? 'promote' : 'demote'
    let list = targets(m, text)
    if (!list.length) return reply(`Tandai orangnya, reply pesannya, atau tulis nomornya.\nContoh: ${prefix}${command} @user  |  ${prefix}${command} 628xxxx`)
    const parts = groupMetadata.participants
    const admins = parts.filter(p => p.admin).map(p => p.id)
    const owners = (global.owner || []).map(o => clean(o) + '@s.whatsapp.net')

    if (act === 'add') {
      const out = []
      for (const jid of list) {
        if (parts.some(p => p.id === jid)) { out.push(`⚠️ ${tag(jid)} sudah ada di grup`); continue }
        try {
          const res = await sock.groupParticipantsUpdate(m.chat, [jid], 'add')
          const st = String((res && res[0] && res[0].status) || '200')
          if (st === '200') out.push(`✅ ${tag(jid)} ditambahkan`)
          else if (st === '403' || st === '408') { // privasi: kirim undangan lewat chat pribadi
            try {
              const code = await sock.groupInviteCode(m.chat)
              await sock.sendMessage(jid, { text: `Kamu diundang ke grup *${groupMetadata.subject}*\nhttps://chat.whatsapp.com/${code}` })
              out.push(`📨 ${tag(jid)} privasi diaktifkan, undangan dikirim ke chat pribadinya`)
            } catch { out.push(`❌ ${tag(jid)} tidak bisa ditambahkan (privasi)`) }
          } else if (st === '409') out.push(`⚠️ ${tag(jid)} sudah ada di grup`)
          else if (st === '401') out.push(`❌ ${tag(jid)} memblokir bot`)
          else out.push(`❌ ${tag(jid)} gagal (kode ${st})`)
        } catch (e) { out.push(`❌ ${tag(jid)} gagal: ${e.message}`) }
      }
      return sock.sendMessage(m.chat, { text: out.join('\n'), mentions: list }, { quoted: m })
    }

    // kick / promote / demote: lewati yang tidak boleh
    const skipped = []
    list = list.filter(jid => {
      if (jid === botNumber) { skipped.push('bot sendiri'); return false }
      if (!parts.some(p => p.id === jid)) { skipped.push(`${tag(jid)} bukan anggota`); return false }
      if (act === 'kick' && (admins.includes(jid) || owners.includes(jid)) && !isCreator) { skipped.push(`${tag(jid)} admin/owner`); return false }
      if (act === 'promote' && admins.includes(jid)) { skipped.push(`${tag(jid)} sudah admin`); return false }
      if (act === 'demote' && !admins.includes(jid)) { skipped.push(`${tag(jid)} bukan admin`); return false }
      return true
    })
    const mention = list.slice()
    if (list.length) {
      await sock.groupParticipantsUpdate(m.chat, list, act === 'kick' ? 'remove' : act)
      const verb = { kick: 'dikeluarkan', promote: 'dijadikan admin', demote: 'diturunkan dari admin' }[act]
      await sock.sendMessage(m.chat, { text: `✅ ${list.map(tag).join(', ')} ${verb}.` + (skipped.length ? `\n\nDilewati: ${skipped.join(', ')}` : ''), mentions: [...mention] }, { quoted: m })
    } else reply(`Tidak ada yang diproses.\nDilewati: ${skipped.join(', ')}`)
  },
}
