/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tulis <teks> — teks jadi tulisan tangan di kertas buku bergaris. Opsi: .tulis nama=Budi tinta=merah | isi
const K2 = require('../../lib/kreasi2'), S = require('../../lib/settingsdb')
const INK = { biru: '#1b3a9a', hitam: '#1a1a1a', merah: '#b3202a', hijau: '#16643a', ungu: '#5b2a8a' }

module.exports = {
  name: 'tulis', alias: ['nulis', 'handwrite', 'tulisan'], category: 'kreasi', cmds: ['tulis'],
  desc: 'Teks jadi tulisan tangan di kertas buku bergaris (nama, tanggal, warna tinta opsional)',
  run: async ({ sock, m, text, prefix, reply, pushname }) => {
    let raw = String(text || (m.quoted && m.quoted.text) || '').trim(), nama = '', ink = INK.biru
    const head = raw.split('|')[0]
    if (raw.includes('|') && /(^|\s)(nama|tinta)=/.test(head)) {
      const mn = /nama=([^|]*?)(?=\s+tinta=|$)/.exec(head), mi = /tinta=(\S+)/.exec(head)
      if (mn) nama = mn[1].trim().slice(0, 30)
      if (mi && INK[mi[1].toLowerCase()]) ink = INK[mi[1].toLowerCase()]
      raw = raw.slice(raw.indexOf('|') + 1).trim()
    }
    if (!raw) return reply(`✍️ *TULISAN TANGAN*\n\n> Ubah teks jadi tulisan tangan di kertas buku. Maksimal sekitar 19 baris.\n> Nama dan warna tinta (${Object.keys(INK).join(', ')}) opsional.\n\n*Contoh:*\n> ${prefix}tulis Hari ini aku belajar membuat bot\n> ${prefix}tulis nama=Budi tinta=hitam | Catatan hari ini...`)
    const tanggal = new Date().toLocaleDateString('id-ID', { timeZone: S.get('timezone') || 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })
    try {
      await sock.sendMessage(m.chat, { image: await K2.handwriting(raw.replace(/[\u{13000}-\u{1342F}]/gu, ''), { nama: nama || pushname || '', tanggal, ink }), caption: '✍️ Tulisan tangan' }, { quoted: m })
    } catch (e) { console.log('[tulis]', e.message); reply('❌ Gagal membuat gambar: ' + e.message) }
  },
}
