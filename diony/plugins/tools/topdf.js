/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .topdf — foto jadi PDF, atau teks jadi PDF (reply foto / reply teks / .topdf <judul> | <isi>)
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib'), PDF = require('../../lib/pdfmini')
const sharp = (() => { try { return require('sharp') } catch { return null } })()

module.exports = {
  name: 'topdf', alias: ['pdf', 'jadipdf', 'fotokepdf', 'tekskepdf'], category: 'tools', cmds: ['topdf'],
  desc: 'Ubah foto atau teks menjadi file PDF (reply foto / reply teks / .topdf Judul | isi)',
  run: async ({ sock, m, text, prefix, reply }) => {
    try {
      const media = AJ.pickNode(m, ['image'])
      if (media) {
        if (!sharp) return reply('Modul sharp belum terpasang (jalankan: npm install).')
        const src = await AJ.download(media)
        const { data, info } = await sharp(src).rotate().resize({ width: 2000, height: 2800, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true })
        const pdf = PDF.build([{ jpeg: data, w: info.width, h: info.height }])
        return sock.sendMessage(m.chat, { document: pdf, mimetype: 'application/pdf', fileName: 'foto.pdf', caption: B('FOTO KE PDF') }, { quoted: m })
      }
      let title = '', body = (text || '').trim()
      if (body.includes('|')) { const i = body.indexOf('|'); title = body.slice(0, i).trim(); body = body.slice(i + 1).trim() }
      if (!body) body = (m.quoted && (m.quoted.text || m.quoted.caption) || '').trim()
      if (!body) return reply(`${B('KE PDF')}\n${prefix}topdf   (reply / kirim foto)\n${prefix}topdf   (reply sebuah teks)\n${prefix}topdf Judul | isi dokumen`)
      if (body.length > 30000) return reply('✕ Teks maksimal 30.000 karakter.')
      const pdf = PDF.build([{ text: body, title: title.slice(0, 80) }])
      const name = (title || 'dokumen').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'dokumen'
      return sock.sendMessage(m.chat, { document: pdf, mimetype: 'application/pdf', fileName: name + '.pdf', caption: B('TEKS KE PDF') }, { quoted: m })
    } catch (e) { console.log('[topdf]', e.message); return reply('✕ Gagal membuat PDF: ' + e.message) }
  },
}
