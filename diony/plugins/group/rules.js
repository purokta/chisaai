/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Aturan grup: .setrules <teks> (admin), .rules, .delrules (admin)
const fs = require('fs'), path = require('path')
const { B } = require('../../lib/style')
const FILE = path.join(global.dionyData, 'rules.json')
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} } }
const write = (o) => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)) } catch (e) { console.log('[rules] gagal simpan:', e.message) } }
module.exports = {
  name: 'rules', alias: ['aturan', 'setrules', 'setaturan', 'delrules', 'hapusrules'], category: 'group', group: true, noLimit: true, cmds: ['rules', 'setrules', 'delrules'],
  desc: 'Aturan grup: .rules (lihat), .setrules <teks> & .delrules (admin)',
  run: async ({ m, text, command, prefix, reply, isAdmins, isOwner }) => {
    const db = read()
    if (['setrules', 'setaturan'].includes(command)) {
      if (!isAdmins && !isOwner) return reply(global.mess.admin)
      const t = (text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
      if (!t) return reply(`Tulis aturannya.\nContoh:\n${prefix}setrules 1. Saling menghormati\n2. Dilarang spam`)
      db[m.chat] = { t: t.slice(0, 3000), by: m.sender, at: Date.now() }; write(db)
      return reply('✦ Aturan grup disimpan. Anggota bisa melihatnya dengan ' + prefix + 'rules')
    }
    if (['delrules', 'hapusrules'].includes(command)) {
      if (!isAdmins && !isOwner) return reply(global.mess.admin)
      if (!db[m.chat]) return reply('Grup ini belum punya aturan.')
      delete db[m.chat]; write(db); return reply('Aturan grup dihapus.')
    }
    const r = db[m.chat]
    return reply(r ? `${B('ATURAN GRUP')}\n━━━━━━━━━━━━━━━━━━━━\n${r.t}\n\n_Diperbarui ${new Date(r.at + 7 * 3600e3).toISOString().slice(0, 10)}_` : `Grup ini belum punya aturan.\nAdmin bisa membuatnya: ${prefix}setrules <teks>`)
  },
}
