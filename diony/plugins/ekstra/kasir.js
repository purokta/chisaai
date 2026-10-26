/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .kasir — kasir mini untuk jualan kecil: keranjang, diskon, kembalian, nota, dan laporan harian
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const total = (c) => { const sub = c.items.reduce((s, x) => s + x.harga * x.qty, 0), dsk = c.diskon ? (c.diskon.persen ? Math.round(sub * c.diskon.v / 100) : Math.min(sub, c.diskon.v)) : 0; return { sub, dsk, tot: sub - dsk } }
const nota = (c, bayar) => { const { sub, dsk, tot } = total(c); let t = `✦ ${B('NOTA')}  ${K.fmtTanggal(K.dayKey())}\n${'─'.repeat(22)}\n`
  c.items.forEach((x, i) => { t += `${i + 1}. ${x.name}\n   ${x.qty} × ${K.rupiah(x.harga)} = ${K.rupiah(x.harga * x.qty)}\n` })
  t += `${'─'.repeat(22)}\nSubtotal : ${K.rupiah(sub)}\n`; if (dsk) t += `Diskon ${c.diskon.persen ? c.diskon.v + '%' : ''}: -${K.rupiah(dsk)}\n`
  t += `${B('TOTAL')} : *${K.rupiah(tot)}*\n`; if (bayar !== undefined) t += `Bayar : ${K.rupiah(bayar)}\nKembali : *${K.rupiah(bayar - tot)}*\n`; return t }
module.exports = {
  name: 'kasir', alias: ['pos', 'nota', 'jualan'], category: 'ekstra', noLimit: true, cmds: ['kasir'],
  desc: 'Kasir mini: keranjang belanja, diskon, kembalian, nota, dan laporan penjualan harian',
  run: async ({ m, args, prefix, reply }) => {
    const sub = (args[0] || 'nota').toLowerCase(), p = prefix + 'kasir', c = K.get(m.sender, 'kasir', { items: [], diskon: null }), today = K.dayKey(), save = () => K.set(m.sender, 'kasir', c)
    if (['tambah', 'add', 'jual'].includes(sub)) {
      const rest = args.slice(1); let qty = 1; if (rest.length >= 3 && /^x?\d+$/i.test(rest[rest.length - 1]) && K.parseNominal(rest[rest.length - 2]) > 0) qty = parseInt(rest.pop().replace(/^x/i, ''), 10)
      const harga = K.parseNominal(rest[rest.length - 1]), name = rest.slice(0, -1).join(' ').slice(0, 40)
      if (!name || !(harga > 0) || !(qty >= 1 && qty <= 9999)) return reply(`✕ Format: ${p} tambah <barang> <harga> [jumlah]\nContoh: ${p} tambah Kopi susu 15rb 2`)
      if (c.items.length >= 60) return reply('✕ Maksimal 60 baris per nota.')
      const ex = c.items.find(x => x.name.toLowerCase() === name.toLowerCase() && x.harga === harga); if (ex) ex.qty += qty; else c.items.push({ name, harga, qty }); save()
      return reply(`✦ ${name} × ${qty} ditambahkan.\nTotal sementara: *${K.rupiah(total(c).tot)}*`)
    }
    if (['hapus', 'del'].includes(sub)) { const n = parseInt(args[1], 10); if (!(n >= 1 && n <= c.items.length)) return reply('✕ Nomor baris tidak valid.'); const [r] = c.items.splice(n - 1, 1); save(); return reply(`${r.name} dihapus. Total: *${K.rupiah(total(c).tot)}*`) }
    if (sub === 'diskon') {
      const a = String(args[1] || ''); if (a === '0' || a === 'hapus') { c.diskon = null; save(); return reply('Diskon dihapus.') }
      const pct = a.match(/^(\d+(?:[.,]\d+)?)%$/); if (pct) { const v = parseFloat(pct[1].replace(',', '.')); if (!(v > 0 && v <= 100)) return reply('✕ Persen harus 1–100.'); c.diskon = { persen: true, v }; save(); return reply(`✦ Diskon ${v}% dipasang. Total: *${K.rupiah(total(c).tot)}*`) }
      const n = K.parseNominal(a); if (!(n > 0)) return reply(`✕ Contoh: ${p} diskon 10%  atau  ${p} diskon 5rb`); c.diskon = { persen: false, v: n }; save(); return reply(`✦ Diskon ${K.rupiah(n)} dipasang. Total: *${K.rupiah(total(c).tot)}*`)
    }
    if (['selesai', 'bayar'].includes(sub)) {
      if (!c.items.length) return reply('✕ Keranjang kosong.'); const tot = total(c).tot, bayar = K.parseNominal(args[1])
      if (!(bayar >= tot)) return reply(`✕ Uang bayar kurang. Total ${K.rupiah(tot)}.\nContoh: ${p} selesai 50rb`)
      const out = nota(c, bayar), lap = K.get(m.sender, 'kasirlap', {}); const day = lap[today] || { n: 0, omzet: 0, item: 0 }; day.n++; day.omzet += tot; day.item += c.items.reduce((s, x) => s + x.qty, 0)
      lap[today] = day; for (const k of Object.keys(lap).sort().slice(0, -60)) delete lap[k]; K.set(m.sender, 'kasirlap', lap)
      c.items = []; c.diskon = null; save(); return reply(out + `\n_Transaksi tercatat. Terima kasih!_`)
    }
    if (sub === 'laporan') {
      const lap = K.get(m.sender, 'kasirlap', {}), d = lap[today]; const week = Object.entries(lap).filter(([k]) => k >= K.addDays(today, -6)).reduce((s, [, v]) => s + v.omzet, 0)
      return reply(`✦ ${B('LAPORAN KASIR')}\n┣ Hari ini : ${d ? `${d.n} transaksi, ${d.item} barang` : 'belum ada transaksi'}\n┣ Omzet hari ini : *${K.rupiah(d ? d.omzet : 0)}*\n┗ Omzet 7 hari : *${K.rupiah(week)}*`)
    }
    if (sub === 'reset') { c.items = []; c.diskon = null; save(); return reply('Keranjang dikosongkan.') }
    if (sub === 'nota' || sub === 'list') return c.items.length ? reply(nota(c) + `\n_${p} tambah • hapus <no> • diskon <x%> • selesai <uang bayar> • laporan_`) : reply(`✦ ${B('KASIR')}\nKeranjang kosong.\n${p} tambah <barang> <harga> [jumlah]\n${p} diskon <10%|5rb>\n${p} selesai <uang bayar>\n${p} laporan • ${p} reset`)
    return reply(`✕ Subperintah tidak dikenal. Ketik ${p} untuk bantuan.`)
  },
}
