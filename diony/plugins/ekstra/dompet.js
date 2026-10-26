/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .dompet — buku kas pribadi: pemasukan, pengeluaran per kategori, anggaran bulanan, laporan
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const month = (k = K.dayKey()) => k.slice(0, 7)
const sum = (a) => a.reduce((s, x) => s + x.n, 0)
const load = (j) => K.get(j, 'dompet', { tx: [], budget: 0 })

module.exports = {
  name: 'dompet', alias: ['kas', 'bukukas', 'catatkeuangan'], category: 'ekstra', noLimit: true, cmds: ['dompet'],
  desc: 'Buku kas pribadi: .dompet masuk/keluar/saldo/laporan/riwayat/batas/hapus',
  run: async ({ m, args, prefix, reply }) => {
    const db = load(m.sender), sub = (args[0] || 'saldo').toLowerCase(), now = month(), p = prefix + 'dompet'
    const save = () => K.set(m.sender, 'dompet', db)
    if (['masuk', 'in', 'pemasukan', 'keluar', 'out', 'beli', 'bayar'].includes(sub)) {
      const isIn = ['masuk', 'in', 'pemasukan'].includes(sub), n = K.parseNominal(args[1])
      if (!(n > 0)) return reply(`✕ Nominal tidak valid.\nContoh: ${p} ${isIn ? 'masuk 5jt gaji' : 'keluar 25rb makan nasi padang'}`)
      const rest = args.slice(2); let cat = isIn ? 'pemasukan' : 'lainnya', note = rest.join(' ')
      if (!isIn && rest.length) { cat = rest[0].toLowerCase().slice(0, 15); note = rest.slice(1).join(' ') }
      db.tx.push({ t: isIn ? 'in' : 'out', n, cat, note: note.slice(0, 60), d: K.dayKey() }); db.tx = db.tx.slice(-1000); save()
      const mo = db.tx.filter(x => month(x.d) === now), out = sum(mo.filter(x => x.t === 'out'))
      let t = `✦ ${B(isIn ? 'PEMASUKAN' : 'PENGELUARAN')} dicatat\n┣ ${K.rupiah(n)}${isIn ? '' : ` • ${cat}`}${note ? ` • ${note}` : ''}\n┗ ${B('Saldo')} : ${K.rupiah(sum(db.tx.filter(x => x.t === 'in')) - sum(db.tx.filter(x => x.t === 'out')))}`
      if (!isIn && db.budget > 0) { const f = out / db.budget; t += `\n\n${B('Anggaran bulan ini')}\n${K.bar(f)} ${Math.round(f * 100)}% (${K.rupiah(out)} / ${K.rupiah(db.budget)})${f >= 1 ? '\n⚠ Anggaran bulan ini terlampaui!' : f >= 0.8 ? '\n⚠ Sudah lebih dari 80% anggaran.' : ''}` }
      return reply(t)
    }
    if (['batas', 'anggaran', 'budget'].includes(sub)) {
      const n = K.parseNominal(args[1]); if (args[1] === '0' || args[1] === 'off') { db.budget = 0; save(); return reply('Anggaran bulanan dimatikan.') }
      if (!(n > 0)) return reply(`Format: ${p} batas <nominal>\nContoh: ${p} batas 3jt   (0 untuk mematikan)`)
      db.budget = n; save(); return reply(`✦ Anggaran bulanan: *${K.rupiah(n)}*`)
    }
    if (['riwayat', 'history', 'log'].includes(sub)) {
      const n = Math.min(30, Math.max(1, parseInt(args[1], 10) || 10)), off = db.tx.length - n
      if (!db.tx.length) return reply(`Belum ada catatan. Mulai: ${p} masuk 5jt gaji`)
      return reply(`✦ ${B('RIWAYAT')} (${Math.min(n, db.tx.length)} terakhir)\n\n` + db.tx.slice(-n).map((x, i) => `${Math.max(0, off) + i + 1}. ${x.t === 'in' ? '＋' : '－'} ${K.rupiah(x.n)} • ${x.cat}${x.note ? ' • ' + x.note : ''}\n    _${K.fmtTanggal(x.d)}_`).join('\n') + `\n\n_Hapus: ${p} hapus <no>_`)
    }
    if (['hapus', 'del', 'delete'].includes(sub)) {
      const no = parseInt(args[1], 10); if (!no || no < 1 || no > db.tx.length) return reply(`✕ Nomor tidak valid. Lihat ${p} riwayat`)
      const [r] = db.tx.splice(no - 1, 1); save(); return reply(`Dihapus: ${r.t === 'in' ? 'masuk' : 'keluar'} ${K.rupiah(r.n)} (${r.cat})`)
    }
    if (sub === 'reset') { if (args[1] !== 'ya') return reply(`Ini menghapus SEMUA catatan.\nKetik ${p} reset ya untuk melanjutkan.`); K.set(m.sender, 'dompet', { tx: [], budget: db.budget }); return reply('Buku kas dikosongkan.') }
    if (['laporan', 'report', 'bulan'].includes(sub)) {
      let key = now; const a = (args[1] || '').toLowerCase()
      if (a === 'lalu') { const d = new Date(now + '-15T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); key = d.toISOString().slice(0, 7) } else if (/^\d{4}-\d{2}$/.test(a)) key = a
      const mo = db.tx.filter(x => month(x.d) === key), inn = sum(mo.filter(x => x.t === 'in')), out = mo.filter(x => x.t === 'out'), tot = sum(out)
      if (!mo.length) return reply(`Tidak ada catatan untuk ${key}.`)
      const by = {}; for (const x of out) by[x.cat] = (by[x.cat] || 0) + x.n
      const rows = Object.entries(by).sort((a, b) => b[1] - a[1])
      let t = `✦ ${B('LAPORAN ' + key)}\n┣ ${B('Masuk')}  : ${K.rupiah(inn)}\n┣ ${B('Keluar')} : ${K.rupiah(tot)}\n┗ ${B('Selisih')}: ${inn - tot < 0 ? '-' : ''}${K.rupiah(Math.abs(inn - tot))}\n\n${B('Pengeluaran per kategori')}\n`
      t += rows.map(([c, v]) => `${K.bar(v / tot, 8)} ${c}\n   ${K.rupiah(v)} (${Math.round(v / tot * 100)}%)`).join('\n')
      if (tot && inn) t += `\n\n_Rasio tabungan: ${Math.round((inn - tot) / inn * 100)}% dari pemasukan_`
      return reply(t)
    }
    const all = db.tx, mo = all.filter(x => month(x.d) === now), tin = sum(all.filter(x => x.t === 'in')), tout = sum(all.filter(x => x.t === 'out'))
    const today = all.filter(x => x.d === K.dayKey() && x.t === 'out')
    let t = `✦ ${B('DOMPET')}\n┣ ${B('Saldo')}       : ${tin - tout < 0 ? '-' : ''}${K.rupiah(Math.abs(tin - tout))}\n┣ ${B('Masuk bulan ini')}  : ${K.rupiah(sum(mo.filter(x => x.t === 'in')))}\n┣ ${B('Keluar bulan ini')} : ${K.rupiah(sum(mo.filter(x => x.t === 'out')))}\n┗ ${B('Keluar hari ini')}  : ${K.rupiah(sum(today))}`
    if (db.budget > 0) { const f = sum(mo.filter(x => x.t === 'out')) / db.budget; t += `\n\n${B('Anggaran')} ${K.bar(f)} ${Math.round(f * 100)}%` }
    return reply(t + `\n\n_${p} masuk <n> [ket] • keluar <n> <kategori> [ket]_\n_${p} laporan • riwayat • batas <n> • hapus <no>_`)
  },
}
