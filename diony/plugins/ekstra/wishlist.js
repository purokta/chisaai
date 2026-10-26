/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .wishlist — daftar keinginan beli dengan prioritas, tabungan per barang, dan progres
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'wishlist', alias: ['keinginan', 'inginbeli', 'wish'], category: 'ekstra', noLimit: true, cmds: ['wishlist'],
  desc: 'Daftar keinginan beli: harga, prioritas 1–3, tabungan per barang, dan progres',
  run: async ({ m, args, prefix, reply }) => {
    const sub = (args[0] || 'list').toLowerCase(), list = K.get(m.sender, 'wishlist', []), p = prefix + 'wishlist', save = () => K.set(m.sender, 'wishlist', list)
    const idx = (a) => { const n = parseInt(a, 10); return n >= 1 && n <= list.length ? n - 1 : -1 }
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const rest = args.slice(1); let prio = 2; if (/^p[1-3]$/i.test(rest[rest.length - 1] || '')) prio = +rest.pop().slice(1)
      const harga = K.parseNominal(rest[rest.length - 1]), name = rest.slice(0, -1).join(' ').slice(0, 50)
      if (!name || !(harga > 0)) return reply(`✕ Format: ${p} tambah <nama> <harga> [p1|p2|p3]\nContoh: ${p} tambah Headphone 1,2jt p1\n_p1 = paling penting_`)
      if (list.length >= 40) return reply('✕ Maksimal 40 barang.')
      list.push({ name, harga, prio, saved: 0, done: false }); save(); return reply(`✦ *${name}* (${K.rupiah(harga)}, prioritas ${prio}) masuk wishlist.`)
    }
    if (['nabung', 'simpan', 'isi'].includes(sub)) {
      const i = idx(args[1]), n = K.parseNominal(args[2]); if (i < 0 || !(n > 0)) return reply(`✕ Format: ${p} nabung <no> <nominal>`)
      const w = list[i]; w.saved = Math.min(w.harga, w.saved + n); save()
      return reply(`✦ *${w.name}*\n${K.bar(w.saved / w.harga)} ${Math.round(w.saved / w.harga * 100)}%\nTerkumpul ${K.rupiah(w.saved)} dari ${K.rupiah(w.harga)}${w.saved >= w.harga ? '\n_Target tercapai! Tandai terbeli: ' + p + ' beli ' + (i + 1) + '_' : `, kurang ${K.rupiah(w.harga - w.saved)}`}`)
    }
    if (['beli', 'done', 'terbeli'].includes(sub)) { const i = idx(args[1]); if (i < 0) return reply('✕ Nomor tidak valid.'); list[i].done = !list[i].done; save(); return reply(list[i].done ? `✦ *${list[i].name}* ditandai sudah terbeli.` : `*${list[i].name}* dikembalikan ke daftar keinginan.`) }
    if (['hapus', 'del', 'delete'].includes(sub)) { const i = idx(args[1]); if (i < 0) return reply('✕ Nomor tidak valid.'); const [r] = list.splice(i, 1); save(); return reply(`*${r.name}* dihapus dari wishlist.`) }
    if (!list.length) return reply(`✦ ${B('WISHLIST')}\nMasih kosong.\n${p} tambah <nama> <harga> [p1|p2|p3]`)
    const open = list.map((w, i) => ({ w, i })).filter(x => !x.w.done).sort((a, b) => a.w.prio - b.w.prio || a.w.harga - b.w.harga), done = list.filter(w => w.done)
    let t = `✦ ${B('WISHLIST')}\n\n`
    for (const { w, i } of open) t += `◆ *${i + 1}. ${w.name}* [p${w.prio}] — ${K.rupiah(w.harga)}\n   ${K.bar(w.saved / w.harga)} ${Math.round(w.saved / w.harga * 100)}% (kurang ${K.rupiah(w.harga - w.saved)})\n`
    const sisa = open.reduce((s, x) => s + x.w.harga - x.w.saved, 0)
    if (open.length) t += `\n${B('Total kekurangan')} : *${K.rupiah(sisa)}*\n`
    if (done.length) t += `\n${B('Sudah terbeli')} (${done.length}): ${done.map(w => w.name).join(', ')}\n`
    return reply(t + `\n_${p} tambah • nabung <no> <nominal> • beli <no> • hapus <no>_`)
  },
}
