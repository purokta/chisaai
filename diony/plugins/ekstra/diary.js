/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .diary — buku harian pribadi (khusus chat pribadi demi privasi)
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra')
module.exports = {
  name: 'diary', alias: ['harian', 'bukuharian', 'jurnaltulis'], category: 'ekstra', noLimit: true, private: true, cmds: ['diary'],
  desc: 'Buku harian pribadi (chat pribadi): .diary tulis • baca [tanggal] • cari <kata> • list • hapus <tanggal>',
  run: async ({ m, args, prefix, reply }) => {
    const db = K.get(m.sender, 'diary', {}), sub = (args[0] || 'baca').toLowerCase(), p = prefix + 'diary', today = K.dayKey()
    const save = () => { const keys = Object.keys(db).sort().slice(-400); K.set(m.sender, 'diary', Object.fromEntries(keys.map(k => [k, db[k]]))) }
    const dateOf = (s) => !s ? today : K.parseTanggal(s)
    if (['tulis', 'add', 'catat', 'isi'].includes(sub)) {
      const t = args.slice(1).join(' ').trim() || K.quotedText(m); if (!t) return reply(`✕ Tulis isinya.\nContoh: ${p} tulis Hari ini aku belajar sabar`)
      if (t.length > 900) return reply('✕ Maksimal 900 karakter per catatan.')
      const arr = db[today] = db[today] || []; if (arr.length >= 30) return reply('✕ Maksimal 30 catatan per hari.')
      arr.push({ t, at: E.timeWIB() }); save()
      return reply(`✦ Tersimpan (${E.timeWIB()} WIB)\n_${arr.length} catatan hari ini_`)
    }
    if (['list', 'daftar'].includes(sub)) {
      const ks = Object.keys(db).filter(k => db[k].length).sort().reverse().slice(0, 20)
      return reply(ks.length ? `✦ ${B('BUKU HARIAN')} (${Object.keys(db).length} hari)\n\n` + ks.map(k => `◇ ${K.fmtTanggal(k)} — ${db[k].length} catatan`).join('\n') : `Belum ada catatan. Mulai: ${p} tulis ...`)
    }
    if (['cari', 'search'].includes(sub)) {
      const w = args.slice(1).join(' ').toLowerCase().trim(); if (!w) return reply(`Format: ${p} cari <kata>`)
      const hit = []; for (const k of Object.keys(db).sort().reverse()) for (const e of db[k]) if (e.t.toLowerCase().includes(w)) hit.push(`◇ ${K.fmtTanggal(k)} ${e.at}\n   ${e.t.slice(0, 120)}${e.t.length > 120 ? '…' : ''}`)
      return reply(hit.length ? `✦ ${B('HASIL')} "${w}" (${hit.length})\n\n` + hit.slice(0, 8).join('\n') + (hit.length > 8 ? `\n\n_+${hit.length - 8} lainnya_` : '') : `Tidak ada catatan yang memuat "${w}".`)
    }
    if (['hapus', 'del'].includes(sub)) {
      const k = dateOf(args[1]); if (!k) return reply('✕ Tanggal tidak valid (YYYY-MM-DD, kemarin, hariini).')
      if (!db[k]) return reply('Tidak ada catatan di tanggal itu.'); if (args[2] !== 'ya') return reply(`Menghapus ${db[k].length} catatan ${K.fmtTanggal(k)}.\nKonfirmasi: ${p} hapus ${args[1] || 'hariini'} ya`)
      delete db[k]; save(); return reply('Catatan hari itu dihapus.')
    }
    const k = dateOf(sub === 'baca' ? args[1] : args[0]); if (!k) return reply('✕ Tanggal tidak valid (YYYY-MM-DD, kemarin, hariini).')
    const arr = db[k]; if (!arr || !arr.length) return reply(`Belum ada catatan untuk ${K.fmtTanggal(k)}.\nMulai: ${p} tulis ...`)
    return reply(`✦ ${B('DIARY')} — ${K.fmtTanggal(k)}\n\n` + arr.map(e => `◇ ${e.at}\n${e.t}`).join('\n\n') + `\n\n_${p} tulis • baca <tanggal> • cari <kata> • list_`)
  },
}
