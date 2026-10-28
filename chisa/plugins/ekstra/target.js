/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .target — tujuan menabung dengan progres, sisa hari, dan kebutuhan setoran
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const daysTo = (due) => Math.round((Date.parse(due + 'T00:00:00Z') - Date.parse(K.dayKey() + 'T00:00:00Z')) / 864e5)
module.exports = {
  name: 'target', alias: ['tujuan', 'goal', 'goals', 'tabungantarget'], category: 'ekstra', noLimit: true, cmds: ['target'],
  desc: 'Target menabung: .target baru <nama> <jumlah> [tanggal] • isi <no> <nominal> • tarik • hapus',
  run: async ({ m, args, prefix, reply }) => {
    const list = K.get(m.sender, 'targets', []), sub = (args[0] || 'list').toLowerCase(), p = prefix + 'target', save = () => K.set(m.sender, 'targets', list)
    if (['baru', 'tambah', 'add'].includes(sub)) {
      const name = (args[1] || '').replace(/_/g, ' ').slice(0, 40), goal = K.parseNominal(args[2]), due = args[3] ? K.parseTanggal(args[3]) : null
      if (!name || !(goal > 0) || (args[3] && !due)) return reply(`✕ Format: ${p} baru <nama> <jumlah> [tanggal]\nContoh: ${p} baru Laptop 12jt 2027-03-01\n_Nama dua kata: pakai garis bawah (Liburan_Bali)_`)
      if (due && daysTo(due) < 1) return reply('✕ Tanggal harus di masa depan.')
      if (list.length >= 15) return reply('✕ Maksimal 15 target.')
      list.push({ name, goal, saved: 0, due, at: K.dayKey() }); save()
      return reply(`✦ Target *${name}* dibuat: ${K.rupiah(goal)}${due ? `\n┗ Tenggat ${K.fmtTanggal(due)} (${daysTo(due)} hari lagi)` : ''}\n_Isi tabungan: ${p} isi ${list.length} 500rb_`)
    }
    if (['isi', 'setor', 'tarik'].includes(sub)) {
      const no = parseInt(args[1], 10), n = K.parseNominal(args[2]); if (!no || no < 1 || no > list.length || !(n > 0)) return reply(`✕ Format: ${p} ${sub} <no> <nominal>`)
      const t = list[no - 1]; t.saved = sub === 'tarik' ? Math.max(0, t.saved - n) : t.saved + n; save()
      const f = Math.min(1, t.saved / t.goal)
      return reply(`${t.saved >= t.goal ? '✦ *TARGET TERCAPAI!* ' : '✦ '}${B(t.name)}\n${K.bar(f)} ${Math.round(f * 100)}%\n┣ Terkumpul ${K.rupiah(t.saved)} / ${K.rupiah(t.goal)}\n┗ Sisa ${K.rupiah(Math.max(0, t.goal - t.saved))}`)
    }
    if (['hapus', 'del'].includes(sub)) { const no = parseInt(args[1], 10); if (!no || no < 1 || no > list.length) return reply('✕ Nomor tidak valid.'); const [r] = list.splice(no - 1, 1); save(); return reply(`Target *${r.name}* dihapus.`) }
    if (!list.length) return reply(`✦ ${B('TARGET MENABUNG')}\n\nBelum ada target.\nMulai: ${p} baru <nama> <jumlah> [tanggal]`)
    return reply(`✦ ${B('TARGET MENABUNG')}\n\n` + list.map((t, i) => {
      const f = Math.min(1, t.saved / t.goal), sisa = Math.max(0, t.goal - t.saved); let extra = ''
      if (t.due && sisa > 0) { const d = daysTo(t.due); extra = d > 0 ? `\n   ${d} hari lagi • butuh ${K.rupiah(sisa / d)}/hari atau ${K.rupiah(sisa / Math.max(1, d / 30))}/bulan` : '\n   ⚠ Tenggat terlewati' }
      return `${t.saved >= t.goal ? '◆' : '◇'} *${i + 1}. ${t.name}*\n   ${K.bar(f)} ${Math.round(f * 100)}% • ${K.rupiah(t.saved)} / ${K.rupiah(t.goal)}${extra}`
    }).join('\n\n') + `\n\n_${p} isi <no> <nominal> • tarik • hapus_`)
  },
}
