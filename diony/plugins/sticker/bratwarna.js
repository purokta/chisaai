/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .bratwarna [warna[/warnateks]] <teks> — brat dengan warna bebas (lokal, tanpa API). Varian bergerak: .bratwarnavid
//   Contoh: .bratwarna pink halo | .bratwarna #222222/kuning halo | .bratpink halo | .bratdark halo | .bratwarnavid ungu halo semua
const L = require('../../lib/stickerlib'), K2 = require('../../lib/kreasi2')
const { renderVideo } = require('../../lib/bratlib')
const PRESET = { bratpink: 'pink', bratbiru: 'birulangit', bratungu: 'lavender', bratmerah: 'merah', bratkuning: 'kuning', bratoren: 'oranye', bratmint: 'mint', bratdark: 'hitam/putih', bratcoklat: 'coklat/krem', bratkrem: 'krem/coklat' }

module.exports = {
  name: 'bratwarna', alias: ['bratwarnavid', ...Object.keys(PRESET)], category: 'sticker', cmds: ['bratwarna', 'bratwarnavid', 'bratpink', 'bratdark'],
  desc: 'Stiker brat dengan warna latar bebas (nama warna atau hex), diam atau bergerak',
  run: async ({ sock, m, text, command, prefix, reply }) => {
    let t = String(text || (m.quoted && m.quoted.text) || '').trim(), spec = PRESET[command] || ''
    if (!spec) {
      const first = t.split(/\s+/)[0] || '', [a] = first.split('/')
      if (K2.parseColor(a)) { spec = first; t = t.slice(first.length).trim() }
    }
    if (!t) return reply(`🎨 *BRAT WARNA*\n\n> Format: ${prefix}bratwarna <warna> <teks>\n> Warna teks juga bisa: <latar>/<teks>\n> Bergerak: ${prefix}bratwarnavid <warna> <teks>\n> Pintasan: ${prefix}bratpink  ${prefix}bratdark  ${prefix}bratbiru  ${prefix}bratungu  ${prefix}bratmerah  ${prefix}bratkuning  ${prefix}bratoren  ${prefix}bratmint\n\n*Contoh:*\n> ${prefix}bratwarna pink Halo semua\n> ${prefix}bratwarna #222222/kuning Halo\n> ${prefix}bratwarnavid ungu Halo semua\n\n_Warna: merah biru hijau kuning oranye ungu pink coklat hitam putih tosca emas krem marun lavender mint salmon peach dan kode hex._`)
    const [bgName, fgName] = (spec || '').split('/')
    const bg = K2.parseColor(bgName) || '#16161C', fg = K2.parseColor(fgName) || null
    L.react(sock, m, '🕕')
    try {
      if (command === 'bratwarnavid') await L.sendVideoAsSticker(sock, m, await renderVideo(t, (x) => K2.bratColor(x, bg, fg)))
      else await L.sendImageAsSticker(sock, m, await K2.bratColor(t, bg, fg))
      L.react(sock, m, '✅')
    } catch (e) { console.log('[bratwarna]', e.message); L.react(sock, m, '❌'); reply(`❌ *Gagal membuat stiker*\n\n> ${e.message}`) }
  },
}
