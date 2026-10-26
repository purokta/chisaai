/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tim — daftar tag kelompok permanen (mis. "desain", "panitia"). Satu perintah untuk mention satu tim
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra'), { tag } = require('../../lib/grouputil')
const nm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20)
module.exports = {
  name: 'tim', alias: ['timgrup', 'tagtim', 'kelompokgrup'], category: 'group', noLimit: true, group: true, cmds: ['tim'],
  desc: 'Tim/kelompok tag permanen di grup: buat, tambah anggota, gabung sendiri, dan tag satu tim',
  run: async function (c) {
    const { m, sock, args, prefix, reply } = c, p = prefix + 'tim', sub = (args[0] || 'list').toLowerCase(), db = K.get(m.chat, 'tim', {}), save = () => K.set(m.chat, 'tim', db)
    const admin = () => { if (!E.isAdmin(c)) { reply(global.mess?.admin || 'Khusus admin grup.'); return false } return true }
    const mn = () => { const a = K.mentions(m); return a.length ? a : (m.quoted && (m.quoted.sender || m.quoted.participant) ? [m.quoted.sender || m.quoted.participant] : []) }
    const name = nm(args[1])
    if (['buat', 'tambah', 'keluarkan'].includes(sub)) {
      if (!admin()) return; if (!name) return reply(`✕ Format: ${p} ${sub} <nama tim> @anggota`)
      const t = mn(); if (!t.length && sub !== 'buat') return reply('✕ Mention anggotanya atau balas pesannya.')
      if (sub === 'buat') { if (db[name]) return reply(`Tim *${name}* sudah ada. Pakai ${p} tambah ${name} @anggota`); if (Object.keys(db).length >= 20) return reply('✕ Maksimal 20 tim per grup.'); db[name] = [...new Set(t)].slice(0, 100) }
      else { if (!db[name]) return reply(`✕ Tim *${name}* tidak ada.`); db[name] = sub === 'tambah' ? [...new Set([...db[name], ...t])].slice(0, 100) : db[name].filter(x => !t.includes(x)) }
      save(); return reply(`✦ Tim *${name}* sekarang ${db[name].length} anggota.`)
    }
    if (sub === 'gabung' || sub === 'lepas') {
      if (!name || !db[name]) return reply(`✕ Tim tidak ada. Lihat ${p} list`)
      db[name] = sub === 'gabung' ? [...new Set([...db[name], m.sender])] : db[name].filter(x => x !== m.sender); save(); return reply(`✦ ${sub === 'gabung' ? 'Kamu bergabung ke' : 'Kamu keluar dari'} tim *${name}*.`)
    }
    if (sub === 'hapus') { if (!admin()) return; if (!db[name]) return reply('✕ Tim tidak ada.'); delete db[name]; save(); return reply(`Tim *${name}* dihapus.`) }
    if (sub === 'tag') {
      if (!admin()) return; if (!db[name]) return reply(`✕ Tim tidak ada. Lihat ${p} list`); if (!db[name].length) return reply('Tim ini kosong.')
      const msg = args.slice(2).join(' ') || (m.quoted && (m.quoted.text || m.quoted.caption)) || 'Panggilan untuk tim'
      return sock.sendMessage(m.chat, { text: `✦ ${B('TIM ' + name.toUpperCase())}\n${msg}\n\n` + db[name].map(id => '◆ ' + tag(id)).join('\n'), mentions: db[name] }, { quoted: m })
    }
    if (sub === 'info' && db[name]) return sock.sendMessage(m.chat, { text: `✦ ${B('TIM ' + name.toUpperCase())} (${db[name].length})\n` + (db[name].map(id => '◆ ' + tag(id)).join('\n') || '_kosong_'), mentions: db[name] }, { quoted: m })
    const keys = Object.keys(db)
    return reply(keys.length ? `✦ ${B('DAFTAR TIM')}\n` + keys.map(k => `◆ *${k}* — ${db[k].length} anggota`).join('\n') + `\n\n_${p} gabung <tim> • lepas <tim> • info <tim>\nAdmin: buat • tambah • keluarkan • tag <tim> [pesan] • hapus_` : `✦ ${B('TIM')}\nBelum ada tim.\nAdmin: ${p} buat <nama> @anggota`)
  },
}
