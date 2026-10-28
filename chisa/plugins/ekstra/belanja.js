/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .belanja — daftar belanja pribadi dengan perkiraan harga. .belanja <item> [harga] • centang <no> • hapus <no> • bersih • reset
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'belanja', alias: ['shopping', 'daftarbelanja'], category: 'ekstra', noLimit: true, cmds: ['belanja'],
  desc: 'Daftar belanja: .belanja <item> [harga] • centang <no> • hapus <no> • bersih • reset',
  run: async ({ m, args, prefix, reply }) => {
    const list = K.get(m.sender, 'belanja', []), sub = (args[0] || 'list').toLowerCase(), no = parseInt(args[1], 10), p = prefix + 'belanja', save = () => K.set(m.sender, 'belanja', list)
    const ok = () => no >= 1 && no <= list.length
    if (['centang', 'cek', 'done', 'beli'].includes(sub) && args[1]) { if (!ok()) return reply('✕ Nomor tidak valid.'); list[no - 1].d = list[no - 1].d ? 0 : 1; save(); return reply(list[no - 1].d ? `◆ Sudah dibeli: *${list[no - 1].n}*` : `◇ Dibatalkan: *${list[no - 1].n}*`) }
    if (['hapus', 'del'].includes(sub)) { if (!ok()) return reply('✕ Nomor tidak valid.'); const [r] = list.splice(no - 1, 1); save(); return reply(`Dihapus: *${r.n}*`) }
    if (['bersih', 'clear'].includes(sub)) { const n = list.filter(x => x.d).length; K.set(m.sender, 'belanja', list.filter(x => !x.d)); return reply(`${n} item yang sudah dibeli dibersihkan.`) }
    if (sub === 'reset') { K.set(m.sender, 'belanja', []); return reply('Daftar belanja dikosongkan.') }
    if (!['list', 'daftar', 'lihat'].includes(sub)) {
      // tambah item: kata terakhir yang berupa nominal dianggap harga
      const words = (['tambah', 'add'].includes(sub) ? args.slice(1) : args).slice(), last = words[words.length - 1], hrg = words.length > 1 ? K.parseNominal(last) : NaN
      if (Number.isFinite(hrg)) words.pop()
      const n = words.join(' ').trim().slice(0, 60); if (!n) return reply(`Format: ${p} <item> [harga]\nContoh: ${p} Beras 5kg 70rb`)
      if (list.length >= 50) return reply('✕ Maksimal 50 item. Gunakan ' + p + ' bersih')
      list.push({ n, p: Number.isFinite(hrg) ? hrg : 0, d: 0 }); save()
      return reply(`✦ Ditambahkan: *${n}*${Number.isFinite(hrg) ? ' — ' + K.rupiah(hrg) : ''}\n_Total ${list.length} item_`)
    }
    if (!list.length) return reply(`${B('DAFTAR BELANJA')}\nMasih kosong.\nTambah: ${p} <item> [harga]\nContoh: ${p} Telur 1kg 30rb`)
    const done = list.filter(x => x.d).length, tot = list.reduce((a, x) => a + x.p, 0), sisa = list.filter(x => !x.d).reduce((a, x) => a + x.p, 0)
    return reply(`✦ ${B('DAFTAR BELANJA')}  ${K.bar(done / list.length)} ${done}/${list.length}\n━━━━━━━━━━━━━━━━━━━━\n` + list.map((x, i) => `${x.d ? '◆' : '◇'} ${i + 1}. ${x.d ? '~' + x.n + '~' : x.n}${x.p ? ' — ' + K.rupiah(x.p) : ''}`).join('\n') + `\n━━━━━━━━━━━━━━━━━━━━\nPerkiraan total : *${K.rupiah(tot)}*\nMasih harus beli: ${K.rupiah(sisa)}\n\n_${p} centang <no> • hapus <no> • bersih • reset_`)
  },
}
