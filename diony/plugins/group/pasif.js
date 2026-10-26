/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .pasif — Pusat Kontrol Fitur Pasif (fitur yang hidup TANPA command). Logika ada di lib/pasif.js.
//   .pasif                    daftar semua fitur pasif + statusnya di chat ini
//   .pasif <fitur>            detail satu fitur
//   .pasif <fitur> on|off     nyalakan / matikan (admin grup)
//   .pasif semua on|off       semua fitur chat ini sekaligus
//   .pasif reset              kembali ke bawaan
//   .pasif master on|off      (owner) saklar induk seluruh fitur pasif di semua chat
const P = require('../../lib/pasif'), { B } = require('../../lib/style')

const EXISTING = ['AFK otomatis', 'Anti Link (.antilink)', 'Anti Toxic', 'Anti Spam (.antispam)', 'Anti Delete & Anti View-Once', 'Welcome / Goodbye', 'Level & XP grup', 'Auto Responder (.addrespon)', 'Sapaan Dev/Owner', 'Jawaban game (tebak, kuis, dll)']

module.exports = {
  name: 'pasif', alias: ['otomatis', 'fiturpasif', 'autofitur'], category: 'group', noLimit: true, cmds: ['pasif'],
  desc: 'Pusat kontrol fitur pasif: fitur yang hidup tanpa command (salam, kalkulator otomatis, anti virtex, dll)',
  run: async ({ m, args, prefix, reply, isGroup, isAdmins, isCreator }) => {
    const chat = m.chat, a0 = String(args[0] || '').toLowerCase(), a1 = String(args[1] || '').toLowerCase()
    const onOff = (s) => (/^(on|aktif|nyala|hidup|1|ya)$/.test(s) ? true : /^(off|mati|nonaktif|0|tidak)$/.test(s) ? false : null)
    const canSet = isAdmins || isCreator
    if (!isGroup && a0 !== 'master') return reply('✕ Fitur pasif khusus grup — bot tidak membalas otomatis di chat pribadi. Pakai .pasif di dalam grup.')

    // ── .pasif master on|off (owner) ──
    if (a0 === 'master') {
      if (!isCreator) return reply(global.mess.owner)
      const v = onOff(a1); if (v === null) return reply(`Saklar induk: *${P.master() ? 'ON' : 'OFF'}*\nPakai: ${prefix}pasif master on|off`)
      P.setMaster(v); return reply(`✦ Saklar induk fitur pasif: *${v ? 'ON' : 'OFF'}*${v ? '' : '\n_Semua fitur pasif berhenti di semua chat sampai dinyalakan lagi._'}`)
    }
    // ── .pasif reset ──
    if (a0 === 'reset') { if (!canSet) return reply(global.mess.admin); P.reset(chat); return reply('✦ Pengaturan fitur pasif chat ini dikembalikan ke bawaan.') }
    // ── .pasif semua on|off ──
    if (a0 === 'semua' || a0 === 'all') {
      const v = onOff(a1); if (v === null) return reply(`Pakai: ${prefix}pasif semua on|off`)
      if (!canSet) return reply(global.mess.admin)
      let n = 0; for (const f of P.list(chat, isGroup)) { P.set(chat, f.key, v); n++ }
      return reply(`✦ ${n} fitur pasif ${v ? 'DINYALAKAN' : 'DIMATIKAN'} di chat ini.${v && isGroup ? '\n_Fitur keamanan hanya bisa menghapus pesan bila bot menjadi admin grup._' : ''}`)
    }
    // ── .pasif <fitur> [on|off] ──
    if (a0) {
      const key = P.aliasOf(a0); if (!key) return reply(`✕ Fitur "${a0}" tidak dikenal. Ketik *${prefix}pasif* untuk daftar.`)
      const f = P.BY[key], v = onOff(a1)
      if (v === null) return reply(`✦ ${B(f.title.toUpperCase())}\n${P.isOn(chat, key, isGroup) ? '◆ AKTIF' : '◇ MATI'}${''} • bawaan: ${P.defOf(f, isGroup) ? 'aktif' : 'mati'}\n\n${f.desc}\n\n_${prefix}pasif ${key} on | off_`)
      if (!canSet) return reply(global.mess.admin)
      P.set(chat, key, v)
      return reply(`✦ *${f.title}* ${v ? 'dinyalakan' : 'dimatikan'} di grup ini.${v && f.mod && isGroup ? '\n_Menghapus pesan hanya bisa bila bot admin grup; admin & owner tidak pernah terkena._' : ''}`)
    }
    // ── daftar ──
    const rows = P.list(chat, isGroup), groups = [...new Set(rows.map(r => r.group))]
    let t = `✦ ${B('FITUR PASIF')} — hidup tanpa command\n${P.master() ? '' : '⚠️ _Saklar induk OFF: semua fitur pasif sedang berhenti._\n'}`
    for (const g of groups) { t += `\n❖ ${g.toUpperCase()}\n`; for (const r of rows.filter(x => x.group === g)) t += `${r.on ? '◆' : '◇'} *${r.key}* — ${r.title}\n` }
    t += `\n◆ aktif • ◇ mati\n${prefix}pasif <fitur> on|off (admin)\n${prefix}pasif <fitur> → detail • ${prefix}pasif semua on|off\n`
    t += `\n_Pasif lama yang tetap berjalan: ${EXISTING.join(', ')}._`
    return reply(t)
  },
  // fitur pasif: dijalankan untuk setiap pesan biasa (non-perintah). Mengembalikan true hanya bila pesan dihapus.
  before: async (ctx) => P.handle(ctx),
}
