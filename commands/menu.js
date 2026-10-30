const fs = require('fs')
const assets = require('../lib/assets')
const status = require('../lib/status')
const brand = require('../lib/brand')

const ORDER = ['Stiker', 'Downloader', 'Musik', 'Anime', 'AI', 'Grup', 'Alat', 'Info', 'Economy', 'Islami', 'Game', 'Lainnya', 'Owner']
const ICON = {
  Stiker: '🖼️', Downloader: '📥', Musik: '🎵', Anime: '🌸', AI: '🤖', Grup: '👥', Alat: '🧰',
  Info: '🌤️', Economy: '💹', Islami: '🕌', Game: '🎮', Lainnya: '✨', Owner: '👑'
}
// keterangan singkat di menu (yang tidak ada di sini memakai desc perintah, dipotong)
const SHORT = {
  s: 'gambar/video → stiker', toimg: 'stiker → gambar', stext: 'teks → stiker', stextanim: 'teks → stiker animasi', take: 'ganti nama pack stiker',
  dl: 'unduh video (TikTok/IG/YT/FB/dll)', ytmp3: 'link → audio',
  play: 'cari & kirim lagu', ytsearch: 'cari video YouTube', lirik: 'cari lirik lagu',
  waifu: 'gambar waifu', neko: 'gambar neko', megumin: 'gambar Megumin', shinobu: 'gambar Shinobu', animeinfo: 'info anime',
  makan: 'makan buah jadi EXP',
  ai: 'tanya AI / baca gambar', ringkas: 'ringkas teks/link', img: 'buat gambar AI', hd: 'perjelas gambar',
  tagall: 'tag semua anggota', hidetag: 'tag semua (tanpa nama)', kick: 'keluarkan anggota', promote: 'jadikan admin', demote: 'cabut admin',
  linkgrup: 'link undangan', tutupgrup: 'tutup grup', bukagrup: 'buka grup', admin: 'daftar admin', infogrup: 'info grup', hapus: 'hapus pesan (reply)',
  antilink: 'blokir link grup WA', welcome: 'sambutan anggota baru',
  calc: 'kalkulator', tr: 'terjemah', qr: 'buat kode QR', ssweb: 'screenshot web', tourl: 'media → link', ocr: 'baca teks gambar',
  tomp3: 'video → MP3', tovn: 'audio → voice note', ingatkan: 'pengingat',
  cuaca: 'cuaca kota', kurs: 'kurs dolar → rupiah', saham: 'indeks saham / harga saham', beritaekonomi: 'berita ekonomi lagi viral', gempa: 'gempa terbaru', jam: 'jam kota lain', wiki: 'ringkasan Wikipedia',
  sholat: 'jadwal sholat', quran: 'ayat Al-Qur\'an',
  tebakkata: 'tebak kata', asahotak: 'asah otak', caklontong: 'tebakan Cak Lontong', susunkata: 'susun kata acak', tebakgambar: 'tebak gambar',
  tebakbendera: 'tebak bendera', petik: 'petik buah', inv: 'inventory buah', jual: 'jual buah', harga: 'harga buah', topbuah: 'peringkat koin', hint: 'petunjuk game', nyerah: 'menyerah', skor: 'papan skor',
  pin: 'sematkan pesan (reply)', unpin: 'lepas sematan', mute: 'bisukan anggota', unmute: 'buka bisu', bangrup: 'banned dari grup', unbangrup: 'buka banned grup', warn: 'peringatan (3x keluar)', resetwarn: 'hapus peringatan', warns: 'cek peringatan', setrules: 'atur aturan grup', rules: 'lihat aturan grup', id: 'ID Telegram', userinfo: 'info pengguna', broadcast: 'kirim ke semua pengguna',
  buatpack: 'buat pack stiker Chisa', pack: 'pack stiker Chisa', tambahpack: 'tambah stiker ke pack', hapuspack: 'hapus stiker dari pack',
  daily: 'login harian (koin & EXP)', gacha: 'gacha karakter anime', koleksi: 'koleksi karakter',
  owner: 'profil owner', pp: 'foto profil (reply)', search: 'cari info di internet', status: 'status bot & server',
 private: 'mode SELF (owner+VIP)', ban: 'blokir pengguna', unban: 'buka blokir', setlimit: 'atur limit harian', autodelete: 'atur waktu hapus otomatis pesan bot', limit: 'sisa jatah hari ini', backup: 'backup login', stop: 'matikan bot', public: 'mode PUBLIC (semua)', autoreply: 'balasan AI on/off', vip: 'atur VIP'
}

const EMO = {
  s: '🎨', toimg: '🖼️', stext: '🔤', stextanim: '✨', take: '🏷️', dl: '⬇️', ytmp3: '🎵', play: '🎧', ytsearch: '🔎', lirik: '🎤',
  waifu: '🌸', neko: '🐱', megumin: '💥', shinobu: '🦋', animeinfo: '🎌', ai: '🤖', img: '🖌️', hd: '🔍', search: '🌐',
  tagall: '📢', hidetag: '👻', kick: '🚪', promote: '⬆️', demote: '⬇️', linkgrup: '🔗', tutupgrup: '🔒', bukagrup: '🔓', admin: '👑',
  infogrup: 'ℹ️', hapus: '🗑️', antilink: '🚫', welcome: '👋', calc: '🧮', tr: '🌍', qr: '🔳', ssweb: '📸', tourl: '☁️', ocr: '📝',
  tomp3: '🎶', tovn: '🎙️', ingatkan: '⏰', cuaca: '🌤️', kurs: '💱', saham: '📈', beritaekonomi: '📰', gempa: '🌋', jam: '🕒', wiki: '📚', sholat: '🕌', quran: '📖',
  tebakkata: '🎮', asahotak: '🧠', caklontong: '🤪', susunkata: '🔀', tebakgambar: '🖼️', tebakbendera: '🚩', petik: '🧺', inv: '🎒', jual: '💰', harga: '🏷️', topbuah: '🏅', hint: '💡', nyerah: '🏳️', skor: '🏆',
  pin: '📌', unpin: '📍', mute: '🔇', unmute: '🔊', bangrup: '⛔', unbangrup: '✅', warn: '⚠️', resetwarn: '♻️', warns: '📋', setrules: '📜', rules: '📜', id: '🆔', userinfo: '👤', broadcast: '📢',
  buatpack: '📦', pack: '📦', tambahpack: '➕', hapuspack: '➖',
  daily: '🎁', gacha: '🎰', koleksi: '📚',
  makan: '😋', ringkas: '📝', ban: '🚫', unban: '✅', setlimit: '📊', limit: '📊', backup: '💾', stop: '🛑', owner: '👤', pp: '🧑', status: '📡', private: '🔒', public: '🔓', autoreply: '💬', vip: '⭐'
}
const short = c => SHORT[c.name] || (c.desc.length > 34 ? c.desc.slice(0, 33) + '…' : c.desc)

function groupCommands(ctx) {
  const groups = {}
  for (const c of ctx.commands) {
    if ((c.platform && c.platform !== ctx.platform) || (c.hidden || c.ownerOnly) && !ctx.isOwner) continue
    if (c.hidden && ['menu', 'help', 'bantuan', 'start'].includes(c.name)) continue
    // owner: semua perintah tersembunyi / khusus owner dikumpulkan di menu Owner
    ;(groups[ctx.isOwner && (c.hidden || c.ownerOnly) ? 'Owner' : c.category || 'Lainnya'] ||= []).push(c)
  }
  const cats = [...ORDER.filter(c => groups[c]), ...Object.keys(groups).filter(c => !ORDER.includes(c))]
  return { groups, cats }
}

const LABEL = { Downloader: 'Download' }
const item = (c, p) => `${EMO[c.name] || '•'} ${p}${c.name}`
const title = cat => `*${LABEL[cat] || cat} menu*`

// menu utama: judul tebal + satu perintah per baris (tanpa keterangan)
const compact = (cat, cmds, p) => title(cat) + '\n' + cmds.map(c => item(c, p)).join('\n')
// menu <kategori>: lengkap dengan cara pakai singkat
const detail = (cat, cmds, p) => title(cat) + '\n' + cmds.map(c => `${item(c, p)}${c.usage ? ' ' + c.usage : ''} — ${short(c)}`).join('\n')
const footer = (config, p) => `💡 ketik ${p}menu <kategori> untuk rincian\nchisa-ai By Shipur\npowered by claude\n©${new Date().getFullYear()} • ${brand.mark()}`

// Kartu seperti link: banner di atas, di bawahnya tanggal+jam+cuaca singkat, lalu tagline. Kalau banner gagal -> teks biasa.
async function sendCard(ctx, text, t) {
  const { config } = ctx
  const cw = status.cachedWeatherShort()
  const line1 = `${t.pendek} • ${t.jam}${cw ? ' • ' + cw : ''}`
  const tagline = config.menu?.tagline || 'Kuchiba Chisa By Shipur'
  const tt = config.owner?.tiktok
  const link = config.menu?.link || (tt ? `https://www.tiktok.com/@${String(tt).replace(/^@/, '')}` : 'https://github.com/purokta/chisaai')
  // banner bergerak (video pendek seperti GIF) kalau ada assets/banner.mp4; gagal -> kartu thumbnail biasa
  const bn = config.menu?.banner !== false && assets.banner()
  if (bn) {
    try {
      const bc = require('../lib/bannercache')
      const head = `${line1}\n${tagline}`
      const caption = `${head}\n\n${text}`
      const isImg = /^image\//.test(bn.mime)
      const put = (cap) => isImg ? ctx.send({ image: fs.readFileSync(bn.file), mimetype: bn.mime, caption: cap }) : bc.send(ctx, bn.file, cap)
      if (caption.length <= 1000) {
        await put(caption)
      } else {
        await put(head)
        await ctx.reply(text)
      }
      return
    } catch (e) {
      console.log('[menu] banner video gagal:', e?.message || e)
    }
  }
  const th = config.menu?.thumbnail !== false && assets.thumbnail()
  if (th) {
    try {
      const thumb = await assets.thumbJpeg(th)
      await ctx.send({
        text,
        contextInfo: {
          externalAdReply: {
            title: line1,
            body: tagline,
            thumbnail: thumb,
            mediaType: 1,
            mediaUrl: link,
            sourceUrl: link,
            renderLargerThumbnail: true,
            showAdAttribution: false
          }
        }
      })
      return
    } catch (e) {
      console.log('[menu] kartu thumbnail gagal:', e?.message || e)
    }
  }
  await ctx.reply(`${line1}\n${tagline}\n\n${text}`)
}

async function sendMusic(ctx) {
  const { config } = ctx
  const mu = config.menu?.music !== false && assets.music()
  if (!mu) return
  try {
    // musik menu dikirim sebagai voice note (kalau konversi gagal, kirim sebagai audio biasa)
    let vn = null
    try { vn = await assets.voiceNote(mu) } catch (e) { console.log('[menu] konversi voice note gagal:', e?.message || e) }
    if (vn) await ctx.send({ audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true })
    else await ctx.send({ audio: fs.readFileSync(mu.file), mimetype: mu.mime, ptt: false })
  } catch (e) {
    console.log('[menu] musik gagal:', e?.message || e)
  }
}

// ---- Telegram: menu dengan tombol inline (bisa dipencet), kategori diganti di tempat ----
async function runTelegram(ctx, groups, cats, want) {
  const { config } = ctx
  const p = '/'
  const rows = []
  const btn = cats.map(c => ({ text: `${ICON[c] || '📌'} ${LABEL[c] || c}`, data: '#menu ' + c.toLowerCase() }))
  for (let i = 0; i < btn.length; i += 3) rows.push(btn.slice(i, i + 3))
  const extra = [{ text: '📋 Semua', data: '#menu semua' }]
  if (config.menu?.music !== false && assets.music()) extra.push({ text: '🎵 Musik', data: '#menumusik' })
  rows.push(extra)
  const back = [...rows, [{ text: '🏠 Menu utama', data: '#menu' }]]

  // tampilkan di pesan menu yang sama (kalau dari tombol & muat), kalau tidak kirim pesan baru
  const view = (text, buttons) => {
    const cb = ctx.tgCb
    if (cb && (!cb.photo || text.length <= 1000)) return ctx.send({ tgMenu: true, text, edit: { id: cb.messageId, photo: cb.photo }, tgButtons: buttons })
    return ctx.send({ tgMenu: true, text, tgButtons: buttons })
  }

  if (want === 'semua') return ctx.send({ tgMenu: true, text: cats.map(c => compact(c, groups[c], p)).join('\n\n') + '\n\n' + footer(config, p), tgButtons: [[{ text: '🏠 Menu utama', data: '#menu' }]] })
  if (want) {
    const cat = cats.find(c => c.toLowerCase() === want)
    if (!cat) return ctx.reply(`Kategori "${want}" tidak ada.\nPilih: ${cats.map(c => c.toLowerCase()).join(', ')}`)
    return view(detail(cat, groups[cat], p) + '\n\n' + footer(config, p), back)
  }

  const t = status.now()
  status.refreshWeather()
  const cw = status.cachedWeatherShort()
  const line1 = `${t.pendek} • ${t.jam}${cw ? ' • ' + cw : ''}`
  const tagline = config.menu?.tagline || 'Kuchiba Chisa By Shipur'
  const caption = `*🤖 ${config.botName}* • by ${brand.mark()}\nHalo ${ctx.pushName || 'kak'}! 👋\n${line1}\n${tagline}\n\nPilih kategori di tombol bawah 👇`
  // banner GIF yang berganti tiap menu dibuka (kalau tidak ada / gagal: foto thumbnail)
  const bn0 = config.menu?.banner !== false && assets.banner()
  const bnImg = bn0 && /^image\//.test(bn0.mime) ? bn0 : null // banner gambar -> dikirim sebagai foto
  const bn = bnImg ? null : bn0
  let sent = false
  if (bn) {
    try {
      const st = fs.statSync(bn.file)
      const tgBanner = { key: bn.file + st.size + st.mtimeMs, buffer: fs.readFileSync(bn.file), caption }
      await ctx.send({ text: caption, tgBanner, tgButtons: rows, ...(ctx.tgCb ? { edit: { id: ctx.tgCb.messageId, photo: ctx.tgCb.photo } } : {}) })
      sent = true
    } catch (e) {
      console.log('[menu] banner telegram gagal:', e?.message || e)
    }
  }
  if (sent) { if (!ctx.tgCb) await sendMusic(ctx); return }
  if (ctx.tgCb) return view(caption, rows)
  const th = bnImg || (config.menu?.thumbnail !== false && assets.thumbnail())
  if (th) {
    try {
      await ctx.send({ tgMenu: true, image: bnImg ? fs.readFileSync(bnImg.file) : await assets.thumbJpeg(th), caption, tgButtons: rows })
      sent = true
    } catch (e) {
      console.log('[menu] foto telegram gagal:', e?.message || e)
    }
  }
  if (!sent) await ctx.send({ tgMenu: true, text: caption, tgButtons: rows })
  await sendMusic(ctx)
}

module.exports = [
  {
    name: 'menu',
    aliases: ['help', 'bantuan', 'start'],
    category: 'Lainnya',
    hidden: true,
    usage: '[kategori]',
    desc: 'Tampilkan menu',
    async run(ctx) {
      const { config } = ctx
      const p = config.displayPrefix || ctx.prefix
      const { groups, cats } = groupCommands(ctx)
      let want = (ctx.args[0] || '').toLowerCase()
      if (want === 'download') want = 'downloader'

      if (ctx.platform === 'telegram') return runTelegram(ctx, groups, cats, want)
      // menu gabungan (Chisa + fitur tambahan)
      try { return await require('../lib/chisamenu').run(ctx, sendCard, sendMusic) } catch (e) { console.log('[menu chisa]', e?.message || e) }

      // cadangan kalau menu gabungan gagal: daftar teks sederhana
      if (want === 'semua') return ctx.reply(cats.map(c => compact(c, groups[c], p)).join('\n\n') + '\n\n' + footer(config, p))
      if (want) {
        const cat = cats.find(c => c.toLowerCase() === want)
        if (!cat) return ctx.reply(`Kategori "${want}" tidak ada.\nPilih: ${cats.map(c => c.toLowerCase()).join(', ')}`)
        return ctx.reply(detail(cat, groups[cat], p) + '\n\n' + footer(config, p))
      }
      status.refreshWeather()
      await sendCard(ctx, `*🤖 ${config.botName}* • by ${brand.mark()}\nHalo ${ctx.pushName || 'kak'}! 👋\n\n` + cats.map(c => compact(c, groups[c], p)).join('\n\n') + '\n\n' + footer(config, p), status.now())
      await sendMusic(ctx)
    }
  },
  {
    name: 'menumusik',
    aliases: ['musikmenu'],
    category: 'Lainnya',
    hidden: true,
    desc: 'Putar musik menu (voice note)',
    async run(ctx) {
      if (!(ctx.config.menu?.music !== false && assets.music())) return ctx.reply('Musik menu tidak aktif / belum ada file musik di folder assets.')
      await sendMusic(ctx)
    }
  }
]
