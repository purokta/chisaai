/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .buku — pelacak bacaan: judul, halaman, progres, selesai, rating.
//   .buku tambah <halaman> <judul>   .buku baca <no> <halaman sekarang>   .buku selesai <no> [rating 1-5]
//   .buku hapus <no>   .buku statistik   (kosong = daftar)
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'buku', alias: ['baca', 'bacaan', 'readinglist', 'perpus'], category: 'ekstra', noLimit: true, cmds: ['buku'],
  desc: 'Pelacak bacaan: .buku tambah <halaman> <judul> • baca <no> <hal> • selesai <no> [1-5]',
  run: async ({ m, args, prefix, reply }) => {
    const list = K.get(m.sender, 'buku', []), sub = (args[0] || 'list').toLowerCase(), p = prefix + 'buku', save = () => K.set(m.sender, 'buku', list)
    const pick = () => { const no = parseInt(args[1], 10); return no >= 1 && no <= list.length ? list[no - 1] : null }
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const hal = parseInt(args[1], 10), judul = args.slice(2).join(' ').trim().slice(0, 80)
      if (!(hal >= 1 && hal <= 10000) || !judul) return reply(`Format: ${p} tambah <jumlah halaman> <judul>\nContoh: ${p} tambah 320 Atomic Habits`)
      if (list.length >= 50) return reply('✕ Maksimal 50 buku.')
      list.push({ t: judul, n: hal, r: 0, at: K.dayKey(), done: null, star: 0 }); save(); return reply(`✦ Ditambahkan: *${judul}* (${hal} halaman)`)
    }
    if (['baca', 'update', 'hal'].includes(sub)) {
      const b = pick(), hal = parseInt(args[2], 10)
      if (!b || !(hal >= 0)) return reply(`Format: ${p} baca <no> <halaman sekarang>\nContoh: ${p} baca 1 85`)
      if (b.done) return reply('Buku ini sudah selesai.')
      const before = b.r; b.r = Math.min(hal, b.n); const log = K.get(m.sender, 'bukulog', {}); log[K.dayKey()] = (log[K.dayKey()] || 0) + Math.max(0, b.r - before); K.set(m.sender, 'bukulog', log)
      if (b.r >= b.n) { b.done = K.dayKey(); save(); return reply(`✦ Tamat! *${b.t}* selesai dibaca.\nBeri rating: ${p} selesai ${args[1]} <1-5>`) }
      save(); return reply(`*${b.t}*\n${K.bar(b.r / b.n, 14)} ${Math.round(b.r / b.n * 100)}%  (${b.r}/${b.n})\nSisa ${b.n - b.r} halaman.`)
    }
    if (['selesai', 'tamat', 'done'].includes(sub)) {
      const b = pick(); if (!b) return reply('✕ Nomor tidak valid. Lihat daftar: ' + p)
      const st = parseInt(args[2], 10); b.r = b.n; b.done = b.done || K.dayKey(); if (st >= 1 && st <= 5) b.star = st; save()
      return reply(`✦ *${b.t}* selesai${b.star ? ' — ' + '★'.repeat(b.star) + '☆'.repeat(5 - b.star) : ''}`)
    }
    if (['hapus', 'del'].includes(sub)) { const b = pick(); if (!b) return reply('✕ Nomor tidak valid.'); list.splice(list.indexOf(b), 1); save(); return reply(`Dihapus: *${b.t}*`) }
    if (['statistik', 'stat', 'rekap'].includes(sub)) {
      const done = list.filter(b => b.done), pages = done.reduce((s, b) => s + b.n, 0) + list.filter(b => !b.done).reduce((s, b) => s + b.r, 0)
      const log = K.get(m.sender, 'bukulog', {}), days = Object.keys(log).filter(k => log[k] > 0).sort()
      let streak = 0, d = K.dayKey(); if (!log[d]) d = K.addDays(d, -1); while (log[d] > 0) { streak++; d = K.addDays(d, -1) }
      const rated = done.filter(b => b.star)
      return reply(`${B('STATISTIK BACAAN')}\n━━━━━━━━━━━━━━━━━━━━\nBuku selesai : *${done.length}* dari ${list.length}\nTotal halaman terbaca : *${pages.toLocaleString('id-ID')}*\nStreak membaca : *${streak}* hari\nHari aktif : ${days.length}${rated.length ? `\nRata-rata rating : ${(rated.reduce((s, b) => s + b.star, 0) / rated.length).toFixed(1)} ★` : ''}`)
    }
    if (!list.length) return reply(`${B('BUKU')}\nBelum ada buku.\nTambah: ${p} tambah <halaman> <judul>`)
    const cur = list.map((b, i) => [b, i]).filter(([b]) => !b.done), fin = list.map((b, i) => [b, i]).filter(([b]) => b.done)
    let t = `${B('RAK BUKU')}\n━━━━━━━━━━━━━━━━━━━━\n`
    if (cur.length) t += B('Sedang dibaca') + '\n' + cur.map(([b, i]) => `${i + 1}. ${b.t}\n    ${K.bar(b.r / b.n, 10)} ${Math.round(b.r / b.n * 100)}% (${b.r}/${b.n})`).join('\n') + '\n'
    if (fin.length) t += '\n' + B('Selesai') + '\n' + fin.map(([b, i]) => `${i + 1}. ${b.t}${b.star ? ' ' + '★'.repeat(b.star) : ''}`).join('\n') + '\n'
    return reply(t + `\n_${p} tambah • baca • selesai • statistik_`)
  },
}
