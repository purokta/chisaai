/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pengaturan grup tambahan (admin grup, bot harus admin):
//   .ephemeral <off|24j|7h|90h>   pesan sementara (hilang otomatis setelah 24 jam / 7 hari / 90 hari)
//   .setppgc                      kirim / reply foto untuk jadi foto grup
//   .delppgc                      hapus foto grup
const MP = require('../../lib/mediapick')
const OPT = { off: 0, mati: 0, '0': 0, '24j': 86400, '1h': 86400, '1d': 86400, '24h': 86400, '7h': 604800, '7d': 604800, '90h': 7776000, '90d': 7776000 }
const NAME = { 0: 'dimatikan', 86400: '24 jam', 604800: '7 hari', 7776000: '90 hari' }
module.exports = {
  name: 'ephemeral', alias: ['pesansementara', 'disappearing', 'setppgc', 'setppgrup', 'delppgc', 'hapusppgc'], category: 'group', cmds: ['ephemeral', 'setppgc', 'delppgc'],
  desc: 'Pesan sementara grup, ganti dan hapus foto grup', group: true, admin: true, botAdmin: true,
  run: async ({ sock, m, reply, args, command, prefix }) => {
    try {
      if (['ephemeral', 'pesansementara', 'disappearing'].includes(command)) {
        const k = String(args[0] || '').toLowerCase()
        if (!(k in OPT)) return reply(`Pilih durasinya:\n${prefix}ephemeral off\n${prefix}ephemeral 24j\n${prefix}ephemeral 7h\n${prefix}ephemeral 90h`)
        await sock.groupToggleEphemeral(m.chat, OPT[k])
        return reply(`Pesan sementara grup: *${NAME[OPT[k]]}*.`)
      }
      if (['delppgc', 'hapusppgc'].includes(command)) { await sock.removeProfilePicture(m.chat); return reply('Foto grup dihapus.') }
      const media = MP.pick(m)
      if (!media || media.kind !== 'image') return reply(`Kirim atau reply sebuah foto dengan ${prefix}setppgc.`)
      await sock.updateProfilePicture(m.chat, await MP.download(media))
      return reply('Foto grup diganti.')
    } catch (e) { console.log('[grupset]', e.message); reply('Gagal: ' + e.message) }
  },
}
