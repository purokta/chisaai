/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Stopwatch pribadi + lap (berbasis timestamp, tahan restart)
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const fmt = (ms) => { const t = Math.floor(ms / 10), cs = String(t % 100).padStart(2, '0'), s = Math.floor(t / 100), ss = String(s % 60).padStart(2, '0'), hh = Math.floor(s / 3600), mm = Math.floor(s / 60) % 60; return `${hh ? hh + ':' + String(mm).padStart(2, '0') : Math.floor(s / 60)}:${ss}.${cs}` }
module.exports = {
  name: 'stopwatch', alias: ['sw'], category: 'praktis', noLimit: true, cmds: ['stopwatch'],
  desc: 'Stopwatch pribadi dengan lap: start, lap, stop, cek',
  run: async ({ m, args, prefix, reply }) => {
    const sub = (args[0] || 'cek').toLowerCase(), sw = K.get(m.sender, 'stopwatch', null)
    if (['start', 'mulai', 'go'].includes(sub)) {
      if (sw) return reply(`✦ Stopwatch sudah berjalan: *${fmt(Date.now() - sw.start)}*\n_${prefix}stopwatch stop untuk berhenti_`)
      K.set(m.sender, 'stopwatch', { start: Date.now(), laps: [] }); return reply(`✦ ${B('STOPWATCH')} dimulai.\n_${prefix}stopwatch lap • ${prefix}stopwatch stop_`)
    }
    if (!sw) return reply(`Stopwatch belum jalan. Mulai: ${prefix}stopwatch start`)
    const el = Date.now() - sw.start
    if (['lap', 'split'].includes(sub)) {
      if (sw.laps.length >= 50) return reply('✕ Maksimal 50 lap.')
      sw.laps.push(el); K.set(m.sender, 'stopwatch', sw)
      return reply(`✦ ${B('LAP')} ${sw.laps.length}\n┣ Total : ${fmt(el)}\n┗ Lap : +${fmt(el - (sw.laps[sw.laps.length - 2] || 0))}`)
    }
    if (['stop', 'berhenti', 'selesai'].includes(sub)) {
      K.set(m.sender, 'stopwatch', null)
      let t = `✦ ${B('STOPWATCH SELESAI')}\n\nWaktu total: *${fmt(el)}*`
      if (sw.laps.length) { const d = sw.laps.map((l, i) => l - (sw.laps[i - 1] || 0)); t += `\n\n` + sw.laps.map((l, i) => `${i + 1}. ${fmt(l)} (+${fmt(d[i])})`).join('\n') + `\n\nTercepat: lap ${d.indexOf(Math.min(...d)) + 1}` }
      return reply(t)
    }
    return reply(`✦ Berjalan: *${fmt(el)}* (${sw.laps.length} lap)`)
  },
}
