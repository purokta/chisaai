/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Cek penyedia AI mana yang hidup (khusus owner)
const ai = require('../../lib/ai')
const kimi = require('../../lib/kimi')
module.exports = {
  name: 'aistatus', alias: ['cekai', 'aitest'], category: 'ai', cmds: [], owner: true, desc: 'Tes koneksi Groq/Gemini/Kimi + model yang dipakai',
  run: async ({ reply }) => {
    await reply('Menguji penyedia AI...')
    const rows = [...await ai.status(), ...await kimi.status()]
    if (!rows.length) return reply('Belum ada API key AI di config.js (apikey.groq / google / gemini / kimi).')
    reply('*STATUS AI*\n\n' + rows.map(r => r.ok ? `[OK] ${r.name} - ${r.model} (${r.ms} ms)` : `[GAGAL] ${r.name} - ${r.err}`).join('\n') + '\n\n_Atur: .set aiprovider auto|groq|gemini  |  .set aipersona yandere|ramah|santai|formal|otaku_')
  },
}
