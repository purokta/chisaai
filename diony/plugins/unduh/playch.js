/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .playch — kirim musik / video / foto ke SALURAN (channel) WhatsApp lewat tautan salurannya.
//   .playch <link saluran> <judul|tautan>            musik (mp3), default
//   .playch <link saluran> video <judul|tautan>      video (mp4)
//   .playch <link saluran> foto <kata kunci>         gambar hasil pencarian
//   reply foto/video/audio + .playch <link saluran> [caption]   teruskan media itu ke saluran
// Syarat: akun bot adalah admin / pemilik saluran tersebut. Khusus owner & premium.
const fs = require('fs')
const Y = require('../../lib/ytdlp'), D = require('../../lib/downloader'), ST = require('../../lib/style')
const MP = require('../../lib/mediapick'), { imageSearch } = require('../../lib/imgsearch')

const CH = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9_-]{10,})/i
const KIND = { audio: 'audio', lagu: 'audio', musik: 'audio', mp3: 'audio', video: 'video', vid: 'video', mp4: 'video', foto: 'image', gambar: 'image', img: 'image', image: 'image' }
const isUrl = (s) => /^https?:\/\//i.test(String(s || '').trim())

async function channelOf(sock, code) {
  const meta = await sock.newsletterMetadata('invite', code)
  if (!meta || !meta.id) throw new Error('saluran tidak ditemukan')
  return { id: meta.id, name: (meta.name && (meta.name.text || meta.name)) || meta.name || 'saluran' }
}

module.exports = {
  name: 'playch', alias: ['playchannel', 'playsaluran', 'kirimch', 'chplay'], category: 'unduh', cmds: ['playch'],
  desc: 'Kirim musik / video / foto ke saluran WhatsApp lewat link saluran',
  noLimit: false,
  run: async ({ sock, m, reply, text, prefix, isCreator, isPremium }) => {
    if (!isCreator && !isPremium) return reply('Fitur ini khusus owner dan premium.')
    const raw = String(text || '')
    const mm = raw.match(CH)
    if (!mm) return reply(`*PLAY SALURAN*\nKirim musik, video, atau foto ke saluran dengan link saluran.\n\n${prefix}playch <link saluran> <judul|tautan>  : musik\n${prefix}playch <link saluran> video <judul|tautan>\n${prefix}playch <link saluran> foto <kata kunci>\nReply foto / video / audio + ${prefix}playch <link saluran> [caption]  : teruskan ke saluran\n\n_Akun bot harus admin / pemilik saluran itu._`)
    let rest = raw.replace(CH, '').trim(), kind = null
    const w = rest.split(/\s+/)[0].toLowerCase()
    if (KIND[w]) { kind = KIND[w]; rest = rest.slice(w.length).trim() }
    const media = MP.pick(m)
    if (!rest && !media) return reply('Tulis judul / tautan lagunya, atau reply media yang mau dikirim.')
    if (!D.lock(m.sender)) return reply('Proses sebelumnya masih berjalan. Tunggu selesai dulu ya.')
    const dir = Y.tmpDir()
    try {
      let ch
      try { ch = await channelOf(sock, mm[1]) } catch (e) { return reply('Saluran tidak ditemukan. Cek lagi link salurannya.') }
      await reply(`Menyiapkan kiriman untuk saluran *${ch.name}*, mohon tunggu...`)
      const send = (content) => sock.sendMessage(ch.id, content)

      // reply media + tidak minta cari lagu/video/foto → teruskan media itu
      if (media && !kind) {
        const buf = await MP.download(media)
        const cap = rest || undefined
        if (media.kind === 'audio') await send({ audio: buf, mimetype: media.mimetype || 'audio/mpeg', ptt: false })
        else await send({ [media.kind]: buf, mimetype: media.mimetype, ...(cap ? { caption: cap } : {}) })
      } else if ((kind || 'audio') === 'image') {
        const list = await imageSearch(rest, 8); if (!list.length) return reply(`Tidak ada gambar untuk "${rest}".`)
        let ok = false
        for (const g of list) { try { const buf = await D.fetchBuffer([g.image, g.thumb]); await send({ image: buf, caption: ST.cut(g.title || rest, 200) }); ok = true; break } catch {} }
        if (!ok) return reply('Gambar ditemukan tapi gagal diunduh.')
      } else {
        const audio = (kind || 'audio') === 'audio'
        let pick
        const url = D.pickUrl(rest, null)
        if (url) { try { pick = await Y.info(url) } catch { pick = { url, title: '' } } }
        else { const [r] = await Y.search(rest, 1); pick = r }
        if (!pick) return reply(`Tidak ada hasil untuk "${rest}".`)
        const { items } = await Y.fetchMedia(pick.url, { kind: audio ? 'audio' : 'video', dir })
        const it = items[0]
        const title = pick.title || (it.info && it.info.title) || ''
        if (audio) {
          await send({ audio: { url: it.file }, mimetype: 'audio/mpeg', ptt: false })
        } else {
          it.file = await Y.ensureCompat(it.file, it.info.vcodec)
          await send({ video: { url: it.file }, mimetype: 'video/mp4', caption: ST.cut(title, 200) })
        }
      }
      reply(`✅ Terkirim ke saluran *${ch.name}*.`)
    } catch (e) {
      console.log('[playch]', e.message)
      reply('Gagal mengirim ke saluran: ' + e.message + '\n_Pastikan akun bot admin / pemilik saluran itu._')
    } finally { D.unlock(m.sender); Y.cleanup(dir) }
  },
}
