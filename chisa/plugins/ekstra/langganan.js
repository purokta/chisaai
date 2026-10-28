/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .langganan — pelacak langganan bulanan/tahunan (streaming, hosting, dll): total biaya + tanggal tagih berikutnya
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate()   // m: 1-12
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
function nextDate(s, today) {
  const [ty, tm] = [+today.slice(0, 4), +today.slice(5, 7)]
  if (s.cycle === 'bulanan') {
    for (let i = 0; i < 2; i++) { let y = ty, m = tm + i; if (m > 12) { m -= 12; y++ } const d = iso(y, m, Math.min(s.day, dim(y, m))); if (d >= today) return d }
  } else {
    for (let y = ty; y <= ty + 1; y++) { const d = iso(y, s.month, Math.min(s.day, dim(y, s.month))); if (d >= today) return d }
  }
  return today
}
const diff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5)
module.exports = {
  name: 'langganan', alias: ['subscription', 'subs', 'langgananku'], category: 'ekstra', noLimit: true, cmds: ['langganan'],
  desc: 'Pelacak langganan (Netflix, Spotify, hosting, dll): total biaya per bulan dan tanggal tagih berikutnya',
  run: async ({ m, args, prefix, reply }) => {
    const sub = (args[0] || 'list').toLowerCase(), list = K.get(m.sender, 'langganan', []), today = K.dayKey(), p = prefix + 'langganan'
    if (['tambah', 'add', 'baru'].includes(sub)) {
      const rest = args.slice(1), ci = rest.findIndex(x => ['bulanan', 'tahunan'].includes(x.toLowerCase()))
      const harga = ci > 0 ? K.parseNominal(rest[ci - 1]) : NaN, name = ci > 1 ? rest.slice(0, ci - 1).join(' ').slice(0, 40) : ''
      const cycle = ci >= 0 ? rest[ci].toLowerCase() : '', tgl = rest[ci + 1] || ''
      const help = `✕ Format:\n${p} tambah <nama> <harga> bulanan <tanggal 1-31>\n${p} tambah <nama> <harga> tahunan <tgl-bln>\nContoh: ${p} tambah Netflix 54rb bulanan 15\n        ${p} tambah Domain 180rb tahunan 20-08`
      if (!name || !(harga > 0)) return reply(help)
      let day, month
      if (cycle === 'bulanan') { day = parseInt(tgl, 10); if (!(day >= 1 && day <= 31)) return reply(help) }
      else { const mm = tgl.match(/^(\d{1,2})[-/](\d{1,2})$/); if (!mm) return reply(help); day = +mm[1]; month = +mm[2]; if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= dim(2024, month))) return reply('✕ Tanggal tahunan tidak valid (format tgl-bln, contoh 20-08).') }
      if (list.length >= 30) return reply('✕ Maksimal 30 langganan.')
      list.push({ name, harga, cycle, day, month, aktif: true }); K.set(m.sender, 'langganan', list)
      return reply(`✦ Langganan *${name}* (${K.rupiah(harga)} ${cycle}) disimpan.`)
    }
    if (['hapus', 'del', 'delete', 'jeda', 'lanjut'].includes(sub)) {
      const no = parseInt(args[1], 10); if (!no || no < 1 || no > list.length) return reply(`✕ Nomor tidak valid. Lihat ${p}`)
      if (['hapus', 'del', 'delete'].includes(sub)) { const [r] = list.splice(no - 1, 1); K.set(m.sender, 'langganan', list); return reply(`Langganan *${r.name}* dihapus.`) }
      list[no - 1].aktif = sub === 'lanjut'; K.set(m.sender, 'langganan', list); return reply(`*${list[no - 1].name}* ${sub === 'lanjut' ? 'diaktifkan kembali' : 'dijeda (tidak dihitung)'}.`)
    }
    if (!list.length) return reply(`✦ ${B('LANGGANAN')}\nBelum ada langganan.\n${p} tambah <nama> <harga> bulanan <tanggal>`)
    let perBulan = 0, t = `✦ ${B('LANGGANAN')}\n\n`
    const rows = list.map((s, i) => ({ s, i, next: nextDate(s, today) })).sort((a, b) => (a.s.aktif === b.s.aktif ? a.next.localeCompare(b.next) : a.s.aktif ? -1 : 1))
    for (const { s, i, next } of rows) {
      if (s.aktif) perBulan += s.cycle === 'bulanan' ? s.harga : s.harga / 12
      const d = diff(today, next)
      t += `${s.aktif ? '◆' : '◇'} *${i + 1}. ${s.name}* — ${K.rupiah(s.harga)} ${s.cycle}${s.aktif ? `\n   tagih ${K.fmtTanggal(next)} (${d === 0 ? 'HARI INI' : d + ' hari lagi'})` : ' _(dijeda)_'}\n`
    }
    return reply(t + `\n${B('Rata-rata per bulan')} : *${K.rupiah(perBulan)}*\n${B('Per tahun')} : *${K.rupiah(perBulan * 12)}*\n\n_${p} tambah • hapus <no> • jeda <no> • lanjut <no>_`)
  },
}
