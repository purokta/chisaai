/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .logo <gaya> <teks> — teks bergaya jadi gambar banner 1280x640 (dibuat lokal)
const K2 = require('../../lib/kreasi2'), ST = require('../../lib/style')
const ALIAS = { gold: 'emas', fire: 'api', ice: 'es', chrome: 'kromium', synthwave: 'retro', vaporwave: 'retro', '3d': '3d', tiga: '3d', matrix: 'hijau', hacker: 'hijau' }

module.exports = {
  name: 'logo', alias: ['logoteks', 'textlogo', 'banner', ...Object.keys(K2.LOGO_STYLES).map(s => 'logo' + s)], category: 'kreasi', cmds: ['logo'],
  desc: 'Teks bergaya jadi gambar: neon, emas, api, es, kromium, retro, 3d, glitch, hijau',
  run: async ({ sock, m, args, command, prefix, reply }) => {
    let style = command.startsWith('logo') && command.length > 4 ? command.slice(4) : ''
    const a = [...args]
    if (!style && a[0]) { const f = a[0].toLowerCase(); if (K2.LOGO_STYLES[ALIAS[f] || f]) { style = ALIAS[f] || f; a.shift() } }
    style = ALIAS[style] || style
    const t = (a.join(' ') || (m.quoted && m.quoted.text) || '').replace(/[\u{13000}-\u{1342F}]/gu, '').trim().slice(0, 40)
    if (!t || !K2.LOGO_STYLES[style || 'neon']) {
      return reply(`🔥 *LOGO TEKS*\n\n> Format: ${prefix}logo <gaya> <teks>\n\n${Object.entries(K2.LOGO_STYLES).map(([k, d]) => `> *${k}* — ${d}`).join('\n')}\n\n*Contoh:*\n> ${prefix}logo neon Chisa AI\n> ${prefix}logoemas Toko Berkah`)
    }
    try {
      await sock.sendMessage(m.chat, { image: await K2.logoText(t, style || 'neon'), caption: `🔥 Logo *${style || 'neon'}*` }, { quoted: m })
    } catch (e) { console.log('[logo]', e.message); reply('❌ Gagal membuat gambar: ' + e.message) }
  },
}
