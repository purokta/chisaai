/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pomodoro di chat: .pomodoro [fokus menit] [istirahat menit] — bot mengingatkan saat fokus & istirahat selesai.
// Timer berjalan di memori bot (hilang bila bot restart). Untuk versi visual: .pomolive
const { B } = require('../../lib/style')
const runs = new Map()   // chat|sender -> { timer, phase, cycle, ends, focus, brk }
const clamp = (n, lo, hi, d) => Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d
const left = (r) => { const s = Math.max(0, Math.round((r.ends - Date.now()) / 1000)); return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}d` }

module.exports = {
  name: 'pomodoro', alias: ['pomo', 'fokus', 'stoppomodoro'], category: 'praktis', noLimit: true, cmds: ['pomodoro'],
  desc: 'Pomodoro: .pomodoro [fokus] [istirahat] • .pomodoro status • .pomodoro stop',
  run: async ({ sock, m, args, command, prefix, reply }) => {
    const key = m.chat + '|' + m.sender, a = (args[0] || '').toLowerCase(), cur = runs.get(key)
    const stop = () => { if (cur) { clearTimeout(cur.timer); runs.delete(key) } }
    if (command === 'stoppomodoro' || ['stop', 'berhenti', 'batal'].includes(a)) { if (!cur) return reply('Tidak ada pomodoro berjalan.'); stop(); return reply('Pomodoro dihentikan. Kerja bagus!') }
    if (['status', 'cek'].includes(a)) return reply(cur ? `${B('POMODORO')}\nFase: *${cur.phase}* • sesi ${cur.cycle}/4\nSisa: ${left(cur)}` : 'Tidak ada pomodoro berjalan.')
    if (cur) return reply(`Pomodoro masih berjalan (${cur.phase}, sisa ${left(cur)}).\nHentikan: ${prefix}pomodoro stop`)
    const focus = clamp(parseInt(args[0], 10), 5, 90, 25), brk = clamp(parseInt(args[1], 10), 1, 30, 5)
    const r = { phase: 'fokus', cycle: 1, focus, brk, ends: 0, timer: null }; runs.set(key, r)
    const tag = '@' + m.sender.split('@')[0], say = (t) => sock.sendMessage(m.chat, { text: t, mentions: [m.sender] }).catch(() => {})
    const go = (phase, min) => {
      r.phase = phase; r.ends = Date.now() + min * 60000
      r.timer = setTimeout(() => {
        if (phase === 'fokus') {
          if (r.cycle >= 4) { runs.delete(key); return say(`${tag} ✦ *4 sesi selesai!* Kamu luar biasa. Istirahat panjang 15-30 menit ya.`) }
          say(`${tag} ⏰ Fokus selesai. *Istirahat ${r.brk} menit* — regangkan badan, minum air.`); go('istirahat', r.brk)
        } else { r.cycle++; say(`${tag} ✦ Istirahat habis. *Sesi ${r.cycle}/4*: fokus ${r.focus} menit, mulai!`); go('fokus', r.focus) }
      }, min * 60000)
    }
    go('fokus', focus)
    return reply(`${B('POMODORO')} dimulai\n┣ Fokus ${focus} menit → istirahat ${brk} menit\n┣ Siklus: 4 sesi\n┗ Aku akan mengingatkanmu di chat ini.\n\n_${prefix}pomodoro status • ${prefix}pomodoro stop_`)
  },
}
