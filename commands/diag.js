// #diag — tes cepat langsung di perangkat: ffmpeg/voice note, YouTube (play), jaringan, kecepatan kirim WhatsApp.
const fs = require('fs')
const path = require('path')
const os = require('os')

const ms = t => Date.now() - t
async function step(name, fn, out) {
  const t = Date.now()
  try { const r = await fn(); out.push(`✅ ${name} (${ms(t)} ms)${r ? ' — ' + String(r).slice(0, 120) : ''}`) }
  catch (e) { out.push(`❌ ${name}: ${String(e?.message || e).split('\n')[0].slice(0, 160)}`) }
}
const lib = n => { try { return require(n) } catch { return null } }

module.exports = [{
  name: 'diag',
  aliases: ['diagnosa', 'cekbot'],
  category: 'Owner',
  ownerOnly: true,
  desc: 'Diagnosa ffmpeg, voice note, YouTube/play, jaringan & kecepatan kirim',
  async run(ctx) {
    const t0 = Date.now()
    await ctx.reply('🔎 Diagnosa berjalan (±30 detik)…')
    const sendMs = ms(t0) // waktu kirim satu pesan WhatsApp/Telegram
    const out = [`🩺 *DIAGNOSA CHISA-AI*`, `Node ${process.version} • ${process.env.CHISA_ANDROID ? 'Android' : os.platform()} • RAM bebas ${Math.round(os.freemem() / 1048576)} MB`, `Kirim 1 pesan: ${sendMs} ms ${sendMs > 2500 ? '⚠️ lambat (jaringan/baterai?)' : ''}`]
    // lag event loop
    const lag = await new Promise(r => { const t = Date.now(); setTimeout(() => r(ms(t)), 0) })
    out.push(`Event-loop lag: ${lag} ms`)

    const { run, TMP } = require('../lib/ffmpeg')
    await step('ffmpeg -version', async () => (await run('ffmpeg', ['-version'], { timeout: 15000 })).stdout.split('\n')[0], out)
    const ogg = path.join(TMP, 'diag-' + Date.now() + '.ogg')
    await step('voice note (opus)', async () => {
      await run('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-c:a', 'libopus', '-b:a', '32k', ogg], { timeout: 30000 })
      return fs.statSync(ogg).size + ' byte'
    }, out)
    try { fs.rmSync(ogg, { force: true }) } catch {}
    await step('musik menu → voice note', async () => { const a = require('../lib/assets'), m = a.music(); if (!m) throw new Error('tidak ada musik'); return (await a.voiceNote(m)).length + ' byte' }, out)

    const http = require('../lib/http')
    for (const [n, u] of [['jaringan YouTube', 'https://www.youtube.com/generate_204'], ['jaringan Google', 'https://www.google.com/generate_204'], ['jaringan WhatsApp', 'https://web.whatsapp.com/'], ['jaringan Telegram', 'https://api.telegram.org/']])
      await step(n, async () => { await http.request(u, { timeout: 8000 }) }, out)

    const J = require('../lib/jsdl')
    out.push(`Library: ytdl-core ${lib('@distube/ytdl-core') ? 'ada' : 'TIDAK ADA'} • youtubei.js ${(() => { try { require.resolve('youtubei.js'); return 'ada' } catch { return 'TIDAK ADA' } })()} • btch ${lib('btch-downloader') ? 'ada' : 'TIDAK ADA'}`)
    await step('YouTube: info (ytdl-core)', async () => { const y = lib('@distube/ytdl-core') || lib('ytdl-core'); if (!y) throw new Error('tidak terpasang'); const i = await y.getInfo('https://www.youtube.com/watch?v=jNQXAC9IVRw'); return i.videoDetails.title }, out)
    await step('YouTube: unduh audio (semua jalur)', async () => {
      const dir = fs.mkdtempSync(path.join(TMP, 'diag-'))
      try { const r = await J.youtubeAny('https://www.youtube.com/watch?v=jNQXAC9IVRw', 'audio', dir); return fs.statSync(r.file).size + ' byte' }
      finally { try { fs.rmSync(dir, { recursive: true, force: true }) } catch {} }
    }, out)
    await step('Cari YouTube', async () => { const r = await require('../chisa/lib/ytfallback').search('lofi', 2); if (!r.length) throw new Error('kosong'); return r[0].title }, out)
    out.push(`\nTotal ${Math.round(ms(t0) / 1000)} detik. Kirim hasil ini ke pengembang bila ada ❌.`)
    await ctx.reply(out.join('\n'))
  }
}]
