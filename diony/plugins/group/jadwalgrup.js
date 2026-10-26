/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// BUKA / TUTUP GRUP OTOMATIS (admin; bot harus admin)
//   .jadwalbuka 06:00      grup dibuka otomatis tiap hari jam itu (zona waktu bot)
//   .jadwaltutup 22:00     grup ditutup otomatis tiap hari jam itu
//   .hapusjadwal [buka|tutup|semua]     .listjadwal
const GG = require('../../lib/grupdb'), J = require('../../lib/grupjadwal'), { B } = require('../../lib/style')
module.exports = {
  name: 'jadwalbuka', alias: ['jadwaltutup', 'hapusjadwal', 'listjadwal', 'jadwalgrup'],
  category: 'group', group: true, noLimit: true, cmds: ['jadwalbuka', 'jadwaltutup', 'hapusjadwal', 'listjadwal'],
  desc: 'Jadwal buka/tutup grup otomatis tiap hari',
  run: async ({ m, reply, args, command, prefix, isAdmins, isBotAdmins, isCreator, S }) => {
    const g = GG.get(m.chat), jd = g.jadwal || {}
    if (['listjadwal', 'jadwalgrup'].includes(command)) return reply(`${B('JADWAL GRUP')}\n━━━━━━━━━━━━━━━━━━━━\nBuka otomatis  : ${jd.open || '-'}\nTutup otomatis : ${jd.close || '-'}\nZona waktu     : ${S.get('timezone')}\n\n${prefix}jadwalbuka 06:00 • ${prefix}jadwaltutup 22:00 • ${prefix}hapusjadwal`)
    if (!isAdmins && !isCreator) return reply(global.mess.admin)
    if (command === 'hapusjadwal') {
      const v = (args[0] || 'semua').toLowerCase()
      if (['buka', 'open'].includes(v)) delete jd.open; else if (['tutup', 'close'].includes(v)) delete jd.close; else { delete jd.open; delete jd.close }
      g.jadwal = jd.open || jd.close ? jd : undefined; if (!g.jadwal) delete g.jadwal; GG.save(); return reply('Jadwal dihapus.')
    }
    const t = J.norm(args[0]); if (!t) return reply(`Tulis jamnya (24 jam).\nContoh: ${prefix}${command} ${command === 'jadwalbuka' ? '06:00' : '22:00'}`)
    const kind = command === 'jadwalbuka' ? 'open' : 'close'
    g.jadwal = Object.assign(jd, { [kind]: t }); g.jadwal.last = g.jadwal.last || {}; delete g.jadwal.last[kind]; GG.save()
    return reply(`Grup akan *${kind === 'open' ? 'dibuka' : 'ditutup'}* otomatis tiap hari pukul *${t}* (${S.get('timezone')}).${isBotAdmins ? '' : '\n\n_Bot belum jadi admin, jadikan admin agar jadwal berjalan._'}`)
  },
}
