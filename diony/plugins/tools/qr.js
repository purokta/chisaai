/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .qr <teks atau tautan> — buat gambar kode QR. Memakai paket "qrcode" (npm install); bila belum terpasang,
// otomatis memakai layanan api.qrserver.com sebagai cadangan.
const axios = require('axios'), ST = require('../../lib/style')

async function makeQR(data) {
  try {
    const QR = require('qrcode')
    return await QR.toBuffer(data, { type: 'png', width: 600, margin: 2, errorCorrectionLevel: 'M' })
  } catch (e) {
    if (e && e.code !== 'MODULE_NOT_FOUND') throw e
    const r = await axios.get('https://api.qrserver.com/v1/create-qr-code/', { params: { size: '600x600', margin: 10, data }, responseType: 'arraybuffer', timeout: 20000 })
    return Buffer.from(r.data)
  }
}

module.exports = {
  name: 'qr', alias: ['qrcode', 'buatqr', 'kodeqr'], category: 'tools', cmds: ['qr'], noLimit: true,
  desc: 'Buat kode QR dari teks atau tautan',
  run: async ({ sock, m, reply, text, prefix }) => {
    const data = String(text || '').trim() || String((m.quoted && m.quoted.text) || '').trim()
    if (!data) return reply(`${ST.B('KODE QR')}\nTulis teks atau tautannya.\nContoh: ${prefix}qr https://whatsapp.com/channel/0029VaXXXXXXXX`)
    if (data.length > 1000) return reply('Teks terlalu panjang untuk QR (maksimal 1000 karakter).')
    try { await sock.sendMessage(m.chat, { image: await makeQR(data), caption: `${ST.B('KODE QR')}\n${ST.cut(data, 120)}` }, { quoted: m }) }
    catch (e) { console.log('[qr]', e.message); reply('Gagal membuat QR: ' + e.message) }
  },
}
