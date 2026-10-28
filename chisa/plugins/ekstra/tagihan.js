/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tagihan — pengingat tagihan bulanan (listrik, wifi, cicilan, langganan). Tersimpan per pengguna.
//   .tagihan                          daftar + status bulan ini
//   .tagihan tambah <nama> <nominal> <tgl 1-31>
//   .tagihan lunas <no>  •  .tagihan batal <no>  •  .tagihan hapus <no>
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const bulanIni = () => K.dayKey().slice(0, 7)
const hariIni = () => +K.dayKey().slice(8)
const dim = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate() }
const dueDay = (t, ym = bulanIni()) => Math.min(t.d, dim(ym))
function status(t) {
  if ((t.paid || []).includes(bulanIni())) return ['lunas', 'LUNAS']
  const sisa = dueDay(t) - hariIni()
  if (sisa < 0) return ['telat', `TELAT ${-sisa} hari`]
  if (sisa === 0) return ['hari', 'JATUH TEMPO HARI INI']
  return [sisa <= 3 ? 'dekat' : 'aman', `${sisa} hari lagi`]
}
module.exports = {
  name: 'tagihan', alias: ['bill', 'bayar', 'tagihanku'], category: 'ekstra', noLimit: true, cmds: ['tagihan'],
  desc: 'Pengingat tagihan bulanan: .tagihan tambah <nama> <nominal> <tgl> • lunas <no> • hapus <no>',
  run: async ({ m, args, prefix, reply }) => {
    const list = K.get(m.sender, 'tagihan', []), sub = (args[0] || 'list').toLowerCase(), p = prefix + 'tagihan', save = () => K.set(m.sender, 'tagihan', list)
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const rest = args.slice(1), tgl = parseInt(rest.pop(), 10), nom = K.parseNominal(rest.pop()), nama = rest.join(' ').trim().slice(0, 40)
      if (!nama || !Number.isFinite(nom) || nom <= 0 || !(tgl >= 1 && tgl <= 31)) return reply(`Format: ${p} tambah <nama> <nominal> <tanggal jatuh tempo 1-31>\nContoh: ${p} tambah Wifi Indihome 350rb 10\n${p} tambah Cicilan motor 1,2jt 25`)
      if (list.length >= 30) return reply('✕ Maksimal 30 tagihan.')
      list.push({ n: nama, a: nom, d: tgl, paid: [] }); save()
      return reply(`✦ Tersimpan: *${nama}* ${K.rupiah(nom)} tiap tanggal *${tgl}*${tgl > 28 ? '\n_Bulan yang lebih pendek memakai tanggal terakhir bulan itu._' : ''}`)
    }
    if (['lunas', 'bayar', 'batal', 'hapus', 'del'].includes(sub)) {
      const no = parseInt(args[1], 10); if (!(no >= 1 && no <= list.length)) return reply('✕ Nomor tidak valid. Lihat daftar: ' + p)
      const t = list[no - 1]
      if (['hapus', 'del'].includes(sub)) { list.splice(no - 1, 1); save(); return reply(`Dihapus: *${t.n}*`) }
      t.paid = (t.paid || []).filter(x => x !== bulanIni()); if (sub !== 'batal') t.paid.push(bulanIni()); t.paid = t.paid.slice(-24); save()
      return reply(sub === 'batal' ? `Status lunas *${t.n}* bulan ini dibatalkan.` : `✦ *${t.n}* ditandai lunas untuk bulan ini.`)
    }
    if (!list.length) return reply(`${B('TAGIHAN')}\nBelum ada tagihan.\nTambah: ${p} tambah <nama> <nominal> <tanggal>`)
    const order = { telat: 0, hari: 1, dekat: 2, aman: 3, lunas: 4 }
    const rows = list.map((t, i) => ({ t, i, s: status(t) })).sort((a, b) => order[a.s[0]] - order[b.s[0]] || dueDay(a.t) - dueDay(b.t))
    const total = list.reduce((s, t) => s + t.a, 0), sisa = rows.filter(r => r.s[0] !== 'lunas').reduce((s, r) => s + r.t.a, 0)
    const mark = { telat: '✕', hari: '◆', dekat: '◇', aman: '·', lunas: '✦' }
    return reply(`${B('TAGIHAN BULAN INI')}\n━━━━━━━━━━━━━━━━━━━━\n` + rows.map(r => `${mark[r.s[0]]} ${r.i + 1}. ${r.t.n} — ${K.rupiah(r.t.a)}\n      tgl ${dueDay(r.t)} • ${r.s[1]}`).join('\n') + `\n━━━━━━━━━━━━━━━━━━━━\nTotal ${K.rupiah(total)}\nBelum dibayar *${K.rupiah(sisa)}*\n\n_${p} lunas <no> • tambah • hapus <no>_`)
  },
}
