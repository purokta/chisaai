const fs = require('fs')
const http = require('../lib/http')
const sticker = require('../lib/sticker')
const reminders = require('../lib/reminders')
const { tmpPath, run, rm } = require('../lib/ffmpeg')

const LANGS = new Set('id en ja ko zh ar es fr de ru pt it nl tr th vi hi ms su jw'.split(' '))

async function mediaBuffer(ctx, types) {
  const t = ctx.mediaTarget()
  if (!t || !types.includes(t.type)) return null
  return { t, buffer: await ctx.download(t.node, t.type) }
}

async function ffconv(buffer, args, ext) {
  const inp = tmpPath('bin'), out = tmpPath(ext)
  fs.writeFileSync(inp, buffer)
  try {
    await run('ffmpeg', ['-y', '-i', inp, ...args, out])
    return fs.readFileSync(out)
  } catch (e) {
    if (/does not contain any stream|matches no streams/.test(e.stderr || '')) {
      const err = new Error('Media ini tidak punya suara.')
      err.userMessage = err.message
      throw err
    }
    throw e
  } finally {
    rm(inp, out)
  }
}

module.exports = [
  {
    name: 'calc',
    aliases: ['hitung', 'kalkulator'],
    category: 'Alat',
    usage: '<hitungan>',
    desc: 'Kalkulator (mis. calc 12*(3+4))',
    async run(ctx) {
      const ex = ctx.query.replace(/,/g, '.').replace(/x/gi, '*').replace(/\^/g, '**').replace(/÷/g, '/')
      if (!ex || !/^[0-9+\-*/().%\s]+$/.test(ex) || ex.length > 100) return ctx.reply(`Contoh: ${ctx.prefix}calc 12*(3+4)`)
      let v
      try { v = Function('"use strict";return (' + ex + ')')() } catch { v = NaN }
      if (typeof v !== 'number' || !isFinite(v)) return ctx.reply('Hitungan tidak valid.')
      await ctx.reply(`🧮 ${ex} = *${Math.round(v * 1e10) / 1e10}*`)
    }
  },
  {
    name: 'tr',
    aliases: ['translate', 'terjemah'],
    category: 'Alat',
    usage: '[bahasa] <teks>',
    desc: 'Terjemah (tr en halo) — default ke Indonesia',
    async run(ctx) {
      let lang = 'id', text = ctx.query
      if (LANGS.has((ctx.args[0] || '').toLowerCase()) && ctx.args.length > 1) {
        lang = ctx.args[0].toLowerCase()
        text = ctx.text.slice(ctx.args[0].length).trim()
      } else if (LANGS.has((ctx.args[0] || '').toLowerCase()) && ctx.args.length === 1) {
        lang = ctx.args[0].toLowerCase()
        text = require('../lib/message').getQuotedText(ctx.m.message)
      }
      if (!text) return ctx.reply(`Contoh: ${ctx.prefix}tr en selamat pagi\nBahasa: ${[...LANGS].join(', ')}`)
      const r = await http.getJson(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text.slice(0, 1500))}`
      )
      const out = (r[0] || []).map(x => x[0]).join('')
      await ctx.reply(`🌐 (${r[2] || '?'} → ${lang})\n\n${out}`)
    }
  },
  {
    name: 'qr',
    category: 'Alat',
    usage: '<teks/link>',
    desc: 'Buat kode QR',
    async run(ctx) {
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}qr https://tiktok.com/@dzzhipur`)
      const { buffer } = await http.getBuffer('https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=' + encodeURIComponent(ctx.query))
      await ctx.send({ image: buffer, caption: '✅ QR siap' })
    }
  },
  {
    name: 'ssweb',
    aliases: ['screenshot'],
    category: 'Alat',
    usage: '<link>',
    desc: 'Screenshot halaman web',
    async run(ctx) {
      const u = (ctx.query.match(/https?:\/\/\S+/) || [])[0] || (ctx.query ? 'https://' + ctx.query : '')
      if (!u) return ctx.reply(`Contoh: ${ctx.prefix}ssweb https://example.com`)
      const { buffer } = await http.getBuffer('https://image.thum.io/get/width/1280/crop/900/' + u, { timeout: 60000 })
      await ctx.send({ image: buffer, caption: u })
    }
  },
  {
    name: 'tourl',
    aliases: ['upload'],
    category: 'Alat',
    desc: 'Upload gambar/video/audio jadi link (reply/kirim medianya)',
    async run(ctx) {
      const r = await mediaBuffer(ctx, ['image', 'video', 'audio', 'sticker'])
      if (!r) return ctx.reply('Kirim atau reply media (gambar/video/audio) dengan perintah ini.')
      const ext = { image: 'jpg', video: 'mp4', audio: 'mp3', sticker: 'webp' }[r.t.type]
      const fd = new FormData()
      fd.append('reqtype', 'fileupload')
      fd.append('fileToUpload', new Blob([r.buffer]), 'file.' + ext)
      const res = await http.request('https://catbox.moe/user/api.php', { method: 'POST', body: fd, timeout: 90000 })
      const url = (await res.text()).trim()
      if (!/^https?:\/\//.test(url)) throw new Error('Upload gagal (server menolak)')
      await ctx.reply('🔗 ' + url)
    }
  },
  {
    name: 'ocr',
    aliases: ['totext'],
    category: 'Alat',
    desc: 'Baca teks dari gambar (reply/kirim gambar)',
    async run(ctx) {
      const r = await mediaBuffer(ctx, ['image'])
      if (!r) return ctx.reply('Kirim atau reply gambar dengan perintah ini.')
      const fd = new FormData()
      fd.append('apikey', ctx.config.ocr?.apiKey || 'helloworld')
      fd.append('language', 'eng')
      fd.append('base64Image', 'data:image/jpeg;base64,' + r.buffer.toString('base64'))
      const res = await http.request('https://api.ocr.space/parse/image', { method: 'POST', body: fd, timeout: 60000 })
      const j = await res.json()
      const text = (j.ParsedResults || []).map(x => x.ParsedText).join('\n').trim()
      if (!text) return ctx.reply('Teks tidak terbaca.')
      await ctx.reply('📝 ' + text.slice(0, 3500))
    }
  },
  {
    name: 'tomp3',
    category: 'Alat',
    desc: 'Video/audio jadi MP3 (reply/kirim medianya)',
    async run(ctx) {
      const r = await mediaBuffer(ctx, ['video', 'audio'])
      if (!r) return ctx.reply('Kirim atau reply video/audio dengan perintah ini.')
      const out = await ffconv(r.buffer, ['-vn', '-c:a', 'libmp3lame', '-b:a', '128k'], 'mp3')
      await ctx.send({ audio: out, mimetype: 'audio/mpeg' })
    }
  },
  {
    name: 'tovn',
    category: 'Alat',
    desc: 'Video/audio jadi voice note (reply/kirim medianya)',
    async run(ctx) {
      const r = await mediaBuffer(ctx, ['video', 'audio'])
      if (!r) return ctx.reply('Kirim atau reply video/audio dengan perintah ini.')
      const out = await ffconv(r.buffer, ['-vn', '-c:a', 'libopus', '-b:a', '48k', '-ac', '1'], 'ogg')
      await ctx.send({ audio: out, mimetype: 'audio/ogg; codecs=opus', ptt: true })
    }
  },
  {
    name: 'take',
    aliases: ['wm'],
    category: 'Stiker',
    usage: '[pack|author]',
    desc: 'Ganti nama pack stiker (reply stikernya)',
    async run(ctx) {
      const r = await mediaBuffer(ctx, ['sticker'])
      if (!r) return ctx.reply(`Reply stiker dengan ${ctx.prefix}take nama pack|author`)
      const [pack, author] = ctx.text.split('|').map(s => s.trim())
      const out = sticker.addExif(r.buffer, { pack: pack || ctx.pushName || ctx.config.sticker.pack, author: author || ctx.config.sticker.author })
      await ctx.send({ sticker: out })
    }
  },
  {
    name: 'ingatkan',
    aliases: ['remind', 'timer'],
    category: 'Alat',
    usage: '<10m> <pesan>',
    desc: 'Pengingat (s/m/j/hari, mis. ingatkan 10m minum)',
    async run(ctx) {
      const ms = reminders.parseDuration(ctx.args[0])
      const text = ctx.text.slice((ctx.args[0] || '').length).trim() || 'Waktunya!'
      if (!ms || ms < 5000 || ms > 30 * 86400000) return ctx.reply(`Contoh: ${ctx.prefix}ingatkan 10m minum obat\nSatuan: s (detik), m (menit), j (jam), hari`)
      reminders.add({ jid: ctx.jid, who: ctx.sender, at: Date.now() + ms, text })
      await ctx.reply(`✅ Oke, aku ingatkan ${ctx.args[0]} lagi.`)
    }
  }
]
