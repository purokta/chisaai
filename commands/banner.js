// #setbanner — ganti banner menu bot dari link YouTube (klip maks 10 detik). Khusus owner, tersembunyi.
const fs = require('fs')
const path = require('path')
const { run, TMP } = require('../lib/ffmpeg')

const CUSTOM = path.join(__dirname, '..', 'assets', 'custom')
const EXTS = ['mp4', 'jpg', 'jpeg', 'png', 'webp']
const clear = (n) => { for (const e of EXTS) try { fs.unlinkSync(path.join(CUSTOM, `banner${n}.${e}`)) } catch {} }

module.exports = [{
  name: 'setbanner',
  aliases: ['gantibanner', 'bannerset'],
  category: 'Owner',
  hidden: true,
  ownerOnly: true,
  usage: '<slot 1-4> <link youtube> [mulai detik] [durasi detik, maks 10]  |  <slot> reset',
  desc: 'Ganti banner menu bot dari klip YouTube (atau reset ke bawaan)',
  async run(ctx) {
    const [slotRaw, link, startRaw, durRaw] = ctx.args
    const slot = Number(slotRaw)
    if (!(slot >= 1 && slot <= 4)) return ctx.reply(`Contoh:\n${ctx.prefix}setbanner 1 https://youtu.be/xxxx 30 8\n${ctx.prefix}setbanner 1 reset\n(slot 1-4, mulai detik ke-30, durasi 8 detik, maks 10)`)
    fs.mkdirSync(CUSTOM, { recursive: true })
    if (/^(reset|hapus|default)$/i.test(link || '')) { clear(slot); return ctx.reply(`✅ Banner ${slot} dikembalikan ke bawaan.`) }
    if (!/^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(link || '')) return ctx.reply('Kirim link YouTube yang valid.')
    const start = Math.max(0, Math.min(36000, Number(startRaw) || 0))
    const dur = Math.max(2, Math.min(10, Number(durRaw) || 8))
    await ctx.reply(`⏳ Mengunduh klip YouTube untuk banner ${slot}…`)
    const Y = require('../chisa/lib/ytdlp')
    const dir = Y.tmpDir()
    try {
      const r = await Y.fetchMedia(link, { kind: 'video', dir })
      const src = r.items[0].file
      const out = path.join(TMP, `banner-${slot}-${Date.now()}.mp4`)
      await run('ffmpeg', ['-y', '-ss', String(start), '-i', src, '-t', String(dur), '-an', '-vf', 'scale=480:-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { timeout: 180000 })
      if (!fs.existsSync(out) || fs.statSync(out).size < 5000) throw new Error('hasil klip kosong (mulai detik melewati panjang video?)')
      clear(slot)
      fs.copyFileSync(out, path.join(CUSTOM, `banner${slot}.mp4`))
      fs.unlinkSync(out)
      await ctx.reply(`✅ Banner ${slot} diganti (klip ${dur} detik mulai detik ke-${start}). Ketik menu untuk melihat.`)
    } catch (e) {
      const m = String(e.message || e)
      // ffmpeg tidak bisa jalan di Android (diblokir sistem): pakai video pendek apa adanya, tanpa dipotong
      if (/ENOENT|EACCES|SIGSYS|Command failed|ffmpeg/i.test(m)) {
        try {
          const J = require('../lib/jsdl')
          const d2 = Y.tmpDir()
          try {
            const r = await J.youtubeAny(link, 'video', d2, { maxHeight: 360, quality: '360p', maxMB: 12, maxDurationMin: 3 })
            clear(slot)
            fs.copyFileSync(r.file, path.join(CUSTOM, `banner${slot}.mp4`))
            return await ctx.reply(`✅ Banner ${slot} diganti (video dipakai utuh karena ffmpeg tidak tersedia; pilih video pendek ≤ 3 menit agar ringan). Ketik menu untuk melihat.`)
          } finally { Y.cleanup(d2) }
        } catch (e2) { return ctx.reply('❌ Gagal membuat banner: ' + String(e2?.userMessage || e2?.message || e2).split('\n')[0].slice(0, 200)) }
      }
      await ctx.reply('❌ Gagal membuat banner: ' + (/ENOENT|EACCES/.test(m) ? 'ffmpeg tidak tersedia di perangkat ini.' : m.split('\n')[0].slice(0, 200)))
    } finally { Y.cleanup(dir) }
  }
}]
