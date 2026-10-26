/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tasbih — penghitung dzikir digital dengan target putaran
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'tasbih', alias: ['dzikir', 'zikir', 'hitungdzikir'], category: 'ekstra', noLimit: true, cmds: ['tasbih'],
  desc: 'Tasbih digital: .tasbih [+n] • target <n> • reset • total',
  run: async ({ m, args, prefix, reply }) => {
    const d = K.get(m.sender, 'tasbih', { c: 0, target: 33, rounds: 0, total: 0 }), sub = (args[0] || '').toLowerCase(), p = prefix + 'tasbih', save = () => K.set(m.sender, 'tasbih', d)
    if (sub === 'target') { const n = parseInt(args[1], 10); if (!(n >= 1 && n <= 10000)) return reply(`Format: ${p} target <1-10000>\nContoh: ${p} target 100`); d.target = n; d.c = Math.min(d.c, n - 1); save(); return reply(`✦ Target per putaran: *${n}*`) }
    if (sub === 'reset') { K.set(m.sender, 'tasbih', { c: 0, target: d.target, rounds: 0, total: 0 }); return reply('Hitungan direset.') }
    if (sub === 'total') return reply(`✦ ${B('TASBIH')}\n┣ Total hitungan : ${d.total}\n┣ Putaran selesai: ${d.rounds}\n┗ Putaran berjalan: ${d.c}/${d.target}`)
    const add = Math.min(1000, Math.max(1, parseInt(String(args[0] || '1').replace('+', ''), 10) || 1))
    let done = 0; d.c += add; d.total += add
    while (d.c >= d.target) { d.c -= d.target; d.rounds++; done++ }
    save()
    return reply(`✦ ${B(String(d.c))} / ${d.target}\n${K.bar(d.c / d.target, 16)}${done ? `\n\n✦ *Target ${d.target} tercapai!* (${done}x) Alhamdulillah.\nTotal putaran: ${d.rounds}` : ''}\n_${p} +10 • target <n> • total • reset_`)
  },
}
