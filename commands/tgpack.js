// Sticker pack Chisa di Telegram (dibuat lewat Bot API). Hanya Telegram.
const db = require('../lib/db')
const { createSticker, isWebm } = require('../lib/sticker')

const T = { platform: 'telegram', category: 'Stiker' }
const FILE = (buffer, name, mime) => ({ __file: true, buffer, name, mime })
const packOf = () => db.get('tgPack', null)
const link = name => `https://t.me/addstickers/${name}`
const nice = e => {
  const m = String(e?.message || e)
  if (/user not found|PEER_ID_INVALID|USER_ID_INVALID/i.test(m)) return 'Telegram menolak: pemilik pack belum pernah memulai bot. Buka chat pribadi dengan bot, tekan Start, lalu coba lagi.'
  if (/name is already occupied/i.test(m)) return 'Nama pack sudah dipakai.'
  return 'Gagal: ' + m.slice(0, 160)
}

module.exports = [
  {
    ...T,
    name: 'buatpack',
    aliases: ['createpack'],
    ownerOnly: true,
    desc: 'Buat sticker pack Chisa (stiker bawaan dari gambar karakter)',
    async run(ctx) {
      const api = ctx.sock.tgApi
      const me = ctx.sock.me?.username
      if (!me) return ctx.reply('Username bot tidak diketahui.')
      if (packOf()) return ctx.reply(`📦 Pack sudah ada:\n${link(packOf().name)}\n\nTambah stiker: reply foto/stiker dengan /tambahpack`)
      await ctx.react('⏳')
      const list = await require('../lib/chisapack').starter()
      const name = `chisa_by_${me}`
      const title = (ctx.config.telegram?.packTitle || 'Kuchiba Chisa by Shipur').slice(0, 64)
      const params = {
        user_id: Number(ctx.tgFrom),
        name,
        title,
        stickers: list.map((s, i) => ({ sticker: `attach://s${i}`, format: 'static', emoji_list: [s.emoji] }))
      }
      list.forEach((s, i) => (params['s' + i] = FILE(s.webp, `s${i}.webp`, 'image/webp')))
      try {
        await api.call('createNewStickerSet', params, { timeout: 120000 })
      } catch (e) {
        throw Object.assign(e, { userMessage: nice(e) })
      }
      db.set('tgPack', { name, title, owner: ctx.tgFrom, count: list.length })
      await ctx.react('✅')
      await ctx.send({ text: `📦 *Pack Chisa dibuat!* (${list.length} stiker)\n${link(name)}`, tgButtons: [[{ text: '➕ Tambahkan ke Telegram', url: link(name) }]] })
    }
  },
  {
    ...T,
    name: 'pack',
    aliases: ['stikerchisa', 'packchisa'],
    desc: 'Sticker pack resmi Chisa',
    async run(ctx) {
      const p = packOf()
      if (!p) return ctx.reply(`Belum ada pack Chisa.${ctx.isOwner ? '\nBuat dengan /buatpack' : ''}`)
      await ctx.send({ text: `📦 *${p.title}*\n${link(p.name)}`, tgButtons: [[{ text: '➕ Tambahkan ke Telegram', url: link(p.name) }]] })
    }
  },
  {
    ...T,
    name: 'tambahpack',
    ownerOnly: true,
    usage: '[emoji]',
    desc: 'Tambah stiker ke pack Chisa (reply foto/video/stiker)',
    async run(ctx) {
      const p = packOf()
      if (!p) return ctx.reply('Belum ada pack. Buat dulu dengan /buatpack')
      const t = ctx.mediaTarget()
      if (!t || !['image', 'video', 'sticker'].includes(t.type)) return ctx.reply('Reply *foto, video, atau stiker* dengan /tambahpack [emoji]')
      await ctx.react('⏳')
      const buf = await ctx.download(t.node, t.type)
      let data
      let format
      if (t.type === 'sticker') {
        if (isWebm(buf)) [data, format] = [buf, 'video']
        else if (buf.toString('ascii', 8, 12) === 'WEBP') [data, format] = [buf, 'static']
        else return ctx.reply('Stiker animasi (.tgs) tidak bisa ditambahkan lewat bot.')
      } else if (t.type === 'video') [data, format] = [await createSticker(buf, 'video', undefined, 'telegram'), 'video']
      else [data, format] = [await createSticker(buf, 'image', undefined, 'telegram'), 'static']
      const emoji = (ctx.args[0] || '😀').slice(0, 8)
      try {
        await ctx.sock.tgApi.call('addStickerToSet', {
          user_id: Number(p.owner),
          name: p.name,
          sticker: { sticker: 'attach://s0', format, emoji_list: [emoji] },
          s0: FILE(data, format === 'video' ? 's0.webm' : 's0.webp', format === 'video' ? 'video/webm' : 'image/webp')
        }, { timeout: 120000 })
      } catch (e) {
        throw Object.assign(e, { userMessage: nice(e) })
      }
      await ctx.react('✅')
      await ctx.reply(`✅ Ditambahkan ke pack:\n${link(p.name)}`)
    }
  },
  {
    ...T,
    name: 'hapuspack',
    ownerOnly: true,
    desc: 'Hapus stiker dari pack Chisa (reply stikernya)',
    async run(ctx) {
      const t = ctx.mediaTarget()
      const id = t?.node?._tg?.file_id
      if (!t || t.type !== 'sticker' || !id) return ctx.reply('Reply stiker (dari pack Chisa) dengan /hapuspack')
      try {
        await ctx.sock.tgApi.call('deleteStickerFromSet', { sticker: id })
      } catch (e) {
        throw Object.assign(e, { userMessage: 'Gagal menghapus: stiker itu bukan dari pack buatan bot ini.' })
      }
      await ctx.react('✅')
    }
  }
]
