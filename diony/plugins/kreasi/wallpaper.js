/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .wallpaper [tema] — wallpaper HP generatif 1080x2160 (aurora, mesh, geometri, gelembung, gelombang, bintang). Tiap panggilan beda.
const K2 = require('../../lib/kreasi2')

module.exports = {
  name: 'wallpaper', alias: ['wp', 'walpaper', 'latar'], category: 'kreasi', cmds: ['wallpaper'],
  desc: 'Wallpaper HP acak buatan bot: aurora, mesh, geometri, gelembung, gelombang, bintang',
  run: async ({ sock, m, args, prefix, reply }) => {
    const f = String(args[0] || '').toLowerCase(), tema = K2.WP.includes(f) ? f : K2.WP[Math.floor(Math.random() * K2.WP.length)]
    if (f && !K2.WP.includes(f)) return reply(`🖼️ *WALLPAPER*\n\n> Tema: ${K2.WP.join(', ')}\n> Kosongkan untuk tema acak.\n\n*Contoh:* ${prefix}wallpaper aurora`)
    try {
      const buf = await K2.wallpaper(tema, String(Date.now()))
      await sock.sendMessage(m.chat, { document: buf, mimetype: 'image/png', fileName: `wallpaper-${tema}.png`, caption: `🖼️ Wallpaper *${tema}* (dikirim sebagai dokumen agar tetap tajam)` }, { quoted: m })
    } catch (e) { console.log('[wallpaper]', e.message); reply('❌ Gagal membuat gambar: ' + e.message) }
  },
}
