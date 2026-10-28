/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Catatan grup: simpan teks yang sering ditanyakan (jadwal, link, aturan kecil) lalu panggil dengan nama.
//   .addnote <nama> <isi> (admin)  .note <nama>  .listnote  .delnote <nama> (admin)
const fs = require('fs'), path = require('path'), { B } = require('../../lib/style')
const FILE = path.join(global.chisaData, 'notegrup.json')
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} } }
const write = (o) => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)) } catch (e) { console.log('[note] gagal simpan:', e.message) } }
const key = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30)

module.exports = {
  name: 'note', alias: ['addnote', 'listnote', 'delnote', 'catatgrup', 'hapusnote'], category: 'group', group: true, noLimit: true, cmds: ['note', 'addnote', 'listnote', 'delnote'],
  desc: 'Catatan grup: .addnote <nama> <isi> (admin), .note <nama>, .listnote, .delnote <nama> (admin)',
  run: async ({ m, args, command, prefix, reply, isAdmins, isOwner }) => {
    const db = read(), g = db[m.chat] || (db[m.chat] = {})
    if (['addnote', 'catatgrup'].includes(command)) {
      if (!isAdmins && !isOwner) return reply(global.mess.admin)
      const name = key(args[0]), body = (args.slice(1).join(' ') || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
      if (!name || !body) return reply(`Contoh:\n${prefix}addnote jadwal Piket Senin: Ali, Selasa: Budi\natau reply sebuah pesan: ${prefix}addnote link\n\n_Nama: huruf kecil/angka, tanpa spasi._`)
      if (!g[name] && Object.keys(g).length >= 40) return reply('✕ Maksimal 40 catatan per grup.')
      g[name] = { t: body.slice(0, 3000), by: m.sender, at: Date.now() }; write(db)
      return reply(`✦ Catatan "${name}" disimpan. Panggil: ${prefix}note ${name}`)
    }
    if (['delnote', 'hapusnote'].includes(command)) {
      if (!isAdmins && !isOwner) return reply(global.mess.admin)
      const name = key(args[0]); if (!g[name]) return reply(`Catatan "${name || '?'}" tidak ada. Lihat: ${prefix}listnote`)
      delete g[name]; write(db); return reply(`Catatan "${name}" dihapus.`)
    }
    if (command === 'listnote' || !args.length) {
      const names = Object.keys(g); if (!names.length) return reply(`Grup ini belum punya catatan.\nAdmin bisa menambah: ${prefix}addnote <nama> <isi>`)
      return reply(`${B('CATATAN GRUP')}\n${names.map(n => `◇ ${n}`).join('\n')}\n\n_Buka: ${prefix}note <nama>_`)
    }
    const name = key(args[0]), n = g[name]; if (!n) return reply(`Catatan "${name}" tidak ada. Lihat: ${prefix}listnote`)
    return reply(`${B(name.toUpperCase())}\n${n.t}`)
  },
}
