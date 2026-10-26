/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .ringkasgrup — ringkasan cepat grup: jumlah anggota, admin, dibuat kapan, deskripsi. (grup saja)
const { B } = require('../../lib/style')
module.exports = {
  name: 'ringkasgrup', alias: ['gcringkas'], category: 'group', group: true, noLimit: true, cmds: ['ringkasgrup'],
  desc: 'Ringkasan grup: jumlah anggota, admin, tanggal dibuat, dan deskripsi',
  run: async ({ m, reply, groupMetadata: g, isBotAdmins }) => {
    if (!g) return reply('✕ Data grup tidak terbaca. Coba lagi sebentar.')
    const ps = g.participants || [], adm = ps.filter(p => p.admin), sa = ps.filter(p => p.admin === 'superadmin'), mem = ps.length - adm.length
    const made = g.creation ? new Date(g.creation * 1000).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' }) : '-'
    const days = g.creation ? Math.max(1, Math.floor((Date.now() / 1000 - g.creation) / 86400)) : null
    return reply(`👥 ${B('RINGKASAN GRUP')}\n┣ Nama     : ${g.subject || '-'}\n┣ Anggota  : *${ps.length}* (${adm.length} admin • ${mem} anggota biasa)\n┣ Pendiri  : ${sa.length || 1} superadmin\n┣ Dibuat   : ${made}${days ? ` (${days.toLocaleString('id-ID')} hari lalu)` : ''}\n┣ Pesan sementara : ${g.ephemeralDuration ? Math.round(g.ephemeralDuration / 86400) + ' hari' : 'mati'}\n┣ Siapa boleh kirim : ${g.announce ? 'hanya admin' : 'semua anggota'}\n┣ Bot admin: ${isBotAdmins ? 'ya' : 'bukan'}\n┗ Deskripsi: ${g.desc ? String(g.desc).slice(0, 160) + (String(g.desc).length > 160 ? '…' : '') : '(kosong)'}`)
  },
}
