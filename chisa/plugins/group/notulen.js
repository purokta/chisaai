/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .notulen  notulen rapat grup: mulai -> catat / putus / tugas -> selesai (ringkasan + diarsipkan)
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const num = (j) => String(j).split('@')[0].split(':')[0]
function render(n, final) {
  const L = [`✦ ${B(final ? 'NOTULEN RAPAT' : 'RAPAT BERJALAN')}`, `*${n.judul}*`, `${n.tgl}${n.selesai ? ' • ' + n.selesai : ''}`, '']
  L.push(B('Catatan'), ...(n.catatan.length ? n.catatan.map((c, i) => `${i + 1}. ${c.t}`) : ['-']), '')
  L.push(B('Keputusan'), ...(n.putusan.length ? n.putusan.map((c, i) => `${i + 1}. ${c}`) : ['-']), '')
  L.push(B('Tugas'), ...(n.tugas.length ? n.tugas.map((t, i) => `${i + 1}. @${num(t.who)}: ${t.t}${t.tenggat ? ' (tenggat ' + t.tenggat + ')' : ''}`) : ['-']))
  return L.join('\n')
}
module.exports = {
  name: 'notulen', alias: ['rapat', 'notulensi', 'meeting'], category: 'group', noLimit: true, group: true, cmds: ['notulen'],
  desc: 'Notulen rapat grup: catat poin, keputusan, dan tugas per orang, lalu ringkasan otomatis saat selesai',
  render,
  run: async function (c) {
    const { m, sock, args, prefix, reply } = c, p = prefix + 'notulen', sub = (args[0] || '').toLowerCase(), j = K.get(m.chat, 'notulen', { aktif: null, arsip: [] }), save = () => K.set(m.chat, 'notulen', j)
    const send = (n, final) => sock.sendMessage(m.chat, { text: render(n, final), mentions: n.tugas.map(t => t.who) }, { quoted: m })
    const rest = args.slice(1).join(' ').trim()
    if (['mulai', 'start', 'buka'].includes(sub)) {
      if (j.aktif) return reply(`Rapat *${j.aktif.judul}* masih berjalan. Akhiri dulu: ${p} selesai`)
      if (!rest) return reply(`Format: ${p} mulai <judul rapat>`)
      j.aktif = { judul: rest.slice(0, 80), by: m.sender, tgl: K.fmtTanggal(K.dayKey()), mulaiMs: Date.now(), catatan: [], putusan: [], tugas: [] }; save()
      return reply(`Rapat *${j.aktif.judul}* dimulai.\n${p} catat <poin> • ${p} putus <keputusan> • ${p} tugas @orang <tugas> [tenggat]\nSelesai: ${p} selesai`)
    }
    if (['arsip', 'riwayat'].includes(sub)) {
      if (!j.arsip.length) return reply('Belum ada notulen yang diarsipkan.')
      const i = parseInt(args[1], 10); if (i >= 1 && i <= j.arsip.length) return send(j.arsip[j.arsip.length - i], true)
      return reply(`✦ ${B('ARSIP NOTULEN')}\n` + j.arsip.slice(-10).reverse().map((n, k) => `${k + 1}. ${n.judul} (${n.tgl})`).join('\n') + `\n\n_${p} arsip <no> untuk membuka_`)
    }
    const n = j.aktif
    if (!n) return reply(`✦ ${B('NOTULEN')}\nTidak ada rapat berjalan.\n${p} mulai <judul>   ${p} arsip`)
    if (['catat', 'poin', 'note'].includes(sub)) { if (!rest) return reply(`Format: ${p} catat <poin>`); if (n.catatan.length >= 80) return reply('Catatan sudah penuh (80).'); n.catatan.push({ t: rest.slice(0, 300), by: m.sender }); save(); return reply(`Poin #${n.catatan.length} dicatat.`) }
    if (['putus', 'putusan', 'keputusan'].includes(sub)) { if (!rest) return reply(`Format: ${p} putus <keputusan>`); if (n.putusan.length >= 40) return reply('Daftar keputusan penuh (40).'); n.putusan.push(rest.slice(0, 300)); save(); return reply(`Keputusan #${n.putusan.length} dicatat.`) }
    if (['tugas', 'task', 'todo'].includes(sub)) {
      const who = K.mentions(m)[0]; if (!who) return reply(`Format: ${p} tugas @orang <tugas> [tenggat]\nContoh: ${p} tugas @Ani siapkan proposal 2026-11-01`)
      let words = rest.split(/\s+/).filter(w => !/^@\d+$/.test(w)), tenggat = ''
      const d = K.parseTanggal(words[words.length - 1]); if (d) { tenggat = K.fmtTanggal(d); words.pop() }
      const t = words.join(' ').trim(); if (!t) return reply('Isi tugasnya belum ada.'); if (n.tugas.length >= 40) return reply('Daftar tugas penuh (40).')
      n.tugas.push({ who, t: t.slice(0, 200), tenggat }); save(); return sock.sendMessage(m.chat, { text: `Tugas #${n.tugas.length} untuk @${num(who)} dicatat.`, mentions: [who] }, { quoted: m })
    }
    if (['lihat', 'status', 'list'].includes(sub) || !sub) return send(n, false)
    if (['selesai', 'akhiri', 'tutup', 'batal'].includes(sub)) {
      if (!(E.isAdmin(c) || n.by === m.sender)) return reply('Hanya admin atau pembuka rapat yang bisa mengakhirinya.')
      if (sub === 'batal') { j.aktif = null; save(); return reply('Rapat dibatalkan, catatan dibuang.') }
      const mins = Math.max(1, Math.round((Date.now() - n.mulaiMs) / 60000)); n.selesai = `durasi ${mins} menit`
      j.arsip.push(n); if (j.arsip.length > 20) j.arsip.shift(); j.aktif = null; save(); return send(n, true)
    }
    return reply(`Perintah tidak dikenal. Ketik ${p} untuk melihat rapat berjalan.`)
  },
}
