/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .greet — atur sambutan otomatis (bot menyapa Dev/Owner/user ber-rank tinggi/clan/party top saat mereka mengetik)
//   .greet                       status
//   .greet on|off                (admin grup) nyalakan/matikan di grup ini
//   .greet test <jenis>          pratinjau sambutan memakai datamu (admin/owner) — .greet jenis = daftar
//   .greet global on|off         (Dev) saklar seluruh bot
//   .greet min <F..EX>           (Dev) rank minimum untuk sambutan rank biasa (default A)
//   .greet cd <normal|owner|dev> <menit>   (Dev) jeda sambutan per orang per chat
const GR = require('../../lib/greet'), R = require('../../lib/rpg'), X = require('../../lib/rpgextra')

module.exports = {
  name: 'greet', alias: ['sambutan', 'sambut'], category: 'group', noLimit: true, cmds: ['greet'],
  desc: 'Sambutan otomatis untuk Dev/Owner/rank tinggi/clan/party: .greet on|off|test|jenis',
  run: async ({ sock, m, args, prefix, reply, isGroup, isAdmins, isCreator, isDev, pushname }) => {
    const d = GR.cfg(), a = (args[0] || '').toLowerCase(), b = (args[1] || '').toLowerCase()
    const onTxt = (v) => v ? 'AKTIF' : 'MATI'

    if (!a || a === 'status') {
      const here = isGroup ? `\nGrup ini: *${onTxt(d.chats[m.chat] !== false)}*` : ''
      return reply(`✦ *SAMBUTAN OTOMATIS*\nSaklar global: *${onTxt(d.on)}*${here}\nRank minimum: *${d.min}*\nJeda: user ${d.cd.normal}m • owner ${d.cd.owner}m • dev ${d.cd.dev}m\n\n_${prefix}greet on|off • ${prefix}greet test <jenis> • ${prefix}greet jenis_`)
    }
    if (a === 'jenis' || a === 'kinds') return reply(`✦ *JENIS SAMBUTAN*\n${GR.KINDS.map(k => `• ${k}`).join('\n')}\n\n_Pratinjau: ${prefix}greet test dev_`)

    if (a === 'on' || a === 'off') {
      if (!isGroup) return reply('Gunakan di dalam grup.')
      if (!isAdmins && !isCreator) return reply(global.mess.admin)
      d.chats[m.chat] = a === 'on'; GR.save()
      return reply(`✦ Sambutan otomatis di grup ini *${onTxt(a === 'on')}*.`)
    }
    if (a === 'test') {
      if (isGroup && !isAdmins && !isCreator) return reply(global.mess.admin)
      const kind = b; if (!GR.KINDS.includes(kind)) return reply(`Pilih jenis: ${GR.KINDS.join(', ')}`)
      const u = R.get(m.sender)
      const fake = u || { id: m.sender, name: pushname, level: 55, exp: 0, kills: 0, wins: 0, losses: 0, a: { str: 0, def: 0, agi: 0, int: 0 }, cls: 'swordsman', eq: {}, comp: { owned: {}, active: null }, inv: {}, cd: {}, clan: null }
      const text = GR.build(kind, m.sender, pushname, fake, 2)
      return sock.sendMessage(m.chat, { text: text + `\n\n_(pratinjau — jenis: ${kind})_`, mentions: [m.sender] }, { quoted: m })
    }
    if (!isDev) return reply('*Khusus Dev.* Pengaturan ini hanya untuk pemilik utama bot.')
    if (a === 'global') {
      if (!['on', 'off'].includes(b)) return reply(`Contoh: ${prefix}greet global on|off`)
      d.on = b === 'on'; GR.save(); return reply(`✦ Sambutan otomatis (global) *${onTxt(d.on)}*.`)
    }
    if (a === 'min') {
      const t = (args[1] || '').toUpperCase(); if (!GR.ORDER.includes(t)) return reply(`Contoh: ${prefix}greet min S\nPilihan: ${GR.ORDER.join(' ')}`)
      d.min = t; GR.save(); return reply(`✦ Rank minimum sambutan: *${t}*`)
    }
    if (a === 'cd') {
      const who = b, n = parseInt(args[2])
      if (!['normal', 'owner', 'dev'].includes(who) || !(n >= 1 && n <= 1440)) return reply(`Contoh: ${prefix}greet cd dev 60  (menit, 1-1440)\nTarget: normal | owner | dev`)
      d.cd[who] = n; GR.save(); return reply(`✦ Jeda sambutan *${who}* = ${n} menit.`)
    }
    return reply(`Perintah tidak dikenal. Ketik ${prefix}greet`)
  },
}
