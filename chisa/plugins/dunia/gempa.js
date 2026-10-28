/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .gempa — gempa terkini dari BMKG (data resmi, gratis).  .gempa dirasakan = daftar gempa yang dirasakan
const axios = require('axios'), { B } = require('../../lib/style')
const BASE = 'https://data.bmkg.go.id/DataMKG/TEWS/'
const LINE = '━━━━━━━━━━━━━━━━━━━━'
module.exports = {
  name: 'infogempa', alias: ['infogempa', 'bmkg', 'gempaterkini'], category: 'dunia', cmds: [], noLimit: false,
  desc: 'Info gempa terbaru BMKG (.gempa, .gempa dirasakan, .gempa m5)',
  run: async ({ sock, m, text, prefix, reply }) => {
    const q = String(text || '').trim().toLowerCase()
    try {
      if (q === 'dirasakan' || q === 'rasa') {
        const { data } = await axios.get(BASE + 'gempadirasakan.json', { timeout: 15000 }), l = (data.Infogempa.gempa || []).slice(0, 8)
        return reply(`${B('GEMPA DIRASAKAN')}\n${LINE}\n${l.map((g, i) => `${i + 1}. M${g.Magnitude} • ${g.Tanggal} ${g.Jam}\n   ${g.Wilayah}\n   Kedalaman ${g.Kedalaman}`).join('\n')}\n\n_Sumber: BMKG_`)
      }
      if (/^m?5/.test(q) || q === 'm5' || q === 'besar') {
        const { data } = await axios.get(BASE + 'gempaterkini.json', { timeout: 15000 }), l = (data.Infogempa.gempa || []).slice(0, 15)
        return reply(`${B('GEMPA M5.0+ TERKINI')}\n${LINE}\n${l.map((g, i) => `${i + 1}. M${g.Magnitude} • ${g.Tanggal} ${g.Jam}\n   ${g.Wilayah}`).join('\n')}\n\n_Sumber: BMKG_`)
      }
      const { data } = await axios.get(BASE + 'autogempa.json', { timeout: 15000 }), g = data.Infogempa.gempa
      const cap = [B('GEMPA TERBARU'), LINE, `Waktu     : ${g.Tanggal}, ${g.Jam}`, `Magnitudo : M${g.Magnitude}`, `Kedalaman : ${g.Kedalaman}`, `Lokasi    : ${g.Lintang}, ${g.Bujur}`, `Wilayah   : ${g.Wilayah}`, `Dirasakan : ${g.Dirasakan || '-'}`, `Potensi   : ${g.Potensi || '-'}`, '', `_Lainnya: ${prefix}gempa dirasakan • ${prefix}gempa m5 • Sumber: BMKG_`].join('\n')
      if (g.Shakemap) { try { return await sock.sendMessage(m.chat, { image: { url: 'https://static.bmkg.go.id/' + g.Shakemap }, caption: cap }, { quoted: m }) } catch {} }
      return reply(cap)
    } catch (e) { console.log('[gempa]', e.message); return reply('Gagal mengambil data BMKG: ' + e.message) }
  },
}
