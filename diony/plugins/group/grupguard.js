/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PENJAGA GRUP (per grup, diatur admin; bot harus admin agar bisa menghapus / mengeluarkan)
//   .antilink <off|on|semua|kick>   hapus link grup WA (on) / semua link (semua) / hapus + keluarkan (kick)
//   .antitoxic <on|off>             hapus kata kasar bawaan bot
//   .addfilter <kata>  .delfilter <kata>  .listfilter     kata terlarang khusus grup ini
//   .mute @user  .unmute @user  .listmute                 anggota dibisukan: pesannya dihapus & perintahnya diabaikan
//   .slowmode <detik|off>                                 jeda minimal antar pesan tiap anggota (3-3600 detik)
//   .botoff  .boton                                       bot hanya melayani admin di grup ini / kembali melayani semua
//   .grupsetting                                          ringkasan semua pengaturan penjaga grup ini
const GG = require('../../lib/grupdb'), { targets, tag } = require('../../lib/grouputil'), { B } = require('../../lib/style')
const last = new Map()
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const LINK_WA = /chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/i
const LINK_ANY = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|id|co|io|me|xyz|link|site|online|my\.id|co\.id)\b\/?\S*/i
const ADMIN_ONLY = new Set(['antilink', 'antitoxic', 'addfilter', 'delfilter', 'mute', 'unmute', 'slowmode', 'botoff', 'boton'])

module.exports = {
  name: 'antilink', alias: ['antitoxic', 'addfilter', 'delfilter', 'listfilter', 'mute', 'unmute', 'listmute', 'slowmode', 'botoff', 'boton', 'grupsetting', 'gcsetting'],
  category: 'group', group: true, noLimit: true,
  cmds: ['antilink', 'antitoxic', 'addfilter', 'delfilter', 'listfilter', 'mute', 'unmute', 'listmute', 'slowmode', 'botoff', 'boton', 'grupsetting'],
  desc: 'Penjaga grup: antilink, antitoxic, filter kata, mute, slowmode, bot on/off per grup',
  run: async ({ sock, m, reply, text, args, command, prefix, isAdmins, isBotAdmins, isCreator }) => {
    if (ADMIN_ONLY.has(command) && !isAdmins && !isCreator) return reply(global.mess.admin)
    const g = GG.get(m.chat), warnBot = isBotAdmins ? '' : '\n\n_Catatan: bot belum jadi admin, jadi belum bisa menghapus pesan / mengeluarkan anggota._'
    const v = (args[0] || '').toLowerCase()

    if (command === 'antilink') {
      const modes = { off: 'off', mati: 'off', on: 'on', hidup: 'on', semua: 'semua', all: 'semua', kick: 'kick', keluarkan: 'kick' }
      if (!modes[v]) return reply(`Antilink grup ini: *${g.antilink || 'off'}*\n\n${prefix}antilink on — hapus link grup WhatsApp\n${prefix}antilink semua — hapus SEMUA link\n${prefix}antilink kick — hapus link grup WA + keluarkan pengirim\n${prefix}antilink off — matikan\n\n_Admin grup tidak terkena._`)
      g.antilink = modes[v]; GG.save(); return reply(`Antilink diatur ke *${g.antilink}*.${g.antilink !== 'off' ? warnBot : ''}`)
    }
    if (command === 'antitoxic') {
      if (!['on', 'off'].includes(v)) return reply(`Antitoxic grup ini: *${g.antitoxic ? 'on' : 'off'}*\nUbah: ${prefix}antitoxic on | off`)
      g.antitoxic = v === 'on'; GG.save(); return reply(`Antitoxic ${g.antitoxic ? 'dihidupkan' : 'dimatikan'}.${g.antitoxic ? warnBot : ''}`)
    }
    if (command === 'addfilter' || command === 'delfilter') {
      const w = String(text || '').trim().toLowerCase().slice(0, 40); if (!w) return reply(`Tulis katanya.\nContoh: ${prefix}${command} judi`)
      g.filter = g.filter || []
      if (command === 'addfilter') { if (g.filter.includes(w)) return reply('Kata itu sudah ada di filter.'); if (g.filter.length >= 60) return reply('Maksimal 60 kata per grup.'); g.filter.push(w); GG.save(); return reply(`Kata *${w}* ditambahkan ke filter (${g.filter.length}).${warnBot}`) }
      if (!g.filter.includes(w)) return reply('Kata itu tidak ada di filter.'); g.filter = g.filter.filter(x => x !== w); GG.save(); return reply(`Kata *${w}* dihapus dari filter.`)
    }
    if (command === 'listfilter') return reply((g.filter || []).length ? `${B('KATA TERLARANG GRUP')} (${g.filter.length})\n━━━━━━━━━━━━━━━━━━━━\n` + g.filter.map((w, i) => `${i + 1}. ${w}`).join('\n') : `Belum ada filter kata. Tambah: ${prefix}addfilter <kata>`)

    if (command === 'mute' || command === 'unmute') {
      const list = targets(m, text); if (!list.length) return reply(`Tandai orangnya atau reply pesannya.\nContoh: ${prefix}${command} @user`)
      const admins = (await sock.groupMetadata(m.chat).catch(() => ({ participants: [] }))).participants.filter(p => p.admin).map(p => p.id)
      g.mute = g.mute || []; const out = []
      for (const j of list) {
        if (command === 'mute') { if (admins.includes(j)) out.push(`${tag(j)} admin, tidak bisa dimute`); else if (g.mute.includes(j)) out.push(`${tag(j)} sudah dimute`); else { g.mute.push(j); out.push(`${tag(j)} dimute`) } }
        else { if (g.mute.includes(j)) { g.mute = g.mute.filter(x => x !== j); out.push(`${tag(j)} dibuka mutenya`) } else out.push(`${tag(j)} tidak sedang dimute`) }
      }
      GG.save(); return sock.sendMessage(m.chat, { text: out.join('\n') + (command === 'mute' ? warnBot : ''), mentions: list }, { quoted: m })
    }
    if (command === 'listmute') { const l = g.mute || []; return sock.sendMessage(m.chat, { text: l.length ? `${B('ANGGOTA DIMUTE')} (${l.length})\n━━━━━━━━━━━━━━━━━━━━\n` + l.map((j, i) => `${i + 1}. ${tag(j)}`).join('\n') : 'Tidak ada anggota yang dimute.', mentions: l }, { quoted: m }) }

    if (command === 'slowmode') {
      if (['off', 'mati', '0'].includes(v)) { g.slow = 0; GG.save(); return reply('Slowmode dimatikan.') }
      const n = parseInt(v, 10); if (!(n >= 3 && n <= 3600)) return reply(`Slowmode grup ini: *${g.slow ? g.slow + ' detik' : 'off'}*\nContoh: ${prefix}slowmode 10  (tiap anggota harus menunggu 10 detik antar pesan)\n${prefix}slowmode off`)
      g.slow = n; GG.save(); return reply(`Slowmode aktif: jeda *${n} detik* antar pesan per anggota (admin bebas).${warnBot}`)
    }
    if (command === 'botoff' || command === 'boton') {
      g.off = command === 'botoff'; GG.save()
      return reply(g.off ? `Bot dimatikan untuk anggota biasa di grup ini. Hanya admin yang dilayani.\nNyalakan lagi: ${prefix}boton` : 'Bot kembali melayani semua anggota di grup ini.')
    }
    // grupsetting
    const yn = (b) => b ? 'aktif' : 'mati'
    const jd = g.jadwal || {}
    return reply(`${B('PENGATURAN GRUP')}\n━━━━━━━━━━━━━━━━━━━━\nAntilink  : ${g.antilink || 'off'}\nAntitoxic : ${yn(g.antitoxic)}\nFilter    : ${(g.filter || []).length} kata\nMute      : ${(g.mute || []).length} anggota\nSlowmode  : ${g.slow ? g.slow + ' detik' : 'off'}\nBot       : ${g.off ? 'hanya admin' : 'semua anggota'}${g.ban ? ' (DIBLOKIR OWNER)' : ''}\nWelcome   : ${g.welcome === undefined ? 'ikut pengaturan bot' : yn(g.welcome)}${g.welcomeText ? ' • teks khusus' : ''}\nGoodbye   : ${g.goodbye === undefined ? 'ikut pengaturan bot' : yn(g.goodbye)}${g.goodbyeText ? ' • teks khusus' : ''}\nJadwal    : buka ${jd.open || '-'} • tutup ${jd.close || '-'}`)
  },

  before: async ({ sock, m, budy, isGroup, isAdmins, isBotAdmins, isCreator }) => {
    if (!isGroup || m.key.fromMe) return false
    const g = GG.get(m.chat); if (!g || isAdmins || isCreator) return false
    const del = () => sock.sendMessage(m.chat, { delete: m.key }).catch(() => {})
    const say = (t) => sock.sendMessage(m.chat, { text: t, mentions: [m.sender] }).catch(() => {})
    if (g.mute && g.mute.includes(m.sender)) { if (isBotAdmins) await del(); return true }
    if (!isBotAdmins) return false
    if (g.slow) {
      const k = m.chat + m.sender, now = Date.now(), prev = last.get(k) || 0
      if (now - prev < g.slow * 1000) { await del(); return true }
      last.set(k, now)
    }
    const t = String(budy || ''); if (!t) return false
    const mode = g.antilink || 'off'
    if (mode !== 'off' && (mode === 'semua' ? LINK_ANY.test(t) : LINK_WA.test(t))) {
      await del()
      if (mode === 'kick' && LINK_WA.test(t)) { await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {}); await say(`${tag(m.sender)} dikeluarkan karena mengirim link grup.`) }
      else await say(`${tag(m.sender)} dilarang mengirim ${mode === 'semua' ? 'link' : 'link grup'} di sini.`)
      return true
    }
    const words = [...(g.antitoxic ? (global.toxicWords || []) : []), ...(g.filter || [])]
    if (words.length && words.some(w => new RegExp(`(^|[^a-z0-9])${esc(String(w).toLowerCase())}([^a-z0-9]|$)`, 'i').test(t))) {
      await del(); await say(`${tag(m.sender)} jaga bicara ya, pesanmu dihapus.`); return true
    }
    return false
  },
}
