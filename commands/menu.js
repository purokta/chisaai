const fs = require('fs')
const assets = require('../lib/assets')
const status = require('../lib/status')
const brand = require('../lib/brand')
const buttons = require('../lib/buttons')
const polls = require('../lib/polls')

const ORDER = ['Stiker', 'Downloader', 'Musik', 'Anime', 'AI', 'Grup', 'Alat', 'Info', 'Islami', 'Game', 'Lainnya', 'Owner']
const ICON = {
  Stiker: '🖼️', Downloader: '📥', Musik: '🎵', Anime: '🌸', AI: '🤖', Grup: '👥', Alat: '🧰',
  Info: '🌤️', Islami: '🕌', Game: '🎮', Lainnya: '✨', Owner: '👑'
}
// keterangan singkat di menu (yang tidak ada di sini memakai desc perintah, dipotong)
const SHORT = {
  s: 'gambar/video → stiker', toimg: 'stiker → gambar', stext: 'teks → stiker', stextanim: 'teks → stiker animasi', take: 'ganti nama pack stiker',
  dl: 'unduh video (TikTok/IG/YT/FB/dll)', ytmp3: 'link → audio',
  play: 'cari & kirim lagu', ytsearch: 'cari video YouTube', lirik: 'cari lirik lagu',
  waifu: 'gambar waifu', neko: 'gambar neko', megumin: 'gambar Megumin', shinobu: 'gambar Shinobu', animeinfo: 'info anime',
  ai: 'tanya AI', img: 'buat gambar AI', hd: 'perjelas gambar',
  tagall: 'tag semua anggota', hidetag: 'tag semua (tanpa nama)', kick: 'keluarkan anggota', promote: 'jadikan admin', demote: 'cabut admin',
  linkgrup: 'link undangan', tutupgrup: 'tutup grup', bukagrup: 'buka grup', admin: 'daftar admin', infogrup: 'info grup', hapus: 'hapus pesan (reply)',
  antilink: 'blokir link grup WA', welcome: 'sambutan anggota baru',
  calc: 'kalkulator', tr: 'terjemah', qr: 'buat kode QR', ssweb: 'screenshot web', tourl: 'media → link', ocr: 'baca teks gambar',
  tomp3: 'video → MP3', tovn: 'audio → voice note', ingatkan: 'pengingat',
  cuaca: 'cuaca kota', kurs: 'kurs mata uang', gempa: 'gempa terbaru', jam: 'jam kota lain', wiki: 'ringkasan Wikipedia',
  sholat: 'jadwal sholat', quran: 'ayat Al-Qur\'an',
  tebakkata: 'tebak kata', asahotak: 'asah otak', caklontong: 'tebakan Cak Lontong', susunkata: 'susun kata acak', tebakgambar: 'tebak gambar',
  tebakbendera: 'tebak bendera', hint: 'petunjuk game', nyerah: 'menyerah', skor: 'papan skor',
  owner: 'profil owner', pp: 'foto profil (reply)', search: 'cari info di internet', status: 'status bot & server',
  menustyle: 'gaya menu teks/poll/tombol', private: 'mode SELF (owner+VIP)', public: 'mode PUBLIC (semua)', autoreply: 'balasan AI on/off', vip: 'atur VIP'
}

const EMO = {
  s: '🎨', toimg: '🖼️', stext: '🔤', stextanim: '✨', take: '🏷️', dl: '⬇️', ytmp3: '🎵', play: '🎧', ytsearch: '🔎', lirik: '🎤',
  waifu: '🌸', neko: '🐱', megumin: '💥', shinobu: '🦋', animeinfo: '🎌', ai: '🤖', img: '🖌️', hd: '🔍', search: '🌐',
  tagall: '📢', hidetag: '👻', kick: '🚪', promote: '⬆️', demote: '⬇️', linkgrup: '🔗', tutupgrup: '🔒', bukagrup: '🔓', admin: '👑',
  infogrup: 'ℹ️', hapus: '🗑️', antilink: '🚫', welcome: '👋', calc: '🧮', tr: '🌍', qr: '🔳', ssweb: '📸', tourl: '☁️', ocr: '📝',
  tomp3: '🎶', tovn: '🎙️', ingatkan: '⏰', cuaca: '🌤️', kurs: '💱', gempa: '🌋', jam: '🕒', wiki: '📚', sholat: '🕌', quran: '📖',
  tebakkata: '🎮', asahotak: '🧠', caklontong: '🤪', susunkata: '🔀', tebakgambar: '🖼️', tebakbendera: '🚩', hint: '💡', nyerah: '🏳️', skor: '🏆',
  owner: '👤', pp: '🧑', status: '📡', menustyle: '📋', private: '🔒', public: '🔓', autoreply: '💬', vip: '⭐'
}
const short = c => SHORT[c.name] || (c.desc.length > 34 ? c.desc.slice(0, 33) + '…' : c.desc)

function groupCommands(ctx) {
  const groups = {}
  for (const c of ctx.commands) {
    if (c.hidden || (c.ownerOnly && !ctx.isOwner)) continue
    ;(groups[c.category || 'Lainnya'] ||= []).push(c)
  }
  const cats = [...ORDER.filter(c => groups[c]), ...Object.keys(groups).filter(c => !ORDER.includes(c))]
  return { groups, cats }
}

const LINE = '└────────────'
const box = (title, lines) => `「 ${title} 」\n│\n${lines.map(l => '│ ' + l).join('\n')}\n${LINE}`
const item = (c, p) => `${EMO[c.name] || '•'} ${p}${c.name}`

// menu utama: hanya nama perintah, 2 per baris (ringkas)
function compact(cat, cmds, p) {
  const rows = []
  for (let i = 0; i < cmds.length; i += 2) rows.push(cmds.slice(i, i + 2).map(c => item(c, p)).join('    '))
  return box(`${ICON[cat] || '📌'} ${cat.toUpperCase()}`, rows)
}
// menu <kategori>: lengkap dengan cara pakai singkat
const detail = (cat, cmds, p) =>
  box(`${ICON[cat] || '📌'} ${cat.toUpperCase()}`, cmds.map(c => `${item(c, p)}${c.usage ? ' ' + c.usage : ''} — ${short(c)}`))
const footer = (config, p) => `💡 ketik ${p}menu <kategori> untuk rincian\n© ${config.botName} • ${brand.mark()}`

// Kartu: banner di atas, di bawah banner ada jam + cuaca. Kalau banner gagal, kirim teks biasa (jam & cuaca ikut di teks).
async function sendCard(ctx, text, t, cuaca) {
  const { config } = ctx
  const th = config.menu?.thumbnail !== false && assets.thumbnail()
  if (th) {
    try {
      const thumb = await assets.thumbJpeg(th)
      await ctx.send({
        text,
        contextInfo: {
          externalAdReply: {
            title: `⏰ ${t.jam}  •  ${t.tanggal}`,
            body: cuaca ? `🌤️ ${cuaca}` : config.botName,
            thumbnail: thumb,
            mediaType: 1,
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
  await ctx.reply(`⏰ ${t.jam} • ${t.tanggal}${cuaca ? '\n🌤️ ' + cuaca : ''}\n\n${text}`)
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

module.exports = [
  {
    name: 'menu',
    aliases: ['help', 'bantuan', 'start'],
    category: 'Lainnya',
    hidden: true,
    usage: '[kategori]',
    desc: 'Tampilkan menu',
    async run(ctx) {
      const { config, db } = ctx
      const p = config.displayPrefix || ctx.prefix
      const { groups, cats } = groupCommands(ctx)
      let want = (ctx.args[0] || '').toLowerCase()
      if (want === 'download') want = 'downloader'

      // menu <kategori> / menu semua
      if (want === 'semua') return ctx.reply(cats.map(c => compact(c, groups[c], p)).join('\n\n') + '\n\n' + footer(config, p))
      if (want) {
        const cat = cats.find(c => c.toLowerCase() === want)
        if (!cat) return ctx.reply(`Kategori "${want}" tidak ada.\nPilih: ${cats.map(c => c.toLowerCase()).join(', ')}`)
        return ctx.reply(detail(cat, groups[cat], p) + '\n\n' + footer(config, p))
      }

      const t = status.now()
      // cuaca dari cache; kalau belum ada, tunggu maksimal 1,2 detik (menu tidak boleh lambat karena cuaca)
      const cuaca = await Promise.race([status.weather(), new Promise(r => setTimeout(() => r(status.cachedWeather()), 1200))])
      const head = box(`🤖 ${config.botName}`, [`Halo ${ctx.pushName || 'kak'}! 👋`, `by ${brand.mark()}`])

      const style = db.get('menuStyle', config.menu?.style || 'teks')
      let done = false

      // POLLING: banner + polling pilihan kategori (bisa dipencet di semua WhatsApp)
      if (style === 'poll') {
        try {
          const hasMusic = config.menu?.music !== false && assets.music()
          const maxCats = hasMusic ? 11 : 12
          const shown = cats.slice(0, maxCats)
          const options = {}
          const names = shown.map(c => {
            const n = `${ICON[c] || '📌'} ${c}`
            options[n] = `#menu ${c.toLowerCase()}`
            return n
          })
          if (hasMusic) {
            names.push('🎵 Putar Musik')
            options['🎵 Putar Musik'] = '#menumusik'
          }
          await sendCard(ctx, head + '\n\nPilih kategori di polling bawah 👇\nAtau ketik: menu <kategori>', t, cuaca)
          const res = await ctx.sock.sendMessage(ctx.jid, { poll: { name: '📂 Pilih Kategori Menu', values: names, selectableCount: 1 } })
          if (!res?.key?.id) throw new Error('polling tidak terkirim')
          polls.register(res.key.id, { chat: ctx.jid, options })
          done = true
        } catch (e) {
          console.log('[menu] polling gagal:', e?.message || e)
        }
      }

      // tombol "Pilih kategori" di bawah pesan (native flow, tidak selalu bisa dipencet)
      if (!done && style === 'tombol') {
        try {
          const th = config.menu?.thumbnail !== false && assets.thumbnail()
          const image = th ? await assets.thumbJpeg(th) : null
          const rows = cats.map(c => ({
            header: ICON[c] || '📌',
            title: c,
            description: `${groups[c].length} perintah`,
            id: `#menu ${c.toLowerCase()}`
          }))
          rows.push({ header: '📋', title: 'Semua', description: 'Tampilkan semua perintah', id: '#menu semua' })
          await buttons.sendSelectMenu(
            ctx.sock,
            ctx.jid,
            {
              image,
              body: head + '\n\nPilih kategori di tombol bawah 👇',
              footer: 'Atau ketik: menu <kategori>',
              buttonTitle: '📂 Pilih Kategori',
              sectionTitle: 'Menu ' + config.botName,
              rows
            },
            ctx.m
          )
          done = true
        } catch (e) {
          console.log('[menu] tombol gagal, pakai teks:', e?.message || e)
        }
      }
      if (!done) {
        await sendCard(ctx, head + '\n\n' + cats.map(c => compact(c, groups[c], p)).join('\n\n') + '\n\n' + footer(config, p), t, cuaca)
      }
      // musik menu (voice note) otomatis menyusul setelah menu
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
  },
  {
    name: 'menustyle',
    category: 'Owner',
    ownerOnly: true,
    usage: 'teks/poll/tombol',
    desc: 'Gaya menu: teks, poll, atau tombol',
    async run(ctx) {
      const a = (ctx.args[0] || '').toLowerCase()
      if (['poll', 'tombol', 'teks'].includes(a)) ctx.db.set('menuStyle', a)
      const now = ctx.db.get('menuStyle', ctx.config.menu?.style || 'teks')
      await ctx.reply(`📋 Gaya menu: *${now}*\nUbah: ${ctx.prefix}menustyle teks / poll / tombol\n• teks = daftar berkelompok (bawaan, paling pasti jalan)\n• poll / tombol = percobaan, sering tidak bisa dipencet di bot`)
    }
  }
]
