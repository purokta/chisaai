/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .dlstatus — cek mesin unduh (yt-dlp, ffmpeg); .dlupdate — perbarui yt-dlp (khusus owner)
const Y = require('../../lib/ytdlp')
module.exports = {
  name: 'dlstatus', alias: ['dlupdate', 'ytdlpupdate'], category: 'unduh', cmds: [], owner: true,
  desc: 'Cek dan perbarui mesin unduh (yt-dlp)',
  run: async ({ reply, command }) => {
    try {
      if (['dlupdate', 'ytdlpupdate'].includes(command)) { await reply('Memperbarui yt-dlp...'); return reply(`yt-dlp: ${await Y.update()}`) }
      await reply('Memeriksa mesin unduh...')
      const v = await Y.version(), c = Y.cfg()
      reply(`*STATUS MESIN UNDUH*\n\nyt-dlp : ${v.version} (${v.source})\nffmpeg : ${Y.ffmpegPath()}\nKualitas maks : ${c.height}p\nBatas ukuran  : ${c.maxMB} MB (video dikirim sebagai dokumen di atas ${c.videoMaxMB} MB)\nBatas durasi  : ${c.maxDurationMin} menit\nUnduhan paralel : ${c.concurrency}\nCookies : ${c.cookies ? 'ada' : 'tidak ada'}  |  Proxy : ${c.proxy ? 'ada' : 'tidak ada'}\n\n_Perbarui: .dlupdate_`)
    } catch (e) { reply(`Mesin unduh bermasalah.\n> ${e.message}`) }
  },
}
