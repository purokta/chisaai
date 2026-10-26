/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .utang — catatan utang & piutang pribadi dengan cicilan pembayaran
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'utang', alias: ['hutang', 'piutang', 'kasbon'], category: 'ekstra', noLimit: true, cmds: ['utang'],
  desc: 'Catat utang & piutang: .utang piutang <nama> <nominal> • hutang • bayar <no> • hapus',
  run: async ({ m, args, prefix, reply }) => {
    const list = K.get(m.sender, 'utang', []), sub = (args[0] || 'list').toLowerCase(), p = prefix + 'utang', save = () => K.set(m.sender, 'utang', list)
    const sisa = (x) => x.amt - x.paid
    if (['piutang', 'pinjamkan', 'hutang', 'utang', 'pinjam'].includes(sub)) {
      const owedToMe = ['piutang', 'pinjamkan'].includes(sub), who = (args[1] || '').replace(/_/g, ' ').slice(0, 30), n = K.parseNominal(args[2])
      if (!who || !(n > 0)) return reply(`✕ Format: ${p} ${sub} <nama> <nominal> [keterangan]\nContoh: ${p} piutang Budi 150rb makan siang\n_Nama dua kata: pakai garis bawah (Budi_Santoso)_`)
      if (list.length >= 60) return reply('✕ Maksimal 60 catatan. Hapus yang sudah lunas dengan ' + p + ' bersih')
      list.push({ dir: owedToMe ? 'p' : 'h', who, amt: n, paid: 0, note: args.slice(3).join(' ').slice(0, 60), d: K.dayKey() }); save()
      return reply(`✦ Dicatat: ${owedToMe ? `*${who}* berutang padamu` : `kamu berutang pada *${who}*`}\n┗ ${K.rupiah(n)}${args[3] ? ' • ' + args.slice(3).join(' ') : ''}`)
    }
    if (['bayar', 'cicil', 'lunas'].includes(sub)) {
      const no = parseInt(args[1], 10); if (!no || no < 1 || no > list.length) return reply(`✕ Nomor tidak valid. Lihat ${p}`)
      const x = list[no - 1], n = args[2] ? K.parseNominal(args[2]) : sisa(x)
      if (!(n > 0)) return reply('✕ Nominal tidak valid.')
      x.paid = Math.min(x.amt, x.paid + n); save()
      return reply(sisa(x) === 0 ? `✦ *LUNAS* — ${x.who} (${K.rupiah(x.amt)})` : `✦ Pembayaran ${K.rupiah(n)} dicatat untuk *${x.who}*\n┗ Sisa ${K.rupiah(sisa(x))} dari ${K.rupiah(x.amt)}\n${K.bar(x.paid / x.amt)}`)
    }
    if (['hapus', 'del'].includes(sub)) { const no = parseInt(args[1], 10); if (!no || no < 1 || no > list.length) return reply('✕ Nomor tidak valid.'); const [r] = list.splice(no - 1, 1); save(); return reply(`Dihapus: ${r.who} (${K.rupiah(r.amt)})`) }
    if (['bersih', 'clear'].includes(sub)) { const n = list.filter(x => sisa(x) === 0).length; K.set(m.sender, 'utang', list.filter(x => sisa(x) > 0)); return reply(`${n} catatan lunas dibersihkan.`) }
    if (!list.length) return reply(`✦ ${B('UTANG & PIUTANG')}\n\nBelum ada catatan.\n┣ ${p} piutang <nama> <nominal> [ket]  (orang berutang padamu)\n┗ ${p} hutang <nama> <nominal> [ket]  (kamu berutang)`)
    const fmt = (x, i) => `${sisa(x) === 0 ? '◆' : '◇'} *${i + 1}. ${x.who}* — ${K.rupiah(sisa(x))}${x.paid ? ` (dari ${K.rupiah(x.amt)})` : ''}${x.note ? `\n   _${x.note} • ${K.fmtTanggal(x.d)}_` : `\n   _${K.fmtTanggal(x.d)}_`}`
    const P = list.map((x, i) => [x, i]).filter(([x]) => x.dir === 'p'), H = list.map((x, i) => [x, i]).filter(([x]) => x.dir === 'h')
    const tP = P.reduce((s, [x]) => s + sisa(x), 0), tH = H.reduce((s, [x]) => s + sisa(x), 0)
    let t = `✦ ${B('UTANG & PIUTANG')}\n`
    if (P.length) t += `\n${B('Piutang')} (orang berutang padamu): ${K.rupiah(tP)}\n` + P.map(([x, i]) => fmt(x, i)).join('\n') + '\n'
    if (H.length) t += `\n${B('Hutang')} (kamu berutang): ${K.rupiah(tH)}\n` + H.map(([x, i]) => fmt(x, i)).join('\n') + '\n'
    return reply(t + `\n_${p} bayar <no> [nominal] • hapus <no> • bersih_`)
  },
}
