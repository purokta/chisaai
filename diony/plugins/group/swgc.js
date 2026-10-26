/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .swgc — posting STATUS GRUP (status milik grup, tampil di info grup seperti status biasa).
//   .swgc <teks>                       status teks
//   kirim / reply foto, video, audio + .swgc [teks]   status media (teks = caption)
//   .swgc setting                      (owner) panel tombol: pilih target — grup ini / grup pilihan / semua grup
// Admin grup: status selalu ke grup tempat perintah dipakai. Owner: ikut target yang diatur lewat tombol
// (boleh dipakai dari chat pribadi). Bot tidak perlu admin.
const crypto = require('crypto')
const B = require('../../lib/baileys'), MP = require('../../lib/mediapick'), ST = require('../../lib/style'), ui = require('../../lib/menuui'), T = require('../../lib/swtarget')
const COLORS = [0xFF1F2937, 0xFF7C3AED, 0xFF0F766E, 0xFFB45309, 0xFFBE123C, 0xFF1D4ED8]
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const GAP = 3000, MAX_ROWS = 100
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const qr = (label, id) => ({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: ST.cut(label, 24), id }) })
let running = false

async function allGroups(sock) {
  const all = Object.values(await sock.groupFetchAllParticipating().catch(() => ({})))
  return all.sort((a, b) => String(a.subject || '').localeCompare(String(b.subject || '')))
}

async function sendPanel(sock, m, reply, prefix, note) {
  const groups = await allGroups(sock), cfg = T.get(m.sender)
  const byId = new Map(groups.map(g => [g.id, g]))
  const sel = cfg.ids.filter(id => byId.has(id))
  const now = cfg.mode === 'semua' ? `Semua grup (${groups.length})` : cfg.mode === 'pilih' ? `Grup pilihan (${sel.length})` : 'Grup tempat perintah dipakai saja'
  let t = `${ST.B('STATUS GRUP — TARGET')}\n${LINE}\n`
  if (note) t += `${note}\n\n`
  t += `${ST.B('Target saat ini')}: ${now}\n`
  if (cfg.mode === 'pilih' && sel.length) t += sel.slice(0, 10).map(id => `• ${byId.get(id).subject}`).join('\n') + (sel.length > 10 ? `\n• …dan ${sel.length - 10} lainnya` : '') + '\n'
  t += `${LINE}\n${prefix}swgc <teks>  : status teks\nKirim / reply media + ${prefix}swgc [caption]  : status media\n\n_Atur target lewat tombol di bawah._`
  const rows = groups.slice(0, MAX_ROWS).map(g => ({ header: '', title: ST.cut(`${sel.includes(g.id) ? '✓ ' : ''}${g.subject || 'tanpa nama'}`, 24), description: ST.cut(`${(g.participants || []).length} anggota${sel.includes(g.id) ? ' • terpilih' : ''}`, 72), id: `${prefix}swgc pilih ${g.id}` }))
  const sections = []
  for (let i = 0; i < rows.length; i += 10) sections.push({ title: ST.B(`Grup ${i + 1}-${Math.min(i + 10, rows.length)}`), rows: rows.slice(i, i + 10) })
  const btns = [qr(`${cfg.mode === 'ini' ? '✓ ' : ''}Grup ini saja`, `${prefix}swgc mode ini`), qr(`${cfg.mode === 'semua' ? '✓ ' : ''}Semua grup`, `${prefix}swgc mode semua`)]
  if (sections.length) btns.push({ name: 'single_select', buttonParamsJson: JSON.stringify({ title: ST.cut(`Pilih grup (${sel.length})`, 24), sections }) })
  if (sel.length) btns.push(qr('Kosongkan pilihan', `${prefix}swgc pilih reset`))
  if (groups.length > MAX_ROWS) t += `\n_Daftar tombol dibatasi ${MAX_ROWS} grup pertama._`
  try { await ui.sendInteractive(sock, m, null, t, global.settingsDefault.botname, btns) } catch (e) { console.log('[swgc panel]', e.message); await reply(t) }
}

module.exports = {
  name: 'swgc', alias: ['statusgrup', 'swgrup', 'sgc', 'upswgc'], category: 'group', cmds: ['swgc'],
  desc: 'Posting status grup (teks / foto / video / audio); owner bisa atur target lewat tombol: grup ini, grup pilihan, atau semua grup',
  admin: true,
  run: async ({ sock, m, reply, text, args, prefix, isCreator, isGroup }) => {
    const media = MP.pick(m), caption = String(text || '').trim()
    const a0 = String(args[0] || '').toLowerCase()

    // ── pengaturan target (owner) ──
    const isSet = !media && ((args.length === 1 && ['setting', 'atur', 'target'].includes(a0)) ||
      (args.length === 2 && a0 === 'mode' && ['ini', 'semua'].includes(String(args[1]).toLowerCase())) ||
      (args.length === 2 && a0 === 'pilih' && (String(args[1]).toLowerCase() === 'reset' || /@g\.us$/.test(args[1]))))
    if (isSet) {
      if (!isCreator) return reply(global.mess.owner)
      let note = ''
      if (a0 === 'mode') { T.setMode(m.sender, String(args[1]).toLowerCase()); note = `Target diubah: ${args[1].toLowerCase() === 'semua' ? 'semua grup' : 'grup ini saja'}.` }
      else if (a0 === 'pilih') {
        if (String(args[1]).toLowerCase() === 'reset') { T.clear(m.sender); note = 'Pilihan grup dikosongkan.' }
        else {
          const g = (await allGroups(sock)).find(x => x.id === args[1])
          if (!g) return reply('Grup itu tidak ditemukan (bot mungkin sudah keluar).')
          note = T.toggle(m.sender, g.id) ? `✓ ${g.subject} ditambahkan.` : `${g.subject} dihapus dari pilihan.`
        }
      }
      return sendPanel(sock, m, reply, prefix, note)
    }

    if (!media && !caption) {
      if (isCreator) return sendPanel(sock, m, reply, prefix)
      return reply(`${ST.B('STATUS GRUP')}\nGrup punya status sendiri, seperti status WhatsApp biasa.\n\n${prefix}swgc <teks>  : status teks\nKirim / reply foto, video, atau audio dengan ${prefix}swgc [caption]  : status media\n\n_Khusus admin grup._`)
    }

    // ── tentukan target ──
    let targets, names = new Map()
    const cfg = isCreator ? T.get(m.sender) : { mode: 'ini', ids: [] }
    if (cfg.mode === 'ini') {
      if (!isGroup) return reply(`Kamu sedang di chat pribadi, jadi target "grup ini" tidak ada.\nAtur target dulu: ${prefix}swgc setting`)
      targets = [m.chat]
    } else {
      const groups = await allGroups(sock); names = new Map(groups.map(g => [g.id, g.subject]))
      targets = cfg.mode === 'semua' ? groups.map(g => g.id) : cfg.ids.filter(id => names.has(id))
      if (!targets.length) return reply(cfg.mode === 'semua' ? 'Bot belum ada di grup mana pun.' : `Belum ada grup yang dipilih.\nPilih lewat tombol: ${prefix}swgc setting`)
    }
    if (running) return reply('Status grup sebelumnya masih diproses. Tunggu selesai dulu ya.')

    running = true
    try {
      let msg
      if (media) {
        const buf = await MP.download(media)
        if (!buf || !buf.length) return reply('Gagal mengunduh media.')
        const mime = media.mimetype || (media.kind === 'image' ? 'image/jpeg' : media.kind === 'video' ? 'video/mp4' : 'audio/mpeg')
        msg = media.kind === 'audio' ? { audio: buf, mimetype: mime, ptt: false } : { [media.kind]: buf, mimetype: mime, ...(caption ? { caption } : {}) }
      } else msg = { text: caption }
      const content = await B.generateWAMessageContent(msg, { upload: sock.waUploadToServer })   // diunggah sekali, dipakai untuk semua grup
      if (!media && content.extendedTextMessage) Object.assign(content.extendedTextMessage, { backgroundArgb: COLORS[Math.floor(Math.random() * COLORS.length)], font: 1 })
      if (targets.length > 1) await reply(`Membuat status di ${targets.length} grup, perkiraan ${Math.max(1, Math.ceil(targets.length * GAP / 60000))} menit (jeda 3 detik per grup)...`)
      let ok = 0; const fail = []
      for (let i = 0; i < targets.length; i++) {
        const jid = targets[i]
        try {
          const full = B.generateWAMessageFromContent(jid, {
            messageContextInfo: { messageSecret: crypto.randomBytes(32) },
            groupStatusMessageV2: { message: content },
          }, { userJid: sock.user && sock.user.id })
          await sock.relayMessage(jid, full.message, { messageId: full.key.id })
          ok++
        } catch (e) { console.log('[swgc]', jid, e.message); fail.push(names.get(jid) || jid) }
        if (i < targets.length - 1) await sleep(GAP)
      }
      if (targets.length === 1) return reply(ok ? '✅ Status grup terkirim.' : 'Gagal membuat status grup.\n_Pastikan WhatsApp-mu sudah mendukung status grup._')
      return reply(`✅ Status grup selesai.\nBerhasil: ${ok}\nGagal: ${fail.length}${fail.length ? '\n' + fail.slice(0, 8).map(n => `• ${n}`).join('\n') + (fail.length > 8 ? `\n• …dan ${fail.length - 8} lainnya` : '') : ''}`)
    } catch (e) {
      console.log('[swgc]', e.message)
      reply('Gagal membuat status grup: ' + e.message + '\n_Pastikan WhatsApp-mu sudah mendukung status grup._')
    } finally { running = false }
  },
}
