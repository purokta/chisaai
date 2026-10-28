/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .servis  catatan servis kendaraan: odometer, riwayat + biaya, dan pengingat jatuh tempo per jenis servis (km dan/atau bulan)
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const nm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20)
const km = (s) => { const n = parseFloat(String(s || '').toLowerCase().replace(/km$/, '').replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? Math.round(n) : NaN }
const fmt = (n) => Math.round(n).toLocaleString('id-ID')
function addMonths(key, n) {
  const [y, mo, d] = key.split('-').map(Number), t = new Date(Date.UTC(y, mo - 1 + n, 1)), last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate()
  t.setUTCDate(Math.min(d, last)); return t.toISOString().slice(0, 10)
}
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5)
// status satu aturan: { kmLeft, dueKm, daysLeft, dueDate, last } ; null bila belum pernah dicatat
function ruleStatus(v, jenis, rule, today = K.dayKey()) {
  const last = [...v.log].reverse().find(l => l.jenis === jenis); if (!last) return { last: null }
  const o = { last }
  if (rule.km) { o.dueKm = last.km + rule.km; o.kmLeft = o.dueKm - v.km }
  if (rule.bln) { o.dueDate = addMonths(last.tgl, rule.bln); o.daysLeft = daysBetween(today, o.dueDate) }
  o.overdue = (o.kmLeft !== undefined && o.kmLeft < 0) || (o.daysLeft !== undefined && o.daysLeft < 0)
  o.soon = !o.overdue && ((o.kmLeft !== undefined && o.kmLeft <= Math.max(300, rule.km * 0.1)) || (o.daysLeft !== undefined && o.daysLeft <= 14))
  return o
}
module.exports = {
  name: 'servis', alias: ['servisku', 'kendaraan', 'servismotor', 'servismobil'], category: 'ekstra', noLimit: true, cmds: ['servis'],
  desc: 'Catatan servis kendaraan: odometer, riwayat dan biaya, pengingat jatuh tempo oli dll. per km / bulan',
  ruleStatus, addMonths,
  run: async ({ m, args, prefix, reply }) => {
    const sub = (args[0] || 'status').toLowerCase(), db = K.get(m.sender, 'servis', {}), p = prefix + 'servis', save = () => K.set(m.sender, 'servis', db)
    const need = (n) => { const v = db[nm(n)]; return v || null }
    const help = () => reply(`✦ ${B('SERVIS KENDARAAN')}\n${p} baru <nama> <km sekarang>\n${p} km <nama> <km sekarang>\n${p} aturan <nama> <jenis> <tiap km|-> <tiap bulan|->\n${p} catat <nama> <jenis> <km> [biaya] [tanggal]\n${p} status [nama]\n${p} riwayat [nama]\n${p} hapus <nama>\n\nContoh:\n${p} baru beat 12000\n${p} aturan beat oli 3000 4\n${p} catat beat oli 12100 65rb\n_Nama kendaraan dan jenis servis satu kata (huruf/angka)._`)
    if (['bantuan', 'help'].includes(sub)) return help()
    if (['baru', 'tambah', 'add'].includes(sub)) {
      const n = nm(args[1]), k = km(args[2]); if (!n || !(k >= 0)) return reply(`Format: ${p} baru <nama> <km sekarang>\nContoh: ${p} baru beat 12000`)
      if (db[n]) return reply(`Kendaraan *${n}* sudah ada. Perbarui odometer: ${p} km ${n} <km>`)
      if (Object.keys(db).length >= 8) return reply('Maksimal 8 kendaraan.')
      db[n] = { km: k, rules: {}, log: [] }; save(); return reply(`Kendaraan *${n}* tersimpan (${fmt(k)} km).\nAtur jadwal servis: ${p} aturan ${n} oli 3000 4`)
    }
    if (sub === 'km') {
      const v = need(args[1]), k = km(args[2]); if (!v || !(k >= 0)) return reply(`Format: ${p} km <nama> <km sekarang>`)
      if (k < v.km) return reply(`Odometer tidak boleh turun (sekarang tercatat ${fmt(v.km)} km).`)
      v.km = k; save(); return reply(`Odometer *${nm(args[1])}*: ${fmt(k)} km.`)
    }
    if (['aturan', 'rule', 'jadwal'].includes(sub)) {
      const v = need(args[1]), j = nm(args[2]); if (!v || !j) return reply(`Format: ${p} aturan <nama> <jenis> <tiap km|-> <tiap bulan|->\nContoh: ${p} aturan beat oli 3000 4  (setiap 3.000 km atau 4 bulan)\n${p} aturan beat filter - 12  (hanya per 12 bulan)\n${p} aturan beat oli hapus`)
      if (String(args[3]).toLowerCase() === 'hapus') { delete v.rules[j]; save(); return reply(`Aturan *${j}* dihapus.`) }
      const k = args[3] === '-' ? 0 : km(args[3]), b = args[4] === '-' || args[4] === undefined ? 0 : parseInt(args[4], 10)
      if (!(k >= 0) || !(b >= 0) || (!k && !b)) return reply('Isi minimal salah satu: jarak (km) atau bulan. Pakai - untuk tidak dipakai.')
      if (Object.keys(v.rules).length >= 15 && !v.rules[j]) return reply('Maksimal 15 aturan per kendaraan.')
      v.rules[j] = { km: k, bln: b }; save(); return reply(`Aturan *${j}* untuk ${nm(args[1])}: ${[k ? `tiap ${fmt(k)} km` : '', b ? `tiap ${b} bulan` : ''].filter(Boolean).join(' atau ')}.`)
    }
    if (['catat', 'log', 'servis'].includes(sub)) {
      const v = need(args[1]), j = nm(args[2]), k = km(args[3]); if (!v || !j || !(k >= 0)) return reply(`Format: ${p} catat <nama> <jenis> <km> [biaya] [tanggal]\nContoh: ${p} catat beat oli 12100 65rb`)
      let biaya = 0, tgl = K.dayKey(); for (const x of args.slice(4)) { const d = K.parseTanggal(x); if (d) tgl = d; else { const n = K.parseNominal(x); if (n >= 0) biaya = n } }
      if (tgl > K.dayKey()) return reply('Tanggal servis tidak boleh di masa depan.')
      if (v.log.length >= 300) v.log.shift()
      v.log.push({ jenis: j, km: k, tgl, biaya }); v.km = Math.max(v.km, k); save()
      const rule = v.rules[j], st = rule ? ruleStatus(v, j, rule) : null
      return reply(`Tercatat: *${j}* ${nm(args[1])} di ${fmt(k)} km (${K.fmtTanggal(tgl)})${biaya ? ', ' + K.rupiah(biaya) : ''}.` + (st && st.last ? `\nBerikutnya: ${[st.dueKm !== undefined ? `${fmt(st.dueKm)} km` : '', st.dueDate ? K.fmtTanggal(st.dueDate) : ''].filter(Boolean).join(' atau ')}` : ''))
    }
    if (['riwayat', 'history', 'log'].includes(sub)) {
      const names = args[1] ? [nm(args[1])] : Object.keys(db); if (!names.length || names.some(n => !db[n])) return reply('Kendaraan tidak ditemukan. Lihat: ' + p)
      let t = `✦ ${B('RIWAYAT SERVIS')}\n`
      for (const n of names) { const v = db[n], total = v.log.reduce((s, l) => s + (l.biaya || 0), 0); t += `\n*${n}* — ${fmt(v.km)} km • total biaya ${K.rupiah(total)}\n` + (v.log.length ? v.log.slice(-10).reverse().map(l => `• ${l.tgl}  ${l.jenis}  ${fmt(l.km)} km${l.biaya ? '  ' + K.rupiah(l.biaya) : ''}`).join('\n') : '_belum ada catatan_') + '\n' }
      return reply(t)
    }
    if (['hapus', 'del', 'delete'].includes(sub)) { const n = nm(args[1]); if (!db[n]) return reply('Kendaraan tidak ditemukan.'); delete db[n]; save(); return reply(`Kendaraan *${n}* beserta riwayatnya dihapus.`) }
    // status
    const names = args[1] ? [nm(args[1])] : Object.keys(db)
    if (!Object.keys(db).length) return help()
    if (names.some(n => !db[n])) return reply('Kendaraan tidak ditemukan. Daftar: ' + Object.keys(db).join(', '))
    let t = `✦ ${B('STATUS SERVIS')}\n`
    for (const n of names) {
      const v = db[n]; t += `\n*${n}* — ${fmt(v.km)} km\n`
      const keys = Object.keys(v.rules); if (!keys.length) { t += `_belum ada aturan: ${p} aturan ${n} oli 3000 4_\n`; continue }
      for (const j of keys) {
        const s = ruleStatus(v, j, v.rules[j])
        if (!s.last) { t += `• ${j}: belum pernah dicatat\n`; continue }
        const bits = []; if (s.kmLeft !== undefined) bits.push(s.kmLeft < 0 ? `lewat ${fmt(-s.kmLeft)} km` : `${fmt(s.kmLeft)} km lagi`)
        if (s.daysLeft !== undefined) bits.push(s.daysLeft < 0 ? `lewat ${-s.daysLeft} hari` : `${s.daysLeft} hari lagi`)
        t += `${s.overdue ? '[LEWAT]' : s.soon ? '[SEGERA]' : '[AMAN]'} ${j}: ${bits.join(' / ')}\n`
      }
    }
    return reply(t + `\n_Ganti jadwal sesuai buku servis kendaraanmu; angka di sini hanya pengingat._`)
  },
}
