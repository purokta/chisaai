/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// WELCOME / GOODBYE KHUSUS PER GRUP (admin)
//   .welcome <on|off>     .goodbye <on|off>      hidupkan / matikan kartu sambutan & perpisahan di grup ini (menimpa pengaturan bot)
//   .setwelcome <teks>    .setgoodbye <teks>     teks sendiri; variabel: @user @group @count
//   .resetwelcome  .resetgoodbye                 kembali ke teks bawaan bot
//   .cekwelcome                                   lihat pengaturan welcome & goodbye grup ini
const GG = require('../../lib/grupdb'), { B } = require('../../lib/style')
module.exports = {
  name: 'setwelcome', alias: ['goodbye', 'setgoodbye', 'resetwelcome', 'resetgoodbye', 'cekwelcome'],
  category: 'group', group: true, noLimit: true, admin: true,
  cmds: ['goodbye', 'setwelcome', 'setgoodbye', 'resetwelcome', 'resetgoodbye', 'cekwelcome'],
  desc: 'Atur welcome / goodbye khusus grup ini: on/off dan teks sendiri',
  run: async ({ m, reply, text, args, command, prefix, S }) => {
    const g = GG.get(m.chat), kind = /goodbye/.test(command) ? 'goodbye' : 'welcome'
    const label = kind === 'welcome' ? 'Welcome' : 'Goodbye', key = kind + 'Text'
    if (command === 'welcome' || command === 'goodbye') {
      const v = (args[0] || '').toLowerCase()
      if (['reset', 'ikut', 'default'].includes(v)) { delete g[kind]; GG.save(); return reply(`${label} grup ini kembali mengikuti pengaturan bot (${S.get(kind) ? 'aktif' : 'mati'}).`) }
      if (!['on', 'off'].includes(v)) return reply(`${label} grup ini: *${g[kind] === undefined ? 'ikut pengaturan bot (' + (S.get(kind) ? 'aktif' : 'mati') + ')' : g[kind] ? 'aktif' : 'mati'}*\nUbah: ${prefix}${command} on | off | reset`)
      g[kind] = v === 'on'; GG.save(); return reply(`${label} grup ini *${g[kind] ? 'dihidupkan' : 'dimatikan'}*.`)
    }
    if (command === 'setwelcome' || command === 'setgoodbye') {
      const t = String(text || '').trim()
      if (!t) return reply(`Tulis teksnya.\nVariabel: @user (nama/tag) • @group (nama grup) • @count (jumlah member)\n\nContoh:\n${prefix}${command} Halo @user, selamat datang di @group! Kamu member ke-@count. Baca rules ya.`)
      if (t.length > 600) return reply('Teks terlalu panjang (maksimal 600 karakter).')
      g[key] = t; if (g[kind] === undefined) g[kind] = true; GG.save()
      return reply(`Teks ${label.toLowerCase()} grup ini disimpan:\n\n${t.replace(/@user/g, '@anggota').replace(/@group/g, 'nama grup').replace(/@count/g, '123')}`)
    }
    if (command === 'resetwelcome' || command === 'resetgoodbye') { delete g[key]; GG.save(); return reply(`Teks ${label.toLowerCase()} dikembalikan ke bawaan bot.`) }
    const st = (k) => g[k] === undefined ? `ikut bot (${S.get(k) ? 'aktif' : 'mati'})` : g[k] ? 'aktif' : 'mati'
    return reply(`${B('WELCOME & GOODBYE GRUP')}\n━━━━━━━━━━━━━━━━━━━━\nWelcome : ${st('welcome')}\n${g.welcomeText || global.welcomeText}\n\nGoodbye : ${st('goodbye')}\n${g.goodbyeText || global.goodbyeText}`)
  },
}
