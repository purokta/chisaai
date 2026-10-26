/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .qrwifi <nama> <sandi> [WPA|WEP] — kode QR untuk tersambung ke WiFi (pindai dengan kamera ponsel).
// (.qr biasa sudah ada di plugins/tools/qr.js)
const { B } = require('../../lib/style')
const esc = (s) => String(s).replace(/([\\;,:"])/g, '\\$1')
async function png(data) {
  try { return await require('qrcode').toBuffer(data, { type: 'png', width: 600, margin: 2, errorCorrectionLevel: 'M' }) } catch (e) {
    if (e && e.code !== 'MODULE_NOT_FOUND') throw e
    const r = await require('axios').get('https://api.qrserver.com/v1/create-qr-code/', { params: { size: '600x600', margin: 10, data }, responseType: 'arraybuffer', timeout: 20000 })
    return Buffer.from(r.data)
  }
}
module.exports = {
  name: 'qrwifi', alias: ['wifiqr', 'qrjaringan'], category: 'ekstra', noLimit: true, cmds: ['qrwifi'],
  desc: 'QR untuk WiFi: .qrwifi <nama_wifi> <sandi> [WPA|WEP] (tanpa sandi = jaringan terbuka)',
  run: async ({ sock, m, args, prefix, reply }) => {
    const ssid = (args[0] || '').replace(/_/g, ' '), pass = args[1], type = (args[2] || (pass ? 'WPA' : 'nopass')).toUpperCase().replace('NOPASS', 'nopass')
    if (!ssid) return reply(`${B('QR WIFI')}\nFormat: ${prefix}qrwifi <nama_wifi> <sandi> [WPA|WEP]\nContoh: ${prefix}qrwifi RumahKu sandi123\n_Nama berspasi: pakai garis bawah (Rumah_Ku). Tanpa sandi: ${prefix}qrwifi TamuWifi_`)
    if (!['WPA', 'WEP', 'nopass'].includes(type)) return reply('✕ Tipe harus WPA atau WEP, atau kosongkan untuk jaringan terbuka.')
    const data = `WIFI:T:${type};S:${esc(ssid)};${type === 'nopass' ? '' : `P:${esc(pass || '')};`};`
    const image = await png(data)
    return sock.sendMessage(m.chat, { image, caption: `✦ *QR WiFi* ${ssid}\n_Arahkan kamera ponsel untuk tersambung._\n_Hapus pesan ini bila sandi bersifat rahasia._` }, { quoted: m })
  },
}
