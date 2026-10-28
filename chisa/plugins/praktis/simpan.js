/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Penyimpan catatan cepat (kunci → isi) per pengguna: .simpan, .ambil, .daftarsimpan, .hapussimpan
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'simpan', alias: ['ambil', 'daftarsimpan', 'hapussimpan', 'snippet'], category: 'praktis', noLimit: true, cmds: ['simpan', 'ambil', 'daftarsimpan', 'hapussimpan'],
  desc: 'Simpan teks/catatan cepat: .simpan <kunci> <isi>, .ambil <kunci>, .daftarsimpan, .hapussimpan <kunci>',
  run: async ({ m, args, command, prefix, reply }) => {
    const db = K.get(m.sender, 'snip', {}), key = (args[0] || '').toLowerCase().slice(0, 30)
    if (command === 'daftarsimpan') { const ks = Object.keys(db); return reply(ks.length ? `${B('CATATAN TERSIMPAN')} (${ks.length})\n` + ks.map(k => `• ${k}  _(${db[k].length} huruf)_`).join('\n') + `\n\n_${prefix}ambil <kunci>_` : `Belum ada catatan. Simpan: ${prefix}simpan <kunci> <isi>`) }
    if (command === 'simpan' || command === 'snippet') {
      let val = args.slice(1).join(' ').trim() || (m.quoted && (m.quoted.text || m.quoted.caption)) || ''
      if (!key || !val) return reply(`Format: ${prefix}simpan <kunci> <isi>\natau reply pesan: ${prefix}simpan <kunci>`)
      if (!db[key] && Object.keys(db).length >= 50) return reply('✕ Maksimal 50 catatan. Hapus dulu dengan ' + prefix + 'hapussimpan <kunci>')
      db[key] = val.slice(0, 2000); K.set(m.sender, 'snip', db)
      return reply(`✦ Tersimpan sebagai *${key}*. Ambil: ${prefix}ambil ${key}`)
    }
    if (!key) return reply(`Format: ${prefix}${command} <kunci>`)
    if (command === 'hapussimpan') { if (!db[key]) return reply('Kunci tidak ditemukan.'); delete db[key]; K.set(m.sender, 'snip', db); return reply(`Dihapus: *${key}*`) }
    const hit = db[key] !== undefined ? key : Object.keys(db).find(k => k.startsWith(key))
    return reply(hit ? db[hit] : `Kunci "${key}" tidak ada. Lihat: ${prefix}daftarsimpan`)
  },
}
