/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .stok — stok barang sederhana (warung/olshop/rumah): tambah, ambil, atur batas minimum, peringatan hampir habis
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'stok', alias: ['stokbarang', 'gudang', 'persediaan'], category: 'ekstra', noLimit: true, cmds: ['stok'],
  desc: 'Stok barang: tambah/ambil, batas minimum, dan peringatan hampir habis',
  run: async ({ m, args, prefix, reply }) => {
    const sub = (args[0] || 'list').toLowerCase(), list = K.get(m.sender, 'stok', []), p = prefix + 'stok', save = () => K.set(m.sender, 'stok', list)
    const find = (q) => { const n = /^\d+$/.test(q || '') ? parseInt(q, 10) : 0; return n >= 1 && n <= list.length ? list[n - 1] : list.find(x => x.name.toLowerCase() === String(q || '').toLowerCase()) }
    // nama boleh lebih dari satu kata: angka terakhir = jumlah
    const split = (a) => { const r = a.slice(1), q = parseFloat(String(r[r.length - 1]).replace(',', '.')); return { name: r.slice(0, -1).join(' ').trim(), n: q } }
    if (['tambah', 'add', 'masuk'].includes(sub)) {
      const mn = args.join(' ').match(/\s+min=(\d+)/i), min = mn, { name: nm, n } = split(mn ? [args[0], ...args.slice(1).filter(x => !/^min=\d+$/i.test(x))] : args)
      if (!nm || !(n > 0)) return reply(`✕ Format: ${p} tambah <barang> <jumlah> [min=<batas>]\nContoh: ${p} tambah Beras 5kg 20 min=5`)
      let it = find(nm); if (!it) { if (list.length >= 100) return reply('✕ Maksimal 100 jenis barang.'); it = { name: nm.slice(0, 40), qty: 0, min: 0 }; list.push(it) }
      it.qty += n; if (min) it.min = +min[1]; save(); return reply(`✦ *${it.name}* +${n} → stok *${it.qty}*${it.min ? ` (min ${it.min})` : ''}`)
    }
    if (['ambil', 'keluar', 'jual', 'pakai'].includes(sub)) {
      const { name, n } = split(args), it = find(name); if (!it || !(n > 0)) return reply(`✕ Format: ${p} ambil <barang|no> <jumlah>`)
      if (n > it.qty) return reply(`✕ Stok *${it.name}* hanya ${it.qty}.`); it.qty -= n; save()
      return reply(`✦ *${it.name}* −${n} → sisa *${it.qty}*${it.qty <= it.min ? `\n✦ Stok di bawah/sama dengan batas minimum (${it.min}). Waktunya isi ulang.` : ''}`)
    }
    if (sub === 'set') { const { name, n } = split(args), it = find(name); if (!it || !(n >= 0)) return reply(`✕ Format: ${p} set <barang|no> <jumlah>`); it.qty = n; save(); return reply(`*${it.name}* diatur ke ${n}.`) }
    if (sub === 'min') { const { name, n } = split(args), it = find(name); if (!it || !(n >= 0)) return reply(`✕ Format: ${p} min <barang|no> <batas>`); it.min = n; save(); return reply(`Batas minimum *${it.name}*: ${n}.`) }
    if (['hapus', 'del'].includes(sub)) { const it = find(args.slice(1).join(' ')); if (!it) return reply('✕ Barang tidak ditemukan.'); list.splice(list.indexOf(it), 1); save(); return reply(`*${it.name}* dihapus dari stok.`) }
    if (sub === 'cari') { const q = args.slice(1).join(' ').toLowerCase(), r = list.filter(x => x.name.toLowerCase().includes(q)); return reply(r.length ? r.map(x => `◆ ${x.name}: ${x.qty}`).join('\n') : 'Tidak ditemukan.') }
    if (!list.length) return reply(`✦ ${B('STOK BARANG')}\nBelum ada barang.\n${p} tambah <barang> <jumlah> [min=<batas>]`)
    const low = list.filter(x => x.qty <= x.min)
    let t = `✦ ${B('STOK BARANG')} (${list.length} jenis)\n\n` + list.map((x, i) => `${x.qty <= x.min ? '◇' : '◆'} *${i + 1}. ${x.name}* : ${x.qty}${x.min ? ` / min ${x.min}` : ''}${x.qty <= x.min ? ' ← hampir habis' : ''}`).join('\n')
    if (low.length) t += `\n\n✦ ${B('Perlu isi ulang')}: ${low.map(x => x.name).join(', ')}`
    return reply(t + `\n\n_${p} tambah • ambil • set • min • cari <kata> • hapus_`)
  },
}
