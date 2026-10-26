/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .ibadah — pelacak ibadah harian: salat 5 waktu + sunnah, streak, statistik 7 hari
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const WAJIB = ['subuh', 'zuhur', 'asar', 'magrib', 'isya'], SUNNAH = ['tahajud', 'dhuha', 'tilawah', 'puasa', 'sedekah']
const SYN = { fajar: 'subuh', dzuhur: 'zuhur', duhur: 'zuhur', ashar: 'asar', maghrib: 'magrib', isha: 'isya', quran: 'tilawah', ngaji: 'tilawah', tadarus: 'tilawah', shaum: 'puasa', infaq: 'sedekah' }
const cap = (s) => s[0].toUpperCase() + s.slice(1)
const full = (a) => WAJIB.every(k => a.includes(k))
const streak = (db) => { let c = K.dayKey(), n = 0; if (!full(db[c] || [])) c = K.addDays(c, -1); while (full(db[c] || [])) { n++; c = K.addDays(c, -1) } return n }
module.exports = {
  name: 'ibadah', alias: ['amalan', 'salatku', 'trackeribadah'], category: 'ekstra', noLimit: true, cmds: ['ibadah'],
  desc: 'Pelacak ibadah harian: salat 5 waktu, tahajud, dhuha, tilawah, puasa, sedekah + streak',
  run: async ({ m, args, prefix, reply }) => {
    const db = K.get(m.sender, 'ibadah', {}), today = K.dayKey(), cur = db[today] || [], p = prefix + 'ibadah'
    const save = () => { const keys = Object.keys(db).sort().slice(-200); K.set(m.sender, 'ibadah', Object.fromEntries(keys.map(k => [k, db[k]]))) }
    const sub = (args[0] || '').toLowerCase()
    if (['statistik', 'stat', 'stats', 'minggu'].includes(sub)) {
      let t = `✦ ${B('STATISTIK 7 HARI')}\n\n`, tot = 0
      for (let i = 6; i >= 0; i--) { const k = K.addDays(today, -i), a = db[k] || [], w = WAJIB.filter(x => a.includes(x)).length; tot += w; t += `${K.HARI[new Date(k + 'T00:00:00Z').getUTCDay()].slice(0, 3)} ${WAJIB.map(x => a.includes(x) ? '■' : '□').join('')} ${w}/5${a.filter(x => SUNNAH.includes(x)).length ? ` +${a.filter(x => SUNNAH.includes(x)).length}` : ''}\n` }
      return reply(t + `\n${B('Salat wajib')} ${K.bar(tot / 35)} ${Math.round(tot / 35 * 100)}%\n${B('Streak 5 waktu penuh')} : ${streak(db)} hari`)
    }
    let changed = false, note = ''
    if (sub === 'semua') { db[today] = [...new Set([...cur, ...WAJIB])]; changed = true; note = '✦ Kelima salat wajib hari ini dicentang.\n\n' }
    else if (sub === 'reset') { delete db[today]; changed = true; note = 'Centang hari ini direset.\n\n' }
    else if (sub) {
      const k = SYN[sub] || sub
      if (![...WAJIB, ...SUNNAH].includes(k)) return reply(`✕ "${sub}" tidak dikenal.\nPilihan: ${[...WAJIB, ...SUNNAH].join(', ')}`)
      db[today] = cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]; changed = true
      note = cur.includes(k) ? `↩ ${cap(k)} dibatalkan.\n\n` : `✦ ${cap(k)} dicatat. Semoga diterima.\n\n`
    }
    if (changed) save()
    const a = db[today] || [], w = WAJIB.filter(x => a.includes(x)).length
    return reply(`${note}✦ ${B('IBADAH HARI INI')}\n${K.fmtTanggal(today)}\n\n${B('Wajib')} ${K.bar(w / 5)} ${w}/5\n` + WAJIB.map(x => `${a.includes(x) ? '◆' : '◇'} ${cap(x)}`).join('\n') + `\n\n${B('Sunnah')}\n` + SUNNAH.map(x => `${a.includes(x) ? '◆' : '◇'} ${cap(x)}`).join('\n') + `\n\n${B('Streak')} : ${streak(db)} hari penuh\n_${p} <nama> untuk centang • semua • statistik • reset_`)
  },
}
