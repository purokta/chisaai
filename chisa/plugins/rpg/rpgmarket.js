/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PASAR PEMAIN: jual item ke pemain lain (bahan, potion, equipment). Biaya 5% dipotong dari hasil jual.
//   .pasar [halaman|nama item] • .jualpasar <item> <jumlah> <harga satuan> • .belipasar <id> [jumlah]
//   .batalpasar <id> • .pasarku       (harga boleh 5k / 2jt; listing kedaluwarsa 3 hari, barang kembali ke tasmu)
const { R, need, itemName } = require('../../lib/rpgctx')
const DV = require('../../lib/dev')
const UI = require('../../lib/rpgui'), { G, fmt } = UI
const D = R.D
const FEE = 0.05, TTL = 3 * 86400000, MAX_LIST = 5, PAGE = 8

const mk = () => (R.db.market = R.db.market || { seq: 0, list: [] })
function findItem(str) {
  const q = String(str || '').toLowerCase().replace(/\s+/g, '_'); if (!q) return null
  if (D.ITEMS[q]) return q
  return Object.keys(D.ITEMS).find(k => D.ITEMS[k].n.toLowerCase().replace(/\s+/g, '_') === q) || Object.keys(D.ITEMS).find(k => k.includes(q) || D.ITEMS[k].n.toLowerCase().replace(/\s+/g, '_').includes(q)) || null
}
function sweep() {
  const M = mk(), now = Date.now(); let n = 0
  M.list = M.list.filter(l => {
    if (l.at + TTL > now) return true
    const s = R.get(l.seller); if (s) R.give(s, l.item, l.qty); n++; return false
  })
  if (n) R.save()
}
const line = (l) => `*#${l.id}* ${itemName(l.item)} x${l.qty} — ${fmt(l.price)} g/buah • ${(R.get(l.seller) || {}).name || '???'}`

module.exports = {
  name: 'pasar', alias: ['market', 'mp', 'jualpasar', 'listing', 'belipasar', 'batalpasar', 'pasarku'], category: 'rpg', noLimit: true,
  cmds: ['pasar', 'jualpasar', 'belipasar', 'batalpasar', 'pasarku'], desc: 'Pasar antar pemain: .pasar, .jualpasar, .belipasar, .batalpasar',
  run: async (ctx) => {
    const { command: c, args, prefix, reply, m } = ctx
    const u = need(ctx); if (!u) return
    sweep(); const M = mk()

    if (c === 'jualpasar' || c === 'listing') {
      const id = findItem(args[0]), qty = parseInt(args[1]), price = DV.parseAmount(args[2])
      if (!id || !(qty >= 1) || !Number.isFinite(price)) return reply(`Contoh: ${prefix}jualpasar iron_ore 20 50\n(item, jumlah, harga SATUAN — boleh 5k / 2jt)`)
      if (price < 1 || price > 1e9) return reply('Harga satuan harus 1 – 1.000.000.000 gold.')
      if (!R.has(u, id, qty)) return reply(`Kamu hanya punya ${u.inv[id] || 0}x ${D.ITEMS[id].n} di tas (item yang sedang dipakai tidak bisa dijual).`)
      if (M.list.filter(l => l.seller === m.sender).length >= MAX_LIST) return reply(`Maksimal ${MAX_LIST} listing aktif. Batalkan salah satu: ${prefix}pasarku`)
      R.take(u, id, qty); const l = { id: ++M.seq, seller: m.sender, item: id, qty, price, at: Date.now() }; M.list.push(l); R.save()
      return UI.say(ctx, { glyph: G.offer, title: 'Listing Dibuat', sub: `#${l.id}`, quote: [`${itemName(id)} x${qty} dijual *${fmt(price)} gold/buah*`, `Jika semua terjual: ~${fmt(Math.floor(price * qty * (1 - FEE)))} gold (potongan 5%)`, 'Kedaluwarsa 3 hari (barang kembali ke tas).'], hint: `Batalkan: ${prefix}batalpasar ${l.id}` })
    }
    if (c === 'belipasar') {
      const l = M.list.find(x => x.id === parseInt(args[0])); if (!l) return reply(`Contoh: ${prefix}belipasar 12 3\nLihat daftar: ${prefix}pasar`)
      if (l.seller === m.sender) return reply(`Itu listing-mu sendiri. Batalkan dengan ${prefix}batalpasar ${l.id}`)
      const n = /^(all|semua)$/i.test(args[1] || '') ? l.qty : Math.max(1, parseInt(args[1]) || 1)
      if (n > l.qty) return reply(`Stok listing hanya ${l.qty}.`)
      const total = n * l.price; if (u.gold < total) return reply(`Gold kurang. Butuh ${fmt(total)} (kamu ${fmt(u.gold)}).`)
      u.gold -= total; R.give(u, l.item, n); l.qty -= n
      const net = Math.floor(total * (1 - FEE)), s = R.get(l.seller); if (s) s.gold += net
      if (l.qty <= 0) M.list = M.list.filter(x => x !== l)
      R.save()
      return UI.say(ctx, { glyph: G.offer, title: 'Pembelian Berhasil', quote: [`${itemName(l.item)} x${n} dibeli seharga *${fmt(total)} gold*`, `Penjual (${s ? s.name : '???'}) menerima ${fmt(net)} gold.`] })
    }
    if (c === 'batalpasar') {
      const l = M.list.find(x => x.id === parseInt(args[0]) && x.seller === m.sender); if (!l) return reply(`Listing tidak ditemukan / bukan milikmu. Cek: ${prefix}pasarku`)
      R.give(u, l.item, l.qty); M.list = M.list.filter(x => x !== l); R.save()
      return reply(`Listing #${l.id} dibatalkan — ${itemName(l.item)} x${l.qty} kembali ke tasmu.`)
    }
    if (c === 'pasarku') {
      const mine = M.list.filter(x => x.seller === m.sender)
      return UI.say(ctx, { glyph: G.offer, title: 'Listing Saya', quote: mine.length ? mine.map(line) : ['Belum ada listing.'], hint: `Jual: ${prefix}jualpasar <item> <jumlah> <harga>` })
    }
    // .pasar
    const a = (args[0] || '').toLowerCase(), page = /^\d+$/.test(a) ? parseInt(a) : 1, it = a && !/^\d+$/.test(a) ? findItem(a) : null
    let list = [...M.list].sort((x, y) => x.price - y.price)
    if (a && !/^\d+$/.test(a)) { if (!it) return reply(`Item "${a}" tidak dikenal.`); list = list.filter(x => x.item === it) }
    if (!list.length) return UI.say(ctx, { glyph: G.offer, title: 'Pasar Pemain', quote: [it ? `Tidak ada ${D.ITEMS[it].n} yang dijual.` : 'Pasar masih kosong.'], hint: `Jadi penjual pertama: ${prefix}jualpasar` })
    const pages = Math.ceil(list.length / PAGE), pg = Math.min(Math.max(1, page), pages)
    return UI.say(ctx, { glyph: G.offer, title: 'Pasar Pemain', sub: `hal ${pg}/${pages}`, quote: list.slice((pg - 1) * PAGE, pg * PAGE).map(line), hint: `Beli: ${prefix}belipasar <id> [jumlah] • Filter: ${prefix}pasar <item>` })
  },
}
