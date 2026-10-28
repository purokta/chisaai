/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat kreatif & perencana AI:
//   .cerita <tema>      cerita pendek (±250 kata)          .puisi <tema>     puisi 3 bait
//   .resepai <bahan>    ide masakan dari bahan di rumah    .carinama <konsep> 10 ide nama (bisnis/akun/hewan/proyek)
//   .rencana <tujuan>   rencana langkah demi langkah       .debat <topik>    argumen pro & kontra seimbang
const { B } = require('../../lib/style'), ai = require('../../lib/ai')
const MODES = {
  cerita:   ['CERITA', 'Tulis cerita pendek (sekitar 250 kata) berbahasa Indonesia yang hidup dengan awal, konflik, dan akhir yang berkesan. Beri judul di baris pertama. Hindari konten dewasa atau kekerasan grafis.'],
  puisi:    ['PUISI', 'Tulis puisi bebas 3 bait (tiap bait 4 baris) berbahasa Indonesia dengan diksi indah dan citraan kuat. Beri judul di baris pertama.'],
  resepai:  ['RESEP', 'Dari bahan yang disebutkan pengguna, usulkan 3 ide masakan Indonesia yang realistis. Untuk tiap ide: nama, bahan tambahan sederhana (bila perlu), dan 4–6 langkah singkat. Asumsikan bumbu dapur dasar tersedia.'],
  carinama: ['IDE NAMA', 'Beri 10 ide nama kreatif, mudah diingat dan diucapkan, untuk konsep yang disebutkan. Tiap nama disertai satu kalimat alasan. Campur gaya: serius, lucu, singkat.'],
  rencana:  ['RENCANA', 'Susun rencana langkah demi langkah yang realistis untuk tujuan pengguna: ringkasan target, 5–8 langkah bernomor dengan perkiraan waktu, serta 3 risiko umum dan cara menghindarinya. Padat dan praktis.'],
  debat:    ['PRO & KONTRA', 'Sajikan argumen terbaik dari dua sisi secara seimbang dan adil untuk topik berikut: 3 poin PRO dan 3 poin KONTRA, masing-masing 1–2 kalimat, lalu satu kalimat penutup netral tentang apa yang perlu dipertimbangkan. Jangan memihak.'],
}
const ALIAS = { cerita: ['storyai', 'ceritapendek'], puisi: ['sajak', 'poem'], resepai: ['masakin', 'resepdari', 'masakapa'], carinama: ['ideanama', 'namain', 'namakreatif'], rencana: ['plan', 'rencanakan', 'langkah'], debat: ['proskontra', 'prokontra'] }
const LOOK = {}; for (const [k, v] of Object.entries(MODES)) { LOOK[k] = k; (ALIAS[k] || []).forEach(a => LOOK[a] = k) }
const EX = { cerita: 'kucing yang takut hujan', puisi: 'senja di pelabuhan', resepai: 'telur, kol, nasi sisa', carinama: 'kedai kopi untuk mahasiswa', rencana: 'belajar bahasa Jepang dalam 6 bulan', debat: 'sekolah lima hari seminggu' }
module.exports = {
  name: 'cerita', alias: Object.keys(LOOK).filter(k => k !== 'cerita'), category: 'ai', cmds: Object.keys(MODES),
  desc: 'AI kreatif: cerita, puisi, resepai, carinama, rencana, debat',
  run: async ({ sock, m, text, command, prefix, reply, isCreator }) => {
    const mode = LOOK[command], [title, sys] = MODES[mode]
    const body = (text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
    if (!body) return reply(`${B(title)}\nContoh: ${prefix}${command} ${EX[mode]}\n\nSerumpun: ${Object.keys(MODES).map(k => prefix + k).join('  ')}`)
    if (body.length > 1500) return reply('✕ Terlalu panjang (maks 1500 karakter).')
    sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
    try {
      const r = await ai.ask({ uid: m.sender, memory: false, sys: `Kamu penulis dan perencana yang kreatif, jujur, dan ramah. ${sys}`, text: body })
      return reply(`${B(title)}\n━━━━━━━━━━━━━━━━━━━━\n${r.text}`)
    } catch (e) { console.log('[kreatif]', e.message, e.details || ''); return reply(`Maaf, AI sedang tidak bisa menjawab. Coba lagi sebentar ya.${isCreator && e.details ? '\n_' + e.details.join('\n') + '_' : ''}`) }
  },
}
