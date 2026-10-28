/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Anti-spam grup: pesan beruntun melebihi batas dalam 8 detik -> pesan dihapus + peringatan (bot harus admin).
//   .antispam on|off|batas <3-15>   (admin)   — admin grup & owner tidak terkena
const DB = require('../../lib/jsondb')('antispam'), { B } = require('../../lib/style')
const hist = new Map(), warned = new Map(), metaCache = new Map()
const cfg = (chat) => (DB.data[chat] = DB.data[chat] || { on: false, max: 6 })
async function admins(sock, chat) {
  const c = metaCache.get(chat); if (c && Date.now() - c.at < 60000) return c.list
  const meta = await sock.groupMetadata(chat).catch(() => null)
  const list = meta ? meta.participants.filter(p => p.admin).map(p => p.id) : []
  metaCache.set(chat, { at: Date.now(), list }); return list
}
module.exports = {
  name: 'antispam', alias: ['antiflood'], category: 'group', group: true, noLimit: true, cmds: ['antispam'],
  desc: 'Hapus pesan spam beruntun: .antispam on|off|batas <3-15> (admin)',
  run: async ({ args, prefix, reply, isAdmins, isOwner, isBotAdmins, m }) => {
    const c = cfg(m.chat), s = (args[0] || '').toLowerCase()
    if (!s) return reply(`${B('ANTI SPAM')}\nStatus : *${c.on ? 'aktif' : 'mati'}*\nBatas  : ${c.max} pesan / 8 detik\nBot admin : ${isBotAdmins ? 'ya' : 'BUKAN admin (tidak bisa menghapus)'}\n\n${prefix}antispam on | off | batas <3-15>`)
    if (!isAdmins && !isOwner) return reply(global.mess.admin)
    if (s === 'on' || s === 'off') { c.on = s === 'on'; DB.save(); return reply(`Anti spam ${c.on ? 'diaktifkan' : 'dimatikan'}.${c.on && !isBotAdmins ? '\n_Jadikan bot admin agar bisa menghapus pesan._' : ''}`) }
    if (s === 'batas') { const n = parseInt(args[1], 10); if (!(n >= 3 && n <= 15)) return reply(`Batas 3–15. Contoh: ${prefix}antispam batas 6`); c.max = n; DB.save(); return reply(`Batas diubah: ${n} pesan / 8 detik.`) }
    return reply(`Pakai: ${prefix}antispam on | off | batas <3-15>`)
  },
  before: async ({ sock, m, isGroup }) => {
    if (!isGroup || m.key.fromMe) return false
    const c = DB.data[m.chat]; if (!c || !c.on) return false
    const key = m.chat + m.sender, now = Date.now(), arr = (hist.get(key) || []).filter(t => now - t < 8000); arr.push(now); hist.set(key, arr)
    if (arr.length <= c.max) return false
    const list = await admins(sock, m.chat), me = await sock.decodeJid(sock.user.id)
    if (list.includes(m.sender) || !list.includes(me)) return false
    if ((global.owner || []).some(o => String(o).replace(/\D/g, '') + '@s.whatsapp.net' === m.sender)) return false
    sock.sendMessage(m.chat, { delete: m.key }).catch(() => {})
    if (now - (warned.get(key) || 0) > 30000) { warned.set(key, now); sock.sendMessage(m.chat, { text: `⚠️ @${m.sender.split('@')[0]} pelan-pelan ya, jangan spam.`, mentions: [m.sender] }).catch(() => {}) }
    return true
  },
}
