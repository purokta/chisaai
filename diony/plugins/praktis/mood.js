/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Jurnal mood harian (1-5) + statistik
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const LABEL = { 1: 'Buruk', 2: 'Kurang baik', 3: 'Biasa saja', 4: 'Baik', 5: 'Luar biasa' }
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

module.exports = {
  name: 'mood', alias: ['jurnal', 'moodtracker', 'jurnalmood'], category: 'praktis', noLimit: true, cmds: ['mood'],
  desc: 'Jurnal suasana hati harian (1-5), riwayat, dan statistik mingguan/bulanan',
  run: async ({ m, args, prefix, reply }) => {
    const logs = K.get(m.sender, 'mood', {}), first = (args[0] || '').toLowerCase()
    if (/^[1-5]$/.test(first)) {
      const note = args.slice(1).join(' ').trim().slice(0, 140); logs[K.dayKey()] = { v: +first, note }
      const keys = Object.keys(logs).sort().slice(-400)
      K.set(m.sender, 'mood', Object.fromEntries(keys.map(k => [k, logs[k]])))
      return reply(`✦ ${B('MOOD HARI INI')}\n${stars(+first)}  *${LABEL[first]}* (${first}/5)${note ? `\n┗ ${note}` : ''}\n\n_Statistik: ${prefix}mood statistik_`)
    }
    if (['riwayat', 'history', 'list'].includes(first)) {
      const ks = Object.keys(logs).sort().slice(-10).reverse()
      if (!ks.length) return reply('Belum ada catatan mood.')
      return reply(`✦ ${B('10 CATATAN TERAKHIR')}\n\n` + ks.map(k => `${stars(logs[k].v)} ${K.fmtTanggal(k)}${logs[k].note ? `\n   _${logs[k].note}_` : ''}`).join('\n'))
    }
    if (['statistik', 'stat', 'stats', 'rata'].includes(first)) {
      const st = (n) => { const v = []; for (let i = 0; i < n; i++) { const e = logs[K.addDays(K.dayKey(), -i)]; if (e) v.push(e.v) } return v.length ? { avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length } : null }
      const w = st(7), mo = st(30)
      if (!w && !mo) return reply(`Belum ada data. Catat dulu: ${prefix}mood 4`)
      let spark = ''; for (let i = 6; i >= 0; i--) { const e = logs[K.addDays(K.dayKey(), -i)]; spark += e ? e.v : '·' }
      let t = `✦ ${B('STATISTIK MOOD')}\n\n${B('7 hari')} : ${spark.split('').join(' ')}\n`
      if (w) t += `\n*Minggu ini* — rata-rata ${w.avg.toFixed(1)}/5\n${K.bar(w.avg / 5)} (${w.n} hari tercatat)`
      if (mo) t += `\n\n*30 hari* — rata-rata ${mo.avg.toFixed(1)}/5\n${K.bar(mo.avg / 5)} (${mo.n} hari tercatat)`
      return reply(t)
    }
    const td = logs[K.dayKey()]
    return reply(`✦ ${B('JURNAL MOOD')}\n${td ? `Hari ini: ${stars(td.v)} ${LABEL[td.v]}\n` : ''}\nSkala: 1 buruk … 5 luar biasa\n┣ ${prefix}mood <1-5> [catatan]\n┣ ${prefix}mood riwayat\n┗ ${prefix}mood statistik`)
  },
}
