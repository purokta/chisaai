/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Habit tracker: kebiasaan harian + streak + progres 7 hari
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const streakOf = (days) => { const s = new Set(days); let c = K.dayKey(); if (!s.has(c)) c = K.addDays(c, -1); let n = 0; while (s.has(c)) { n++; c = K.addDays(c, -1) } return n }
const week = (days) => { const s = new Set(days); let o = ''; for (let i = 6; i >= 0; i--) o += s.has(K.addDays(K.dayKey(), -i)) ? '■' : '□'; return o }

module.exports = {
  name: 'habit', alias: ['kebiasaan', 'habittracker'], category: 'praktis', noLimit: true, cmds: ['habit'],
  desc: 'Habit tracker: bangun kebiasaan harian dengan streak dan progres 7 hari',
  run: async ({ m, args, prefix, reply }) => {
    const sub = (args[0] || 'list').toLowerCase(), list = K.get(m.sender, 'habits', []), today = K.dayKey()
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const name = args.slice(1).join(' ').trim().slice(0, 60)
      if (!name) return reply(`✕ Tulis nama kebiasaannya.\nContoh: ${prefix}habit tambah Olahraga`)
      if (list.length >= 15) return reply('✕ Maksimal 15 kebiasaan. Hapus salah satu dulu.')
      list.push({ name, days: [], created: today }); K.set(m.sender, 'habits', list)
      return reply(`✦ Kebiasaan *${name}* ditambahkan.\n_Centang tiap hari: ${prefix}habit cek ${list.length}_`)
    }
    if (['cek', 'done', 'centang', 'check'].includes(sub)) {
      const no = parseInt(args[1], 10)
      if (!no || no < 1 || no > list.length) return reply(`✕ Nomor tidak valid. Lihat ${prefix}habit list`)
      const h = list[no - 1]
      if (h.days.includes(today)) { h.days = h.days.filter(d => d !== today); K.set(m.sender, 'habits', list); return reply(`↩ Centang hari ini untuk *${h.name}* dibatalkan.`) }
      h.days.push(today); h.days = h.days.slice(-400); K.set(m.sender, 'habits', list)
      const st = streakOf(h.days)
      return reply(`✦ *${h.name}* selesai hari ini!\n┣ ${B('Streak')} : ${st} hari${st >= 30 ? ' ★★★' : st >= 7 ? ' ★' : ''}\n┗ ${B('7 hari')} : ${week(h.days)}`)
    }
    if (['hapus', 'del', 'delete'].includes(sub)) {
      const no = parseInt(args[1], 10)
      if (!no || no < 1 || no > list.length) return reply('✕ Nomor tidak valid.')
      const [r] = list.splice(no - 1, 1); K.set(m.sender, 'habits', list)
      return reply(`Kebiasaan *${r.name}* dihapus.`)
    }
    if (!list.length) return reply(`✦ ${B('HABIT TRACKER')}\n\nBelum ada kebiasaan.\nMulai: ${prefix}habit tambah <nama>`)
    const done = list.filter(h => h.days.includes(today)).length
    let t = `✦ ${B('HABIT TRACKER')}\n${K.bar(done / list.length)} ${done}/${list.length} hari ini\n\n`
    list.forEach((h, i) => { t += `${h.days.includes(today) ? '◆' : '◇'} *${i + 1}. ${h.name}*\n   ${B('streak')} ${streakOf(h.days)} hari  ${week(h.days)}\n` })
    return reply(t + `\n_${prefix}habit cek <no> • ${prefix}habit hapus <no>_`)
  },
}
