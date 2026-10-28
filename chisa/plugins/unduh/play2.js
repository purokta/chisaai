/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .play2 — sama seperti .play (cari video, musik, gambar + tautan, unduh audio/video), tapi tampil sebagai kartu HTML
//   .play2 <judul|tautan>   -> kartu hasil (thumbnail, tab Hasil / Gambar / Tautan) + tombol unduh di bawah kartu
// Unduhnya tetap lewat .playaudio / .playvideo / .playimg milik .play, jadi cara kerjanya sama persis.
const Y = require('../../lib/ytdlp')
const D = require('../../lib/downloader')
const ui = require('../../lib/menuui')
const ST = require('../../lib/style')
const S = require('../../lib/settingsdb')
const { imageSearch } = require('../../lib/imgsearch')
const { buildRichHtmlPayload } = require('../../lib/htmlcard')
const { buildPlay2Html } = require('../../lib/cards/play2')

const B = D.B, HR = D.HR
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim()
const bot = () => S.get('botname') || '✦ 𝐂𝐇𝐈𝐒𝐀 𝐀𝐈'
const MAX_HTML = Math.max(200, Number(process.env.PLAY2_MAX_HTML_KB) || 600) * 1024   // batas aman ukuran kartu
const BUTTONS = process.env.PLAY2_BUTTONS !== '0'   // tombol unduh asli di bawah kartu (kartu HTML sendiri tidak bisa mengirim perintah)
const meta = (r) => [r.author, D.dur(r.duration), r.views != null ? `${D.num(r.views)}x ditonton` : null].filter(Boolean).join('  •  ')

// unduh thumbnail, kecilkan, ubah jadi data URI (kartu HTML tidak bisa memuat gambar dari jaringan)
let sharp = null; try { sharp = require('sharp') } catch {}
const mimeOf = (b) => b[0] === 0x89 ? 'image/png' : b[0] === 0x47 ? 'image/gif' : (b[0] === 0x52 && b.slice(8, 12).toString() === 'WEBP') ? 'image/webp' : 'image/jpeg'
async function thumb(urls, w = 320) {
  try {
    let buf = await D.fetchBuffer(urls)
    if (sharp) { try { buf = await sharp(buf).resize({ width: w, withoutEnlargement: true }).jpeg({ quality: 62 }).toBuffer(); return `data:image/jpeg;base64,${buf.toString('base64')}` } catch {} }
    if (buf.length > 60 * 1024) return ''   // tanpa sharp, lewati gambar besar agar kartu tetap ringan
    return `data:${mimeOf(buf)};base64,${buf.toString('base64')}`
  } catch { return '' }
}
const ytThumb = (r) => r.id ? [`https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`, r.thumbnail] : [r.thumbnail]

async function playCard(ctx) {
  const { sock, m, reply, text, prefix, pushname } = ctx
  const q = norm(text), link = D.pickUrl(text, m.quoted)
  if (!q && !link) {
    return reply(`${B('PLAY 2')}\n${HR}\nSama seperti ${prefix}play, tapi tampil sebagai kartu HTML.\n\nContoh:\n${prefix}play2 dewa 19 kangen\n${prefix}play2 https://youtu.be/xxxxxxxxxxx\n\nUnduh tetap lewat tombol, atau:\n${prefix}playaudio <judul|tautan>\n${prefix}playvideo <judul|tautan>\n${prefix}playimg <kata kunci>`)
  }
  await reply('Mencari, mohon tunggu...')
  let results = [], top = null
  const imgP = link ? Promise.resolve([]) : imageSearch(q, 6).catch(() => [])
  try {
    if (link) { top = await Y.info(link); results = [top] }
    else { results = (await Y.search(q, 6)).filter(r => !r.live); top = results[0] }
  } catch (e) { console.log('[play2]', e.message); return reply(`Pencarian gagal.\n> ${Y.friendly(e.stderr || e.message)}`) }
  if (!top) return reply(`Tidak ada hasil untuk "${q}".`)
  const images = link ? [] : await imgP

  const [vth, ith] = await Promise.all([
    Promise.all(results.map(r => thumb(ytThumb(r)))),
    Promise.all(images.map(g => thumb([g.thumb, g.image], 260))),
  ])
  const items = results.map((r, i) => ({ t: ST.cut(r.title || 'Tanpa judul', 120), m: meta(r), d: D.dur(r.duration) || '', u: r.url, th: vth[i] }))
  const imgs = images.map((g, i) => ({ t: ST.cut(g.title || 'Gambar', 70), u: g.image, pg: g.page || '', th: ith[i] }))

  const mk = (withImgThumbs) => buildPlay2Html({
    playerName: pushname || String(m.sender).split('@')[0], q: link ? '' : q, link: !!link, prefix,
    items, imgs: withImgThumbs ? imgs : imgs.map(g => ({ ...g, th: '' })),
  })
  let html = mk(true)
  if (html.length > MAX_HTML) html = mk(false)   // terlalu besar: buang thumbnail gambar dulu
  if (html.length > MAX_HTML) html = buildPlay2Html({ playerName: pushname || String(m.sender).split('@')[0], q: link ? '' : q, link: !!link, prefix, items: items.map(x => ({ ...x, th: '' })), imgs: imgs.map(g => ({ ...g, th: '' })) })

  try { await sock.relayMessage(m.chat, buildRichHtmlPayload(html, `Play - ${bot()}`), {}) }
  catch (e) {
    // WA belum mendukung kartu HTML: pakai tampilan .play biasa
    console.log('[play2] kartu gagal, pakai .play:', e.message)
    return require('./play').run({ ...ctx, command: 'play' })
  }

  if (!BUTTONS) return
  // tombol unduh asli (kartu HTML hanya bisa menyalin perintah, tidak bisa mengirimnya)
  try {
    const pick = (r) => ({ header: '', title: ST.cut(r.title || 'Tanpa judul', 24), description: ST.cut(meta(r), 72) })
    const sections = [
      { title: B('Unduh Audio'), rows: results.slice(0, 5).map(r => ({ ...pick(r), id: `${prefix}playaudio ${r.url}` })) },
      { title: B('Unduh Video'), rows: results.slice(0, 5).map(r => ({ ...pick(r), id: `${prefix}playvideo ${r.url}` })) },
    ]
    const qr = (t, id) => ({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: t, id }) })
    const btns = [
      qr(`✦ ${B('Audio')}`, `${prefix}playaudio ${top.url}`),
      qr(`✦ ${B('Video')}`, `${prefix}playvideo ${top.url}`),
      ...(link ? [] : [qr(`✦ ${B('Gambar')}`, `${prefix}playimg ${q}`)]),
      ...(results.length > 1 ? [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: `✦ ${B('Hasil Lain')}`, sections }) }] : []),
    ]
    await ui.sendInteractive(sock, m, null, `${B('UNDUH')}\n✦ ${ST.cut(top.title || 'Hasil teratas', 80)}\n_Pilih tombol untuk mengunduh._`, bot(), btns)
  } catch (e) { console.log('[play2] tombol gagal:', e.message) }
}

module.exports = {
  name: 'play2', alias: ['playcard', 'playhtml', 'cari2'],
  category: 'unduh', cmds: ['play2'],
  desc: 'Seperti .play (cari video, musik, gambar + tautan, unduh) tapi tampil sebagai kartu HTML',
  run: (ctx) => playCard(ctx),
}
