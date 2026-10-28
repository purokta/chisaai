/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// ANGGOTA TIDAK AKTIF (admin)
//   .cekinaktif [hari]          daftar anggota yang tidak tercatat ngobrol dalam N hari (bawaan 14)
//   .kickinaktif [hari] ya      keluarkan mereka (bot admin; admin tidak ikut; maks 25 per perintah)
// Dihitung dari pesan yang dicatat bot (sama dengan .topchat), jadi hanya berlaku sejak bot memantau grup ini.
const C = require('../../lib/chatcount'), { tag } = require('../../lib/grouputil'), { B } = require('../../lib/style')
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
module.exports = {
  name: 'cekinaktif', alias: ['kickinaktif', 'inaktif', 'cekdiam'],
  category: 'group', group: true, admin: true, noLimit: true, cmds: ['cekinaktif', 'kickinaktif'],
  desc: 'Cek / keluarkan anggota yang tidak aktif ngobrol',
  run: async ({ sock, m, reply, args, command, prefix, groupMetadata, botNumber, isBotAdmins }) => {
    const nums = args.filter(a => /^\d+$/.test(a)), days = Math.max(1, Math.min(365, parseInt(nums[0], 10) || 14))
    const seen = new Map(C.top(m.chat, 100000).map(x => [x.jid, x.t])), limit = Date.now() - days * 864e5
    const total = C.total(m.chat)
    const owners = (global.owner || []).map(o => String(o).replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    const idle = groupMetadata.participants.filter(p => !p.admin && p.id !== botNumber && !owners.includes(p.id) && (seen.get(p.id) || 0) < limit)
    if (command === 'cekinaktif' || command === 'inaktif' || command === 'cekdiam') {
      if (!idle.length) return reply(`Semua anggota non-admin tercatat aktif dalam ${days} hari terakhir.`)
      const rows = idle.slice(0, 40).map((p, i) => `${i + 1}. ${tag(p.id)} — ${seen.get(p.id) ? 'terakhir ' + new Date(seen.get(p.id)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'belum tercatat'}`)
      return sock.sendMessage(m.chat, { text: `${B('TIDAK AKTIF')} ${days} hari (${idle.length} anggota)\n━━━━━━━━━━━━━━━━━━━━\n${rows.join('\n')}${idle.length > 40 ? `\n… dan ${idle.length - 40} lainnya` : ''}\n\n_Pesan dihitung sejak bot memantau grup ini._\nKeluarkan: ${prefix}kickinaktif ${days} ya`, mentions: idle.slice(0, 40).map(p => p.id) }, { quoted: m })
    }
    // kickinaktif
    if (!args.map(a => a.toLowerCase()).includes('ya')) return reply(`Ini akan mengeluarkan ${idle.length} anggota tidak aktif (${days} hari).\nLihat dulu: ${prefix}cekinaktif ${days}\nLanjutkan: ${prefix}kickinaktif ${days} ya`)
    if (!isBotAdmins) return reply(global.mess.botAdmin)
    if (total < 50) return reply(`Data aktivitas grup ini masih sedikit (${total} pesan tercatat), hasilnya belum bisa dipercaya. Tunggu bot memantau lebih lama.`)
    if (!idle.length) return reply('Tidak ada anggota tidak aktif.')
    const batch = idle.slice(0, 25); await reply(`Mengeluarkan ${batch.length} anggota tidak aktif...`)
    let ok = 0
    for (const p of batch) { try { await sock.groupParticipantsUpdate(m.chat, [p.id], 'remove'); ok++ } catch {} await sleep(1500) }
    return reply(`Selesai: ${ok}/${batch.length} dikeluarkan.${idle.length > batch.length ? ` Sisa ${idle.length - batch.length}, ulangi perintah untuk lanjut.` : ''}`)
  },
}
