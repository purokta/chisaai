/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Cek ID dan info cepat:
//   .idgc [link grup]    ID grup (tanpa link = grup ini)
//   .cekgc <link grup>   info grup dari link undangan (nama, ID, anggota, pembuat, deskripsi)
//   .cekid [@user]       ID pengirim, chat ini, dan orang yang di-reply / ditandai
const ST = require('../../lib/style'), S = require('../../lib/settingsdb')
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const GC_RE = /chat\.whatsapp\.com\/([A-Za-z0-9]{10,})/i
const tag = (j) => '@' + String(j).split('@')[0]

function fmtDate(sec) {
  if (!sec) return '-'
  try { return new Date(sec * 1000).toLocaleDateString('id-ID', { timeZone: S.get('timezone'), day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '-' }
}

module.exports = {
  name: 'idgc', alias: ['idgrup', 'cekidgc', 'cekgc', 'infolinkgc', 'cekid', 'idme'],
  category: 'tools', cmds: ['idgc', 'cekgc', 'cekid'], noLimit: true,
  desc: 'Cek ID grup, info grup dari link undangan, dan ID pengguna',
  run: async ({ sock, m, reply, text, prefix, command, isGroup, pushname }) => {
    if (['cekid', 'idme', 'myid'].includes(command)) {
      const ctx = (m.msg && m.msg.contextInfo) || {}, mentioned = ctx.mentionedJid || []
      const rows = [`${ST.B('Kamu')}    : ${pushname}`, `${ST.B('ID')}      : \`\`\`${m.sender}\`\`\``, `${ST.B('Chat')}    : \`\`\`${m.chat}\`\`\``]
      if (m.quoted && m.quoted.sender) rows.push(`${ST.B('Reply')}   : \`\`\`${m.quoted.sender}\`\`\``)
      for (const j of mentioned) rows.push(`${ST.B('Tag')}     : \`\`\`${j}\`\`\``)
      return reply(`${ST.B('CEK ID')}\n${LINE}\n${rows.join('\n')}`)
    }
    const mm = String(text || '').match(GC_RE) || String((m.quoted && m.quoted.text) || '').match(GC_RE)
    if (!mm) {
      if (command === 'cekgc' || command === 'infolinkgc') return reply(`Tempel link undangan grupnya.\nContoh: ${prefix}cekgc https://chat.whatsapp.com/XXXXXXXXXXXXXXXX`)
      if (!isGroup) return reply(`Pakai di dalam grup, atau sertakan link grupnya.\nContoh: ${prefix}idgc https://chat.whatsapp.com/XXXXXXXXXXXXXXXX`)
      const meta = await sock.groupMetadata(m.chat).catch(() => null)
      return reply(`${ST.B('ID GRUP')}\n${LINE}\n${ST.B('Nama')} : ${meta ? meta.subject : '-'}\n${ST.B('ID')}   : \`\`\`${m.chat}\`\`\``)
    }
    try {
      const g = await sock.groupGetInviteInfo(mm[1])
      const rows = [
        `${ST.B('Nama')}     : ${g.subject}`,
        `${ST.B('ID')}       : \`\`\`${g.id}\`\`\``,
        `${ST.B('Anggota')}  : ${g.size}`,
        `${ST.B('Dibuat')}   : ${fmtDate(g.creation)}`,
        `${ST.B('Pembuat')}  : ${g.owner ? tag(g.owner) : '-'}`,
        `${ST.B('Obrolan')}  : ${g.announce ? 'hanya admin' : 'semua anggota'}`,
        `${ST.B('Persetujuan')} : ${g.joinApprovalMode ? 'admin menyetujui anggota baru' : 'langsung masuk'}`,
      ]
      if (g.desc) rows.push('', ST.B('Deskripsi'), ST.cut(g.desc, 500))
      return sock.sendMessage(m.chat, { text: `${ST.B('INFO GRUP')}\n${LINE}\n${rows.join('\n')}`, mentions: g.owner ? [g.owner] : [] }, { quoted: m })
    } catch (e) { console.log('[idgc]', e.message); return reply('Link grup tidak valid, sudah dicabut, atau grupnya sudah tidak ada.') }
  },
}
