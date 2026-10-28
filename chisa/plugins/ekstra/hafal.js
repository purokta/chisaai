/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .hafal — kartu hafalan (flashcard) dengan pengulangan berjarak sistem Leitner
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const GAP = [0, 1, 3, 7, 14, 30]
module.exports = {
  name: 'hafal', alias: ['flashcard', 'kartuhafal', 'fc'], category: 'ekstra', noLimit: true, cmds: ['hafal'],
  desc: 'Kartu hafalan: .hafal tambah <depan> | <belakang> • kuis • lihat • bisa • lupa • daftar',
  run: async ({ m, args, text, prefix, reply }) => {
    const db = K.get(m.sender, 'hafal', { cards: [], cur: null, shown: false }), sub = (args[0] || 'kuis').toLowerCase(), p = prefix + 'hafal', today = K.dayKey()
    const save = () => K.set(m.sender, 'hafal', db), card = () => (db.cur !== null ? db.cards[db.cur] : null)
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const [f, ...b] = text.slice(args[0].length).split('|'), front = (f || '').trim().slice(0, 150), back = b.join('|').trim().slice(0, 300)
      if (!front || !back) return reply(`✕ Format: ${p} tambah <depan> | <belakang>\nContoh: ${p} tambah ibu kota Jepang | Tokyo`)
      if (db.cards.length >= 200) return reply('✕ Maksimal 200 kartu.'); db.cards.push({ f: front, b: back, box: 0, due: today }); save()
      return reply(`✦ Kartu #${db.cards.length} ditambahkan.\n_Mulai berlatih: ${p} kuis_`)
    }
    if (['daftar', 'list'].includes(sub)) return reply(db.cards.length ? `✦ ${B('KARTU HAFALAN')} (${db.cards.length})\n\n` + db.cards.slice(0, 40).map((c, i) => `${i + 1}. ${c.f}  ${'■'.repeat(c.box)}${'□'.repeat(5 - c.box)}`).join('\n') + `\n\n_${p} hapus <no>_` : `Belum ada kartu. ${p} tambah <depan> | <belakang>`)
    if (['hapus', 'del'].includes(sub)) { const no = parseInt(args[1], 10); if (!no || no < 1 || no > db.cards.length) return reply('✕ Nomor tidak valid.'); const [r] = db.cards.splice(no - 1, 1); db.cur = null; save(); return reply(`Kartu "${r.f}" dihapus.`) }
    if (['statistik', 'stat'].includes(sub)) {
      const n = db.cards.length; if (!n) return reply('Belum ada kartu.')
      const by = [0, 1, 2, 3, 4, 5].map(b => db.cards.filter(c => c.box === b).length), due = db.cards.filter(c => c.due <= today).length
      return reply(`✦ ${B('STATISTIK HAFALAN')}\n┣ Total kartu : ${n}\n┣ Jatuh tempo : ${due}\n┗ Hafal (kotak 5): ${by[5]}\n\n` + by.map((c, b) => `Kotak ${b} ${K.bar(c / n, 10)} ${c}`).join('\n'))
    }
    if (sub === 'lihat') { const c = card(); if (!c) return reply(`Belum ada kartu aktif. Ketik ${p} kuis`); db.shown = true; save(); return reply(`✦ ${B('JAWABAN')}\n${c.f}\n→ *${c.b}*\n\nIngat? *${p} bisa*  atau  *${p} lupa*`) }
    if (sub === 'bisa' || sub === 'lupa') {
      const c = card(); if (!c) return reply(`Belum ada kartu aktif. Ketik ${p} kuis`)
      c.box = sub === 'bisa' ? Math.min(5, c.box + 1) : 1; c.due = K.addDays(today, GAP[c.box]); db.cur = null; db.shown = false; save()
      return reply(`${sub === 'bisa' ? '✦ Bagus!' : '↩ Tidak apa-apa, diulang lagi.'} Kotak ${c.box}${GAP[c.box] ? ` • muncul lagi ${GAP[c.box]} hari lagi` : ' • muncul lagi hari ini'}\n_Lanjut: ${p} kuis_`)
    }
    const due = db.cards.map((c, i) => [c, i]).filter(([c]) => c.due <= today)
    if (!db.cards.length) return reply(`✦ ${B('KARTU HAFALAN')}\n\nBelum ada kartu. Tambah:\n${p} tambah <depan> | <belakang>`)
    if (!due.length) return reply(`✦ Semua kartu sudah dikuasai untuk hari ini.\n_Kartu berikutnya jatuh tempo: ${K.fmtTanggal(db.cards.map(c => c.due).sort()[0])}_`)
    const [c, i] = E.rnd(due.filter(([x]) => x.box === Math.min(...due.map(([y]) => y.box))))
    db.cur = i; db.shown = false; save()
    return reply(`✦ ${B('KARTU')} (${due.length} jatuh tempo)\n\n*${c.f}*\n\nJawab dalam hati, lalu ketik *${p} lihat*`)
  },
}
