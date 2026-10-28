/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .play — cari video, musik, dan gambar sekaligus beserta tautannya; unduh audio/video dengan satu tombol
const Y = require('../../lib/ytdlp')
const D = require('../../lib/downloader')
const ui = require('../../lib/menuui')
const ST = require('../../lib/style')
const S = require('../../lib/settingsdb')
const { imageSearch } = require('../../lib/imgsearch')

const SEARCH = ['play', 'ytplay', 'putar', 'cari', 'ytsearch', 'carivideo']
const AUDIO = ['playaudio', 'playmp3', 'lagu', 'musik']
const VIDEO = ['playvideo', 'playvid', 'playmp4']
const IMAGE = ['playimg', 'gambar', 'img', 'image', 'carigambar']
const HR = D.HR, B = D.B
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim()

const bot = () => S.get('botname') || '✦ 𝐂𝐇𝐈𝐒𝐀 𝐀𝐈'
const isUrl = (s) => /^https?:\/\//i.test(String(s || '').trim())
const line = (r) => [r.author, D.dur(r.duration), r.views != null ? `${D.num(r.views)}x ditonton` : null].filter(Boolean).join('  •  ')

// ambil satu hasil: dari tautan (info) atau dari kata kunci (hasil pertama)
async function resolveOne(text, quoted) {
  const url = D.pickUrl(text, quoted)
  if (url) { try { return await Y.info(url) } catch { return { url, title: '', author: '', duration: null, views: null, thumbnail: null } } }
  const q = norm(text); if (!q) return null
  const [r] = await Y.search(q, 1); return r || null
}

// ───────────── .play <judul|tautan> : kartu hasil + tombol ─────────────
async function playSearch({ sock, m, reply, text, prefix }) {
  const q = norm(text)
  const link = D.pickUrl(text, m.quoted)
  if (!q && !link) {
    return reply(`${B('PLAY')}\n${HR}\nCari video, musik, dan gambar sekaligus beserta tautannya.\n\nContoh:\n${prefix}play dewa 19 kangen\n${prefix}play https://youtu.be/xxxxxxxxxxx\n\nLainnya:\n${prefix}playaudio <judul|tautan>  : kirim musik (mp3)\n${prefix}playvideo <judul|tautan>  : kirim video (mp4)\n${prefix}playimg <kata kunci>       : kirim gambar beserta tautannya`)
  }
  await reply('Mencari, mohon tunggu...')
  let results = [], top = null
  const imgP = link ? Promise.resolve([]) : imageSearch(q, 3).catch(() => [])
  try {
    if (link) { top = await Y.info(link); results = [top] }
    else { results = (await Y.search(q, 6)).filter(r => !r.live); top = results[0] }
  } catch (e) { console.log('[play]', e.message); return reply(`Pencarian gagal.\n> ${Y.friendly(e.stderr || e.message)}`) }
  if (!top) return reply(`Tidak ada hasil untuk "${q}".`)
  const imgs = link ? [] : await imgP

  const others = results.slice(1, 5)
  const body = [
    bot(), B('PLAY'), HR,
    `✦ ${B('Judul')}  : ${ST.cut(top.title || 'Tanpa judul', 120)}`,
    ...(line(top) ? [`✦ ${B('Info')}   : ${line(top)}`] : []),
    `✦ ${B('Tautan')} : ${top.url}`,
    ...(others.length ? ['', B('HASIL LAIN'), ...others.map((r, i) => `${i + 2}. ${ST.cut(r.title, 70)}\n   ${line(r)}\n   ${r.url}`)] : []),
    ...(imgs.length ? ['', B('GAMBAR TERKAIT'), ...imgs.map((g, i) => `${i + 1}. ${ST.cut(g.title || 'Gambar', 60)}\n   ${g.image}`)] : []),
    HR, '_Pilih tombol di bawah untuk mengunduh._',
  ].join('\n')

  const pick = (r) => ({ header: '', title: ST.cut(r.title || 'Tanpa judul', 24), description: ST.cut(line(r), 72) })
  const sections = [
    { title: B('Unduh Audio'), rows: results.slice(0, 5).map(r => ({ ...pick(r), id: `${prefix}playaudio ${r.url}` })) },
    { title: B('Unduh Video'), rows: results.slice(0, 5).map(r => ({ ...pick(r), id: `${prefix}playvideo ${r.url}` })) },
  ]
  const qr = (t, id) => ({ name: 'ytplay', buttonParamsJson: JSON.stringify({ display_text: t, id }) })
  const btns = [
    qr(`✦ ${B('Audio')}`, `${prefix}playaudio ${top.url}`),
    qr(`✦ ${B('Video')}`, `${prefix}playvideo ${top.url}`),
    ...(link ? [] : [qr(`✦ ${B('Gambar')}`, `${prefix}playimg ${q}`)]),
    ...(results.length > 1 ? [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: `✦ ${B('Hasil Lain')}`, sections }) }] : []),
  ]
  let image = null
  try { image = await D.fetchBuffer([top.thumbnail]) } catch {}
  try { await ui.sendInteractive(sock, m, image ? { image } : null, body, bot(), btns) }
  catch (e) {
    console.log('[play] interaktif gagal:', e.message)
    const alt = `${body}\n\nKetik:\n${prefix}playaudio ${top.url}\n${prefix}playvideo ${top.url}`
    await (image ? sock.sendMessage(m.chat, { image, caption: alt }, { quoted: m }) : sock.sendMessage(m.chat, { text: alt }, { quoted: m }))
  }
}

// ───────────── .playaudio / .playvideo ─────────────
async function playMedia({ sock, m, reply, text, prefix }, audio) {
  const cmd = audio ? 'playaudio' : 'playvideo'
  if (!norm(text) && !(m.quoted && D.pickUrl('', m.quoted))) return reply(`Tulis judul atau tautan.\nContoh: ${prefix}${cmd} dewa 19 kangen`)
  if (!D.lock(m.sender)) return reply('Unduhanmu yang sebelumnya masih berjalan. Tunggu selesai dulu ya.')
  const dir = Y.tmpDir()
  try {
    await reply(audio ? 'Menyiapkan musik, mohon tunggu...' : 'Menyiapkan video, mohon tunggu...')
    const pick = await resolveOne(text, m.quoted)
    if (!pick) return reply('Tidak ada hasil.')
    const { items } = await Y.fetchMedia(pick.url, { kind: audio ? 'audio' : 'video', dir })
    const it = items[0], meta = { ...it.info, ...(pick.title ? { title: pick.title } : {}), ...(pick.author ? { author: pick.author } : {}) }
    if (audio) {
      const cap = [bot(), B('PLAY AUDIO'), HR, `✦ ${B('Judul')}  : ${ST.cut(meta.title || 'Tanpa judul', 120)}`, ...(meta.author ? [`✦ ${B('Kreator')} : ${ST.cut(meta.author, 80)}`] : []), ...(D.dur(meta.duration) ? [`✦ ${B('Durasi')}  : ${D.dur(meta.duration)}`] : []), `✦ ${B('Tautan')}  : ${pick.url}`, HR, '✦ by Chisa AI'].join('\n')
      await D.sendCard(sock, m, cap, pick.thumbnail || meta.thumbnail)
      return await D.sendFile(sock, m, it.file, 'audio')
    }
    it.file = await Y.ensureCompat(it.file, it.info.vcodec)
    const cap = D.caption({ ...meta, filesize: require('fs').statSync(it.file).size }, 'video') + `\n${pick.url}`
    await D.sendFile(sock, m, it.file, 'video', cap)
  } catch (e) {
    console.log('[play]', e.message)
    reply(`Gagal mengunduh.\n> ${e.message}`)
  } finally { D.unlock(m.sender); Y.cleanup(dir) }
}

// ───────────── .playimg <kata kunci> ─────────────
async function playImage({ sock, m, reply, text, prefix }) {
  const q = norm(text) || norm(m.quoted && (m.quoted.text || m.quoted.caption))
  if (!q) return reply(`Tulis kata kunci gambarnya.\nContoh: ${prefix}playimg kucing lucu`)
  await reply('Mencari gambar, mohon tunggu...')
  const list = await imageSearch(q, 8)
  if (!list.length) return reply(`Tidak ada gambar untuk "${q}".`)
  let sent = 0
  for (const g of list) {
    if (sent >= 4) break
    try {
      const buf = await D.fetchBuffer([g.image, g.thumb])
      const cap = [`${B('GAMBAR')} ${sent + 1}`, `✦ ${ST.cut(g.title || q, 100)}`, `✦ Gambar : ${g.image}`, ...(g.page ? [`✦ Sumber : ${g.page}`] : []), '✦ by Chisa AI'].join('\n')
      await sock.sendMessage(m.chat, { image: buf, caption: cap }, { quoted: m }); sent++
    } catch {}
  }
  if (!sent) return reply(`Gambar ditemukan tapi gagal diunduh. Tautannya:\n\n` + list.slice(0, 5).map((g, i) => `${i + 1}. ${ST.cut(g.title || q, 60)}\n${g.image}`).join('\n'))
}

module.exports = {
  name: 'play', alias: [...SEARCH.slice(1), ...AUDIO, ...VIDEO, ...IMAGE],
  category: 'unduh', cmds: ['playaudio', 'playvideo', 'playimg'],
  desc: 'Cari video, musik, dan gambar beserta tautannya; unduh audio atau video',
  run: async (ctx) => {
    const c = ctx.command
    if (AUDIO.includes(c)) return playMedia(ctx, true)
    if (VIDEO.includes(c)) return playMedia(ctx, false)
    if (IMAGE.includes(c)) return playImage(ctx)
    return playSearch(ctx)
  },
}
