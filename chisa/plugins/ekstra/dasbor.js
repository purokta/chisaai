/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .dasbor — dasbor harian: tugas, habit, mood, ibadah, keuangan, utang, target, hafalan dalam satu kartu teks
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra')
module.exports = {
  name: 'dasbor', alias: ['dashboard', 'harianku', 'pribadi', 'dasborku'], category: 'ekstra', noLimit: true, cmds: ['dasbor'],
  desc: 'Dasbor pribadi: ringkasan tugas, habit, mood, ibadah, keuangan, utang, target, hafalan',
  run: async ({ m, pushname, prefix, reply }) => {
    const j = m.sender, today = K.dayKey(), h = E.hourWIB(), P = prefix
    const sapa = h < 4 ? 'Selamat dini hari' : h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
    const L = [`✦ ${B('HARI INI')}`, `${sapa}, *${pushname}*`, K.fmtTanggal(today), '']
    const todo = K.get(j, 'todo', []).filter(x => !x.d), habits = K.get(j, 'habits', []), mood = K.get(j, 'mood', {})[today], ib = (K.get(j, 'ibadah', {})[today] || [])
    const dp = K.get(j, 'dompet', { tx: [], budget: 0 }), ut = K.get(j, 'utang', []), tg = K.get(j, 'targets', []), hf = K.get(j, 'hafal', { cards: [] })
    const sec = []
    if (todo.length) sec.push(`${B('Tugas')} (${todo.length} terbuka)\n` + todo.sort((a, b) => b.hi - a.hi).slice(0, 4).map(x => `${x.hi ? '◆' : '◇'} ${x.t}`).join('\n') + (todo.length > 4 ? `\n_+${todo.length - 4} lagi_` : ''))
    if (habits.length) { const d = habits.filter(x => x.days.includes(today)).length; sec.push(`${B('Habit')} ${K.bar(d / habits.length)} ${d}/${habits.length}`) }
    sec.push(`${B('Mood')} ${mood ? '★'.repeat(mood.v) + '☆'.repeat(5 - mood.v) : `belum dicatat (${P}mood 1-5)`}`)
    const w = ['subuh', 'zuhur', 'asar', 'magrib', 'isya'].filter(x => ib.includes(x)).length
    if (K.get(j, 'ibadah', null)) sec.push(`${B('Salat wajib')} ${K.bar(w / 5)} ${w}/5`)
    if (dp.tx.length) { const mo = dp.tx.filter(x => x.d.slice(0, 7) === today.slice(0, 7) && x.t === 'out'), out = mo.reduce((s, x) => s + x.n, 0), td = dp.tx.filter(x => x.d === today && x.t === 'out').reduce((s, x) => s + x.n, 0); sec.push(`${B('Keuangan')}\nKeluar hari ini ${K.rupiah(td)} • bulan ini ${K.rupiah(out)}${dp.budget ? `\nAnggaran ${K.bar(out / dp.budget)} ${Math.round(out / dp.budget * 100)}%` : ''}`) }
    const open = ut.filter(x => x.amt > x.paid), tp = open.filter(x => x.dir === 'p').reduce((s, x) => s + x.amt - x.paid, 0), th = open.filter(x => x.dir === 'h').reduce((s, x) => s + x.amt - x.paid, 0)
    if (open.length) sec.push(`${B('Utang/Piutang')}\nPiutang ${K.rupiah(tp)} • Hutang ${K.rupiah(th)}`)
    const act = tg.filter(t => t.saved < t.goal).sort((a, b) => b.saved / b.goal - a.saved / a.goal)[0]
    if (act) sec.push(`${B('Target terdekat')}\n${act.name} ${K.bar(act.saved / act.goal)} ${Math.round(act.saved / act.goal * 100)}%`)
    const due = hf.cards.filter(c => c.due <= today).length; if (due) sec.push(`${B('Hafalan')} ${due} kartu jatuh tempo (${P}hafal kuis)`)
    return reply(L.concat(sec.join('\n\n')).join('\n') + `\n\n_Lainnya: ${P}todo • ${P}habit • ${P}dompet • ${P}ibadah • ${P}target_`)
  },
}
