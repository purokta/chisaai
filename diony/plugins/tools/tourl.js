/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tourl — ubah media (foto, video, audio, dokumen, stiker) jadi tautan publik.
//   Kirim / reply media dengan .tourl. Tanpa API key. Layanan dicoba berurutan sampai ada yang berhasil:
//   catbox.moe (permanen) → uguu.se (sementara) → tmpfiles.org (sementara) → 0x0.st
// Catatan: siapa pun yang punya tautan bisa membuka file. Jangan unggah data pribadi.
const axios = require('axios'), FormData = require('form-data')
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib')

const MAX = 50 * 1024 * 1024, COOLDOWN = 10000
const last = new Map()
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'application/pdf': 'pdf', 'application/zip': 'zip' }
const size = (b) => b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B'
const UA = 'Mozilla/5.0 (compatible; ChisaBot/4.11)'

const form = (field, buf, name, mime, extra = {}) => { const f = new FormData(); for (const [k, v] of Object.entries(extra)) f.append(k, v); f.append(field, buf, { filename: name, contentType: mime }); return f }
const post = (url, f, extra = {}) => axios.post(url, f, { headers: { ...f.getHeaders(), 'User-Agent': UA }, maxBodyLength: MAX + 1024 * 1024, maxContentLength: 1024 * 1024, timeout: 120000, ...extra })

// tiap layanan: { name, note, up(buf,name,mime) → url }
const HOSTS = [
  { name: 'catbox.moe', note: 'permanen', up: async (b, n, mt) => { const r = await post('https://catbox.moe/user/api.php', form('fileToUpload', b, n, mt, { reqtype: 'fileupload' }), { responseType: 'text' }); const u = String(r.data || '').trim(); if (!/^https?:\/\//.test(u)) throw new Error(u.slice(0, 80) || 'respons kosong'); return u } },
  { name: 'uguu.se', note: 'sementara', up: async (b, n, mt) => { const r = await post('https://uguu.se/upload', form('files[]', b, n, mt)); const u = r.data && r.data.files && r.data.files[0] && r.data.files[0].url; if (!u) throw new Error('respons tidak berisi url'); return u } },
  { name: 'tmpfiles.org', note: 'sementara', up: async (b, n, mt) => { const r = await post('https://tmpfiles.org/api/v1/upload', form('file', b, n, mt)); const u = r.data && r.data.data && r.data.data.url; if (!u) throw new Error('respons tidak berisi url'); return String(u).replace(/^http:/, 'https:').replace('tmpfiles.org/', 'tmpfiles.org/dl/') } },
  { name: '0x0.st', note: 'sementara', up: async (b, n, mt) => { const r = await post('https://0x0.st', form('file', b, n, mt), { responseType: 'text' }); const u = String(r.data || '').trim(); if (!/^https?:\/\//.test(u)) throw new Error(u.slice(0, 80) || 'respons kosong'); return u } },
]

module.exports = {
  name: 'tourl', alias: ['upload', 'jadiurl', 'tolink', 'mediaurl'], category: 'tools', cmds: ['tourl'], noLimit: false,
  desc: 'Ubah foto / video / audio / dokumen / stiker jadi tautan publik (catbox, uguu, tmpfiles, 0x0)',
  HOSTS,
  run: async ({ sock, m, prefix, reply }) => {
    const media = AJ.pickNode(m, ['image', 'video', 'audio', 'document', 'sticker'])
    if (!media) return reply(`${B('TO URL')}\nKirim atau reply media dengan ${prefix || '.'}tourl\nBisa foto, video, audio, dokumen, atau stiker (maks ${size(MAX)}).\n\n_Tautan bersifat publik — jangan unggah data pribadi._`)
    const declared = Number(media.node.fileLength || 0)
    if (declared > MAX) return reply(`✕ Ukuran ${size(declared)} melebihi batas ${size(MAX)}.`)
    const now = Date.now(), prev = last.get(m.sender) || 0
    if (now - prev < COOLDOWN) return reply(`⏳ Tunggu ${Math.ceil((COOLDOWN - (now - prev)) / 1000)} detik lagi.`)
    last.set(m.sender, now)
    sock.sendMessage(m.chat, { react: { text: '🕕', key: m.key } }).catch(() => {})
    try {
      const buf = await AJ.download(media)
      if (!buf || !buf.length) throw new Error('media gagal diunduh dari WhatsApp')
      if (buf.length > MAX) return reply(`✕ Ukuran ${size(buf.length)} melebihi batas ${size(MAX)}.`)
      const mime = String(media.mime || 'application/octet-stream').split(';')[0].trim()
      let name = String(media.node.fileName || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 80)
      if (!name) name = `chisa_${Date.now()}.${EXT[mime] || mime.split('/')[1] || 'bin'}`
      const errs = []
      for (const h of HOSTS) {
        try {
          const url = await h.up(buf, name, mime)
          sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
          return reply([B('TO URL'), `${url}`, '', `Nama   : ${name}`, `Ukuran : ${size(buf.length)}`, `Layanan: ${h.name} (${h.note})`].join('\n'))
        } catch (e) { errs.push(`${h.name}: ${e.message}`); console.log('[tourl]', h.name, e.message) }
      }
      sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {})
      return reply(`✕ Semua layanan unggah gagal. Coba lagi nanti.\n_${errs.map(x => x.slice(0, 60)).join('\n')}_`)
    } catch (e) {
      console.log('[tourl]', e.message)
      sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {})
      return reply('✕ Gagal memproses media: ' + e.message)
    }
  },
}
