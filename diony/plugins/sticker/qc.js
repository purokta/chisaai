/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .qc [warna] [teks] — kutipan chat jadi stiker: gelembung pesan + nama + foto profil. Reply pesan, atau tulis teks sendiri.
//   Contoh: reply pesan lalu .qc   |   .qc Halo semua   |   .qc biru Halo semua
const L = require('../../lib/stickerlib'), K2 = require('../../lib/kreasi2'), ST = require('../../lib/style')
const TEMA = { gelap: '#202c33', hijau: '#005c4b', biru: '#1d4e89', ungu: '#4b2a7b', merah: '#7a1f2b', pink: '#8a2f5f', putih: '#ffffff' }

async function avatar(sock, jid) {
  try { const url = await sock.profilePictureUrl(jid, 'image'); const b = await require('../../lib/functions').getBuffer(url); return Buffer.isBuffer(b) ? b : null } catch { return null }
}
module.exports = {
  name: 'qc', alias: ['quotechat', 'fakechat', 'stikerchat'], category: 'sticker', cmds: ['qc'],
  desc: 'Kutipan chat jadi stiker (gelembung pesan + nama + foto profil); reply pesan atau tulis teks',
  run: async ({ sock, m, text, args, prefix, reply, pushname }) => {
    let a = [...args], tema = '#202c33'
    if (a[0] && TEMA[a[0].toLowerCase()]) { tema = TEMA[a.shift().toLowerCase()] }
    let t = a.join(' ').trim(), jid = m.sender, name = pushname
    if (m.quoted) { t = String(m.quoted.text || t || '').trim(); jid = m.quoted.sender || jid; name = (jid === m.sender ? pushname : '') || jid.split('@')[0] }
    if (!t) return reply(`💬 *QUOTE CHAT*\n\n> Reply sebuah pesan dengan ${prefix}qc, atau tulis teksnya sendiri.\n> Tema: ${Object.keys(TEMA).join(', ')}\n\n*Contoh:*\n> ${prefix}qc Halo semua\n> ${prefix}qc hijau Halo semua`)
    t = t.replace(/[\u{13000}-\u{1342F}]/gu, '').slice(0, 400).trim()
    if (!t) return reply('Isi pesannya kosong.')
    L.react(sock, m, '🕕')
    try {
      const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.')
      const img = await K2.chatBubble(name || 'Anonim', t, { bg: tema, avatar: await avatar(sock, jid), time })
      await L.sendImageAsSticker(sock, m, img)
      L.react(sock, m, '✅')
    } catch (e) { console.log('[qc]', e.message); L.react(sock, m, '❌'); reply(`❌ *Gagal membuat stiker*\n\n> ${e.message}`) }
  },
}
