/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .berita [kategori] — 8 berita terbaru dari RSS Antara News (gratis, tanpa key).
// Kategori: terkini (bawaan), politik, ekonomi, hukum, olahraga, teknologi, dunia, hiburan, lifestyle, otomotif
const axios = require('axios'), { B } = require('../../lib/style')
const FEED = { terkini: 'terkini', politik: 'politik', ekonomi: 'ekonomi', hukum: 'hukum', olahraga: 'olahraga', teknologi: 'tekno', tekno: 'tekno', dunia: 'dunia', hiburan: 'hiburan', lifestyle: 'lifestyle', otomotif: 'otomotif', bola: 'bola' }
const dec = (s) => String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/<[^>]+>/g, '').trim()
function parseRss(xml, n = 8) {
  return [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, n).map(([, it]) => {
    const g = (t) => { const r = it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return r ? dec(r[1]) : '' }
    return { title: g('title'), link: g('link'), date: g('pubDate') }
  }).filter(x => x.title && x.link)
}
const ago = (d) => { const t = Date.parse(d); if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'baru saja' : m < 60 ? `${m} menit lalu` : m < 1440 ? `${Math.round(m / 60)} jam lalu` : `${Math.round(m / 1440)} hari lalu` }
module.exports = {
  name: 'berita', alias: ['news', 'beritaterkini', 'headline'], category: 'dunia', cmds: ['berita'], noLimit: false,
  desc: 'Berita terbaru Antara: .berita [politik|ekonomi|hukum|olahraga|teknologi|dunia|hiburan|otomotif]',
  run: async ({ text, prefix, reply }) => {
    const k = String(text || 'terkini').trim().toLowerCase()
    if (!FEED[k]) return reply(`Kategori tidak dikenal.\nPilih: ${Object.keys(FEED).filter(x => x !== 'tekno').join(', ')}\nContoh: ${prefix}berita ekonomi`)
    try {
      const { data } = await axios.get(`https://www.antaranews.com/rss/${FEED[k]}.xml`, { timeout: 15000, responseType: 'text', headers: { 'User-Agent': 'Mozilla/5.0' } })
      const items = parseRss(data); if (!items.length) return reply('Tidak ada berita yang terbaca saat ini.')
      return reply(`${B('BERITA ' + k.toUpperCase())}\n━━━━━━━━━━━━━━━━━━━━\n` + items.map((x, i) => `${i + 1}. *${x.title}*\n   ${ago(x.date)}\n   ${x.link}`).join('\n\n') + '\n\n_Sumber: Antara News_')
    } catch (e) { console.log('[berita]', e.message); return reply('Gagal mengambil berita: ' + e.message) }
  },
}
module.exports._t = { parseRss }
