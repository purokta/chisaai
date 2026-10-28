/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .prioritas  matriks Eisenhower: tugas dikelompokkan jadi Kerjakan / Jadwalkan / Delegasikan / Buang (mendesak × penting)
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const Q = { up: ['KERJAKAN SEKARANG', 'mendesak + penting'], p: ['JADWALKAN', 'penting, tidak mendesak'], u: ['DELEGASIKAN / CEPAT SELESAIKAN', 'mendesak, kurang penting'], x: ['BUANG / ABAIKAN', 'tidak mendesak, tidak penting'] }
// u = mendesak, p = penting; "-" / "x" / "0" = tidak keduanya. Urutan huruf bebas (pu = up).
function flag(s) {
  s = String(s || '').toLowerCase(); if (!/^[upx\-0]+$/.test(s)) return null
  const u = s.includes('u'), p = s.includes('p'), none = /[x\-0]/.test(s)
  if (none && (u || p)) return null
  return u && p ? 'up' : p ? 'p' : u ? 'u' : 'x'
}
module.exports = {
  name: 'prioritas', alias: ['eisenhower', 'matriksprioritas', 'prio'], category: 'ekstra', noLimit: true, cmds: ['prioritas'],
  desc: 'Matriks Eisenhower: tentukan tugas mana yang dikerjakan, dijadwalkan, didelegasikan, atau dibuang',
  flag,
  run: async ({ m, args, prefix, reply }) => {
    const sub = (args[0] || 'list').toLowerCase(), list = K.get(m.sender, 'prioritas', []), p = prefix + 'prioritas', save = () => K.set(m.sender, 'prioritas', list)
    const idx = (a) => { const n = parseInt(a, 10); return n >= 1 && n <= list.length ? n - 1 : -1 }
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const q = flag(args[1]), text = args.slice(2).join(' ').trim().slice(0, 80)
      if (!q || !text) return reply(`Format: ${p} tambah <kode> <tugas>\nKode: *up* mendesak+penting • *p* penting saja • *u* mendesak saja • *x* tidak keduanya\nContoh: ${p} tambah up Kirim laporan klien`)
      if (list.length >= 60) return reply('Maksimal 60 tugas. Bersihkan dulu: ' + p + ' bersih')
      list.push({ text, q, done: false }); save(); return reply(`Masuk kuadran *${Q[q][0]}*: ${text}`)
    }
    if (['selesai', 'done', 'centang'].includes(sub)) { const i = idx(args[1]); if (i < 0) return reply('Nomor tidak valid.'); list[i].done = !list[i].done; save(); return reply(list[i].done ? `Selesai: *${list[i].text}*` : `Dibuka lagi: *${list[i].text}*`) }
    if (['ubah', 'pindah', 'set'].includes(sub)) { const i = idx(args[1]), q = flag(args[2]); if (i < 0 || !q) return reply(`Format: ${p} ubah <no> <kode>   (kode: up / p / u / x)`); list[i].q = q; save(); return reply(`*${list[i].text}* dipindah ke ${Q[q][0]}.`) }
    if (['hapus', 'del', 'delete'].includes(sub)) { const i = idx(args[1]); if (i < 0) return reply('Nomor tidak valid.'); const [r] = list.splice(i, 1); save(); return reply(`Dihapus: ${r.text}`) }
    if (['bersih', 'clear'].includes(sub)) { const n = list.length; for (let i = list.length - 1; i >= 0; i--) if (list[i].done) list.splice(i, 1); save(); return reply(`${n - list.length} tugas selesai dibersihkan.`) }
    if (!list.length) return reply(`✦ ${B('MATRIKS PRIORITAS')}\nMasih kosong.\n${p} tambah <up|p|u|x> <tugas>\n\n_up = mendesak + penting • p = penting • u = mendesak • x = tidak keduanya_`)
    let t = `✦ ${B('MATRIKS PRIORITAS')}\n`
    for (const k of ['up', 'p', 'u', 'x']) {
      const rows = list.map((x, i) => ({ x, i })).filter(r => r.x.q === k)
      t += `\n${B(Q[k][0])}  _${Q[k][1]}_\n` + (rows.length ? rows.map(({ x, i }) => `${x.done ? '[x]' : '[ ]'} ${i + 1}. ${x.done ? '~' + x.text + '~' : x.text}`).join('\n') : '-') + '\n'
    }
    const open = list.filter(x => !x.done).length
    return reply(t + `\n${open} tugas terbuka dari ${list.length}.\n_${p} tambah  selesai <no>  ubah <no> <kode>  hapus <no>  bersih_`)
  },
}
